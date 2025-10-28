import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
import json
import os
import sys
import mysql.connector
import numpy as np
from config import Config


def load_model(config):
    model = CLIPModel.from_pretrained(config.model_dir)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    model = model.to(config.device)
    model.eval()
    return model, processor


def get_product_images(product_id, config):
    conn = mysql.connector.connect(**config.db_config)
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT image_id, product_id, image_url
        FROM images
        WHERE product_id = %s
    """
    
    cursor.execute(query, (product_id,))
    images = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return images


def extract_features(model, processor, image_path, device):
    try:
        image = Image.open(image_path).convert('RGB')
        inputs = processor(images=image, return_tensors="pt")
        pixel_values = inputs['pixel_values'].to(device)
        
        with torch.no_grad():
            features = model.get_image_features(pixel_values=pixel_values)
        
        features = torch.nn.functional.normalize(features, p=2, dim=1)
        return features.cpu().numpy()[0]
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return None


def save_features_to_db(features, product_id, config):
    conn = mysql.connector.connect(**config.db_config)
    cursor = conn.cursor()
    
    delete_query = "DELETE FROM product_image_features WHERE product_id = %s"
    cursor.execute(delete_query, (product_id,))
    
    insert_query = """
        INSERT INTO product_image_features 
        (image_id, product_id, features)
        VALUES (%s, %s, %s)
    """
    
    for feat in features:
        features_json = json.dumps(feat['features'])
        cursor.execute(insert_query, (
            feat['image_id'],
            feat['product_id'],
            features_json
        ))
    
    conn.commit()
    cursor.close()
    conn.close()


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_single_product.py <product_id>", file=sys.stderr)
        sys.exit(1)
    
    try:
        product_id = int(sys.argv[1])
    except ValueError:
        print("Error: product_id must be integer", file=sys.stderr)
        sys.exit(1)
    
    config = Config()
    
    print(f"Extracting features for product {product_id}...", file=sys.stderr)
    
    # Get images
    images = get_product_images(product_id, config)
    
    if len(images) == 0:
        print(f"No images found for product {product_id}", file=sys.stderr)
        sys.exit(0)
    
    print(f"Found {len(images)} images", file=sys.stderr)
    
    # Load model
    print("Loading model...", file=sys.stderr)
    model, processor = load_model(config)
    
    # Extract features
    results = []
    success = 0
    
    for img in images:
        image_url = img['image_url']
        
        if not image_url or not image_url.startswith('/public/uploads/'):
            continue
        
        filename = image_url.replace('/public/uploads/', '')
        image_path = os.path.join(config.backend_uploads, filename)
        
        if not os.path.exists(image_path):
            print(f"Image not found: {image_path}", file=sys.stderr)
            continue
        
        features = extract_features(model, processor, image_path, config.device)
        
        if features is not None:
            results.append({
                'image_id': img['image_id'],
                'product_id': img['product_id'],
                'features': features.tolist()
            })
            success += 1
    
    # Save to DB
    if len(results) > 0:
        save_features_to_db(results, product_id, config)
        print(f"Success: Extracted {success} features", file=sys.stderr)
        
        # Output JSON for backend
        output = {
            'success': True,
            'product_id': product_id,
            'features_count': success
        }
        print(json.dumps(output))
    else:
        print("No features extracted", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
