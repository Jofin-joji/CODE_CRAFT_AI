import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")

settings = Settings()