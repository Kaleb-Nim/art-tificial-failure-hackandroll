import base64
import re
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException

router = APIRouter()
from pydantic import BaseModel, Field, Field, field_validator
from datetime import datetime

from app.services.openai_service import OpenAIService
from app.services.predict_service import PredictService
from app.model import (
    ImageInput, PredictionRequest, PredictionResponse, 
    BaseRequest, BaseResponse, ComparisonRequest, ComparisonResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
openai_service = OpenAIService()
predict_service = PredictService()


@router.post("/generate", response_model=BaseResponse)
async def generate_response(request: BaseRequest):
    logger.info("Received prediction request with %d images", len(request.images))
    try:
        logger.debug("Request data: %s", request)
        response = await openai_service.generate_response(request.prompt)
        return BaseResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict", response_model=PredictionResponse)
async def predict_images(request: PredictionRequest):
    """
    Process images and return predictions using OpenAI's Vision API.

    Parameters:
    - request (PredictionRequest): Contains list of base64 encoded images and prediction parameters

    Returns:
    - PredictionResponse: Predictions for each image with confidence scores and explanations
    """
    try:
        # Validate request
        if not request.images:
            raise HTTPException(status_code=400, detail="No images provided in request")

        if any(not img.base64_data for img in request.images):
            raise HTTPException(status_code=400, detail="Invalid image data provided")

        # Process images and get predictions
        response = await predict_service.predict_images(request)
        logger.info("Successfully processed prediction request")
        logger.debug("Response data: %s", response)
        return response

    except ValueError as e:
        logger.error("ValueError: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Exception: %s", str(e))
        raise HTTPException(
            status_code=500, detail=f"Error processing image prediction: {str(e)}"
        )

@router.post("/compare", response_model=ComparisonResponse)
async def compare_words(request: ComparisonRequest):
    """
    Compare the semantic similarity between two words.
    
    Parameters:
    - request (ComparisonRequest): Contains two words to compare
    
    Returns:
    - ComparisonResponse: Similarity score between 0 and 1
    """
    try:
        similarity = await openai_service.compare_semantics(request.word1, request.word2)
        return ComparisonResponse(similarity=similarity)
    except Exception as e:
        logger.error("Error in semantic comparison: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
