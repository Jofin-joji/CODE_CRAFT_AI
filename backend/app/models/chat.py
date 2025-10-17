from pydantic import BaseModel
from typing import Optional, List

class Message(BaseModel):
    sender: str # 'user' or 'ai'
    text: Optional[str] = None
    code: Optional[str] = None
    explanation: Optional[str] = None

class GenerateCodeRequest(BaseModel):
    user_id: str
    prompt: str
    learning_mode: bool = False
    conversation_history: List[Message] = [] # New field

class GenerateCodeResponse(BaseModel):
    code: str
    explanation: str
    status: str = "success"
    message: Optional[str] = None

class SaveLogRequest(BaseModel):
    user_id: str
    chat_id: str
    timestamp: str
    prompt: str
    code: Optional[str] = None
    explanation: Optional[str] = None
    learning_mode: bool

class GetLogsResponse(BaseModel):
    logs: list
    status: str = "success"
    message: Optional[str] = None

class UpdateTitleRequest(BaseModel):
    new_title: str