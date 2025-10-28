import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
import json
import numpy as np
import sys
import os
import mysql.connector
from sklearn.neighbors import NearestNeighbors
from config import Config


def load_model(config):
    model = CLIPModel.from_pretrained(config.model_dir)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    model = model.to(config.device)
    model.eval()
    return model, processor


def extract_query_features(image_path, model, processor, device):
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


def load_features_from_db(config):
    conn = mysql.connector.connect(**config.db_config)
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT image_id, product_id, features
        FROM product_image_features
        ORDER BY id
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    all_features = []
    product_ids = []
    
    for row in rows:
        features = json.loads(row['features'])
        all_features.append(features)
        product_ids.append(row['product_id'])
    
    return all_features, product_ids


def build_search_index(all_features):
    feature_matrix = np.array(all_features, dtype=np.float32)
    
    n_neighbors = min(50, len(all_features))
    neighbors = NearestNeighbors(n_neighbors=n_neighbors, metric='cosine', algorithm='brute')
    neighbors.fit(feature_matrix)
    
    return neighbors


def search_similar_products(query_features, neighbors, product_ids, top_k):
    distances, indices = neighbors.kneighbors([query_features])

    seen = set()
    results = []
    
    for dist, idx in zip(distances[0], indices[0]):
        pid = product_ids[idx]
        
        if pid not in seen:
            seen.add(pid)
            results.append(pid)
            
            if len(results) >= top_k:
                break
    
    return results

def main():
    if len(sys.argv) < 2:
        print("Usage: python image_search.py <image_path>")
        sys.exit(1)
    
    query_image_path = sys.argv[1]
    
    if not os.path.exists(query_image_path):
        print(f"Error: Image not found: {query_image_path}", file=sys.stderr)
        sys.exit(1)
    
    config = Config()
    
    print("loading model...", file=sys.stderr)
    model, processor = load_model(config)
    
    print("loading features from database...", file=sys.stderr)
    all_features, product_ids = load_features_from_db(config)
    print(f"loaded {len(all_features)} image features", file=sys.stderr)
    
    print("building search index...", file=sys.stderr)
    neighbors = build_search_index(all_features)
    
    print("extracting query features...", file=sys.stderr)
    query_features = extract_query_features(
        query_image_path, model, processor, config.device
    )
    
    if query_features is None:
        print("Error: Failed to extract features", file=sys.stderr)
        sys.exit(1)
    
    print("searching...", file=sys.stderr)
    result_ids = search_similar_products(
        query_features, neighbors, product_ids, config.top_k
    )
    
    output = {
        'success': True,
        'total': len(result_ids),
        'product_ids': result_ids
    }
    
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
