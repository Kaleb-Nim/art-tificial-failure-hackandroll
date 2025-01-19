import pytest
import os
import base64
import json
from loguru import logger
from fastapi.testclient import TestClient
from app.main import app
from app.model import PredictionRequest

client = TestClient(app)

def load_image_as_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def validate_predictions(predictions):
    """Validate that all predictions have single-word labels"""
    for pred in predictions:
        assert len(pred.get('label', '').split()) == 1, f"Label '{pred.get('label')}' contains multiple words"
        assert 0 <= pred.get('confidence', 0) <= 1, "Confidence score must be between 0 and 1"
        assert pred.get('reason'), "Reason must not be empty"

def test_predict_openai_endpoint():
    # Prepare test images from the tests/images directory
    image_dir = os.path.join(os.path.dirname(__file__), 'images')
    test_images = []
    
    for filename in os.listdir(image_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(image_dir, filename)
            image_format = f"image/{filename.split('.')[-1].lower()}"
            if image_format == 'image/jpg':
                image_format = 'image/jpeg'
                
            test_images.append({
                "image_id": f"test_{filename}",
                "base64_data": load_image_as_base64(image_path),
                "format": image_format
            })
    
    # Prepare the request payload
    request_data = {
        "images": test_images,
        "model": "openai",
        "top_k": 3,
        "confidence_threshold": 0.1
    }
    
    # Log the request data
    logger.info("Request Data:")
    # logger.info(json.dumps(request_data, indent=2))
    
    # Make the request
    response = client.post("/api/v1/predict", json=request_data)
    
    # Log the response for debugging
    logger.info("Response Status Code: {}", response.status_code)
    # logger.info("Response Body:\n{}", json.dumps(response.json(), indent=2))
    
    # Assertions
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    response_data = response.json()
    assert response_data["status"] == "success"
    assert response_data["model"] == "openai"
    assert response_data["top_k"] == 3
    assert isinstance(response_data["request_id"], str)
    
    # Validate results
    assert len(response_data["results"]) == len(test_images)
    
    for result in response_data["results"]:
        assert "image_id" in result
        assert "predictions" in result
        assert "processed_at" in result
        assert "processing_time_ms" in result
        assert len(result["predictions"]) <= 3  # top_k=3
        
        # Validate predictions format
        validate_predictions(result["predictions"])

def test_predict_gemini_endpoint():
    # Prepare test images from the tests/images directory
    image_dir = os.path.join(os.path.dirname(__file__), 'images')
    test_images = []
    
    for filename in os.listdir(image_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(image_dir, filename)
            image_format = f"image/{filename.split('.')[-1].lower()}"
            if image_format == 'image/jpg':
                image_format = 'image/jpeg'
                
            test_images.append({
                "image_id": f"test_{filename}",
                "base64_data": load_image_as_base64(image_path),
                "format": image_format
            })
    
    # Prepare the request payload
    request_data = {
        "images": test_images,
        "model": "gemini",
        "top_k": 3,
        "confidence_threshold": 0.1
    }
    
    # Log the request data
    logger.info("Request Data for Gemini test:")
    
    # Make the request
    response = client.post("/api/v1/predict", json=request_data)
    
    # Log the response for debugging
    logger.info("Response Status Code: {}", response.status_code)
    
    # Assertions
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    response_data = response.json()
    assert response_data["status"] == "success"
    assert response_data["model"] == "gemini"
    assert response_data["top_k"] == 3
    assert isinstance(response_data["request_id"], str)
    
    # Validate results
    assert len(response_data["results"]) == len(test_images)
    
    for result in response_data["results"]:
        assert "image_id" in result
        assert "predictions" in result
        assert "processed_at" in result
        assert "processing_time_ms" in result
        assert len(result["predictions"]) <= 3  # top_k=3
        
        # Validate predictions format
        validate_predictions(result["predictions"])

def test_compare_words_endpoint():
    """Test the semantic comparison endpoint"""
    # Test case 1: Similar words
    response = client.post("/api/v1/compare", 
                          json={"word1": "car", "word2": "automobile"})
    assert response.status_code == 200
    result = response.json()
    assert "similarity" in result
    assert 0 <= result["similarity"] <= 1
    assert result["similarity"] > 0.7  # These words should be very similar

    # Test case 2: Different words
    response = client.post("/api/v1/compare", 
                          json={"word1": "car", "word2": "banana"})
    assert response.status_code == 200
    result = response.json()
    assert "similarity" in result
    assert 0 <= result["similarity"] <= 1
    assert result["similarity"] < 0.3  # These words should not be very similar
