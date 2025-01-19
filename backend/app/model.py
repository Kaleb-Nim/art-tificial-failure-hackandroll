import base64
import re
from typing import List, Optional
from pydantic import BaseModel, Field, Field, field_validator
from app.services.openai_service import OpenAIService
from datetime import datetime

class ImageInput(BaseModel):
    """Single image input in Base64 format"""

    image_id: str = Field(
        description="Unique identifier for the image", examples=["img_123abc"]
    )
    base64_data: str = Field(
        description="Base64 encoded image data",
        examples=["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."],
    )
    format: str = Field(
        description="Image format/mime type",
        pattern="^image/(png|jpeg|jpg|gif)$",
        examples=["image/png", "image/jpeg"],
    )

    @field_validator("base64_data")
    def validate_base64(cls, v: str) -> str:
        # Remove data URL prefix if present
        if v.startswith("data:"):
            v = re.sub(r"^data:image/[a-zA-Z]+;base64,", "", v)

        try:
            # Validate base64 encoding
            decoded = base64.b64decode(v)
            if len(decoded) > 1024 * 1024 * 4:  # 4MB limit
                raise ValueError("Image size exceeds 4MB limit")
            return v
        except Exception:
            raise ValueError("Invalid base64 encoding")


class PredictionRequest(BaseModel):
    """Request model for batch image prediction"""

    images: List[ImageInput] = Field(
        description="List of images to process", max_length=10  # Limit batch size
    )
    model: str = Field(
        description="Model to use for prediction", examples=["gemni", "openai"]
    )
    top_k: Optional[int] = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of top predictions to return per image",
    )
    confidence_threshold: Optional[float] = Field(
        default=0.1,
        ge=0.0,
        le=1.0,
        description="Minimum confidence threshold for predictions",
    )

# Removed examples cus openAI api doesn't allow for json parsing
class PredictionDetail(BaseModel):
    """Individual prediction details for a single label"""

    label: str = Field(
        description="Single word label/class predicted by the model",
        # examples=["cat", "dog", "house"],
    )
    confidence: float = Field(
        description="Confidence score between 0 and 1",
        # ge=0.0,
        # le=1.0,
        # examples=[0.92, 0.85],
    )
    reason: str = Field(
        description="Brief explanation of why the model made this prediction",
        # max_length=200,
        # examples=[
        #     "Strong cat-like features detected: pointed ears, whiskers, and feline face shape"
        # ],
    )

    @field_validator("label")
    def validate_single_word(cls, v: str) -> str:
        if len(v.split()) > 1:
            raise ValueError("Label must be a single word")
        return v.lower()


class ImagePrediction(BaseModel):
    """Prediction results for a single image"""

    image_id: str = Field(description="Unique identifier for the submitted image")
    predictions: List[PredictionDetail] = Field(
        description="List of top predictions for the image",
        # max_length=10,  # Limit max number of predictions
    )
    processed_at: datetime = Field(
        default_factory=datetime.now,
        description="Timestamp when prediction was made",
    )
    processing_time_ms: float = Field(
        description="Time taken to process prediction in milliseconds", ge=0.0
    )


class PredictionResponse(BaseModel):
    """Complete response for a batch prediction request"""

    request_id: str = Field(description="Unique identifier for the batch request")
    status: str = Field(
        description="Status of the prediction request", pattern="^(success|error)$"
    )
    model: str = Field(
        description="Model used for prediction", examples=["gemni", "openai"]
    )
    top_k: int = Field(
        description="Number of top predictions requested per image", ge=1, le=10
    )
    results: List[ImagePrediction] = Field(
        description="List of predictions for each image in the request"
    )
    error_message: str | None = Field(
        default=None, description="Error message if status is 'error'"
    )

class BaseRequest(BaseModel):
    """Base response model for API endpoints"""

    prompt: str = Field(description="Prompt for generating a response") 

class BaseResponse(BaseModel):
    """Base request model for API endpoints"""

    response: str = Field(description="Generated response")

class ComparisonRequest(BaseModel):
    """Request model for semantic comparison"""
    
    word1: str = Field(description="First word to compare", min_length=1)
    word2: str = Field(description="Second word to compare", min_length=1)

class ComparisonResponse(BaseModel):
    """Response model for semantic comparison"""
    
    similarity: float = Field(description="Similarity score between 0 and 1", ge=0.0, le=1.0)
