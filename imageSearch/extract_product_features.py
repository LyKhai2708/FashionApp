

import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
import json
import os
import mysql.connector
import numpy as np
from config import Config


def load_trained_model(config):

    
    if not os.path.exists(config.model_dir):
        raise FileNotFoundError(f"Model không tồn tại: {config.model_dir}")
    

    
    model = CLIPModel.from_pretrained(config.model_dir)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    
    model = model.to(config.device)
    model.eval()

    
    
    return model, processor


def get_images_from_database(config):
    print("loading images")

    
    conn = mysql.connector.connect(**config.db_config)
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT 
            i.image_id,
            i.product_id,
            i.image_url,
            p.name as product_name
        FROM images i
        JOIN products p ON i.product_id = p.product_id
        WHERE p.del_flag = 0
        ORDER BY i.product_id, i.image_id
    """
    
    cursor.execute(query)
    images = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    print(f"loaded {len(images)} images")
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
        return None


def extract_all_features(model, processor, images, config):
    print("extracting features")
    
    results = []
    success = 0
    fail = 0
    
    for i, img in enumerate(images, 1):
        image_id = img['image_id']
        product_id = img['product_id']
        image_url = img['image_url']
        product_name = img['product_name']
        
        print(f"[{i}/{len(images)}] ID:{image_id} | {product_name[:30]} | {image_url}", end="")
        
        if not image_url or not image_url.startswith('/public/uploads/'):
            fail += 1
            continue
        
        filename = image_url.replace('/public/uploads/', '')
        image_path = os.path.join(config.backend_uploads, filename)
        
        if not os.path.exists(image_path):
            fail += 1
            continue
        
        features = extract_features(model, processor, image_path, config.device)
        
        if features is not None:
            results.append({
                'image_id': image_id,
                'product_id': product_id,
                'features': features.tolist()
            })
            success += 1
        else:
            fail += 1
    
    return results

def save_features_to_db(features, config):
    
    print("SAVING TO DATABASE")
    print("="*70)
    
    conn = mysql.connector.connect(**config.db_config)
    cursor = conn.cursor()
    
    print("Clearing old data...")
    cursor.execute("DELETE FROM product_image_features")
    conn.commit()
    
    print(f"Inserting {len(features)} records...")
    
    query = """
        INSERT INTO product_image_features 
        (image_id, product_id, features)
        VALUES (%s, %s, %s)
    """
    
    for i, feat in enumerate(features, 1):
        features_json = json.dumps(feat['features'])
        cursor.execute(query, (
            feat['image_id'],
            feat['product_id'],
            features_json
        ))
        
        if i % 10 == 0 or i == len(features):
            print(f"  {i}/{len(features)}...")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Saved {len(features)} features")



def main():
    config = Config()
    
    
    model, processor = load_trained_model(config)
    images = get_images_from_database(config)
    
    if len(images) == 0:
        print("no images found!")
        return
    
    features = extract_all_features(model, processor, images, config)
    
    if len(features) == 0:
        print("no features extracted!")
        return
    
    save_features_to_db(features, config)
    
    print("completed!")


if __name__ == '__main__':
    main()
