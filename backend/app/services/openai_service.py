from openai import OpenAI, AsyncOpenAI
from app.config import get_settings

settings = get_settings()

class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key = settings.OPENAI_API_KEY
        )
        self.model = settings.MODEL_NAME
        self.max_tokens = settings.MAX_TOKENS
        self.temperature = settings.TEMPERATURE

    async def generate_response(self, prompt: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Error generating OpenAI response: {str(e)}")

    async def compare_semantics(self, word1: str, word2: str) -> float:
        try:
            prompt = f"""On a scale from 0 to 1, rate the semantic similarity between '{word1}' and '{word2}'.
            IMPORTANT: Respond with ONLY a number between 0 and 1.
            Do not include any other text, explanation, or punctuation.
            Examples:
            - Identical words = 1.0
            - Very similar words (car/automobile) = 0.95
            - Completely different words (car/banana) = 0.1"""
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.3
            )
            
            # Clean and extract the float from the response
            content = response.choices[0].message.content.strip()
            # Remove any non-numeric characters except decimal point
            cleaned_number = ''.join(c for c in content if c.isdigit() or c == '.')
            similarity = float(cleaned_number)
            return max(0.0, min(1.0, similarity))  # Ensure value is between 0 and 1
            
        except Exception as e:
            raise Exception(f"Error comparing semantics: {str(e)}")
