from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.models.chat import GenerateCodeRequest, SaveLogRequest, GetLogsResponse, UpdateTitleRequest
from app.services.gemini import generate_code_with_gemini_stream
from app.services.firebase import save_chat_log, get_user_logs, verify_firebase_token, delete_chat_log, update_chat_prompt
from typing import Annotated, AsyncGenerator

app = FastAPI(title="CodeCraft AI Backend")

# Configure CORS
origins = [
    "http://localhost:5173",  # Frontend URL
    "https://codecraftai.duckdns.org",
    "https://code-craft-ai.netlify.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(request: Request):
    """
    Dependency to get the current user by verifying the Firebase ID token from the Authorization header.
    """
    id_token = request.headers.get("Authorization")
    if not id_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    id_token = id_token.replace("Bearer ", "")

    verification_result = verify_firebase_token(id_token)

    if verification_result["status"] == "success":
        return verification_result["decoded_token"]["uid"]
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=verification_result["message"],
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/")
def read_root():
    return {"message": "Welcome to CodeCraft AI Backend"}

@app.post("/generate-code")
async def generate_code_stream(request: GenerateCodeRequest, current_user: Annotated[str, Depends(get_current_user)]):
    """
    Generates Python code and explanation as a stream based on a natural language prompt.
    """
    if request.user_id != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    async def stream_response_generator() -> AsyncGenerator[str, None]:
        stream = generate_code_with_gemini_stream(
            request.prompt,
            request.learning_mode,
            request.conversation_history
        )
        async for chunk in stream:
            yield chunk

    return StreamingResponse(stream_response_generator(), media_type="text/event-stream")

@app.post("/save-log")
async def save_log(request: SaveLogRequest, current_user: Annotated[str, Depends(get_current_user)]):
    """
    Saves a chat log to Firebase Firestore.
    """
    if request.user_id != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    log_data = request.model_dump()
    firebase_response = save_chat_log(request.user_id, request.chat_id, log_data)

    if firebase_response["status"] == "success":
        return {"message": firebase_response["message"]}
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=firebase_response["message"])

@app.get("/get-logs", response_model=GetLogsResponse)
async def get_logs(user_id: str, current_user: Annotated[str, Depends(get_current_user)]):
    """
    Fetches all chat logs for a given user from Firebase Firestore.
    """
    if user_id != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    firebase_response = get_user_logs(user_id)

    if firebase_response["status"] == "success":
        return GetLogsResponse(logs=firebase_response["logs"])
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=firebase_response["message"])

@app.delete("/delete-log/{user_id}/{chat_id}")
async def delete_log_endpoint(user_id: str, chat_id: str, current_user: Annotated[str, Depends(get_current_user)]):
    """
    Deletes a specific chat log for the current user.
    """
    if user_id != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    firebase_response = delete_chat_log(user_id, chat_id)

    if firebase_response["status"] == "success":
        return {"message": firebase_response["message"]}
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=firebase_response["message"])

@app.put("/update-log-title/{user_id}/{chat_id}")
async def update_log_title_endpoint(
    user_id: str, 
    chat_id: str, 
    request: UpdateTitleRequest, 
    current_user: Annotated[str, Depends(get_current_user)]
):
    """
    Updates the title of a specific chat log for the current user.
    """
    if user_id != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    firebase_response = update_chat_prompt(user_id, chat_id, request.new_title)

    if firebase_response["status"] == "success":
        return {"message": firebase_response["message"]}
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=firebase_response["message"])


