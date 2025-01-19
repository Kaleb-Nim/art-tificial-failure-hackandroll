import time
import uuid
import json
from datetime import datetime
from typing import List
from pydantic import BaseModel, Field
from loguru import logger
from app.model import ImagePrediction, PredictionResponse, PredictionRequest,PredictionDetail
from app.services.openai_service import OpenAIService
from app.services.gemini_service import GeminiService

class PredictionOutput(BaseModel):
    """
    Structured output for images predictions
    """
    response:List[PredictionDetail] = Field(
        description="List of predictions for each image",
    )

class PredictService:
    def __init__(self):
        self.openai_service = OpenAIService()
        self.gemini_service = GeminiService()

    async def predict_images(self, request: PredictionRequest) -> PredictionResponse:
        try:
            start_time = time.time()
            
            if request.model.lower() == "gemini":
                service = self.gemini_service
            else:
                service = self.openai_service
                
            logger.info(f"Starting image prediction with model: {service.model}")
            logger.info(f"Configuration - Temperature: {self.openai_service.temperature}, "
                       f"Max tokens: {300 * len(request.images)}")

            # Prepare the system message for consistent formatting
            system_message = (
                "Analyze the images and provide:\n"
                f"- Top {request.top_k} single-word labels for each image\n"
                "- Confidence scores between 0 and 1\n"
                "- Brief reasons for each prediction\n"
                "Format your response as a list of predictions for each image."
                "Output in JSON format"
            )

            # Create message with images
            content = "Analyze these images:\n"
            messages = [{"role": "system", "content": system_message}]
            
            for idx, img in enumerate(request.images):
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Image {idx + 1}:"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{img.format};base64,{img.base64_data}"
                            }
                        }
                    ]
                })

            # Log the request being sent to OpenAI
            logger.debug("Sending request to OpenAI API:")
            # logger.debug(f"Messages structure: {json.dumps(messages, indent=2)}")
            
            response = await self.openai_service.client.beta.chat.completions.parse(
                model=self.openai_service.model,
                messages=messages,
                max_tokens=300 * len(request.images),  # Scale with number of images
                temperature=self.openai_service.temperature,
                response_format=PredictionOutput
            )
            
            logger.info(f"Received response from OpenAI. Usage: {response.usage}")
            logger.info(f"Response completion parsed: {response.choices[0].message.parsed}")

            # Process response and create predictions
            processed_results: List[ImagePrediction] = []

            parsed_response = response.choices[0].message.parsed
            for idx, img in enumerate(request.images):
                predictions = []
                for pred in parsed_response.response:
                    predictions.append(PredictionDetail(
                        label=pred.label,
                        confidence=pred.confidence,
                        reason=pred.reason
                    ))
                
                processed_results.append(ImagePrediction(
                    image_id=request.images[idx].image_id,
                    predictions=predictions,
                    processed_at=datetime.now(),
                    processing_time_ms=(time.time() - start_time) * 1000,
                    response=predictions  # Add this field to match the model
                ))


            response_obj = PredictionResponse(
                request_id=str(uuid.uuid4()),
                status="success",
                model=request.model,
                top_k=request.top_k,
                results=processed_results,
            )
            
            logger.info(f"Successfully processed {len(request.images)} images in "
                       f"{(time.time() - start_time) * 1000:.2f}ms")
            
            return response_obj

        except Exception as e:
            logger.error(f"Error generating predictions: {str(e)}")
            logger.exception("Full traceback:")
            raise Exception(f"Error generating predictions: {str(e)}")
