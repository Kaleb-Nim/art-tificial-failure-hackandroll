import google.generativeai as genai
from loguru import logger
from app.config import get_settings

settings = get_settings()

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
        self.temperature = settings.TEMPERATURE
        
    async def predict_images(self, messages, max_tokens):
        """Process images using Gemini Vision API"""
        try:
            # Convert OpenAI message format to Gemini format
            prompt_parts = []
            for msg in messages:
                if msg["role"] == "system":
                    prompt_parts.append(msg["content"])
                elif msg["role"] == "user":
                    for content in msg["content"]:
                        if content["type"] == "text":
                            prompt_parts.append(content["text"])
                        elif content["type"] == "image_url":
                            # Extract base64 data from data URL
                            img_data = content["image_url"]["url"].split(",")[1]
                            prompt_parts.append({
                                "mime_type": "image/jpeg",
                                "data": img_data
                            })

            response = await self.model.generate_content(
                prompt_parts,
                generation_config={
                    "temperature": self.temperature,
                    "max_output_tokens": max_tokens,
                }
            )
            
            # Parse the response to match OpenAI format
            parsed_response = response.text
            # TODO: Add proper JSON parsing of the response
            
            return parsed_response

        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise
