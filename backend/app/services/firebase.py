import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.core.config import settings
import os

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        print(f"Please ensure FIREBASE_SERVICE_ACCOUNT_KEY_PATH is correctly set and points to a valid JSON file.")
        # It's critical for the app to function, so we should raise an error or exit.
        # For now, we'll let it print and fail gracefully if Firebase functions are called.

db = firestore.client()

def save_chat_log(user_id: str, chat_id: str, log_data: dict):
    """Saves a chat log to Firestore."""
    try:
        doc_ref = db.collection("users").document(user_id).collection("logs").document(chat_id)
        doc_ref.set(log_data)
        return {"status": "success", "message": f"Log {chat_id} saved for user {user_id}"}
    except Exception as e:
        return {"status": "error", "message": f"Error saving chat log: {e}"}

def get_user_logs(user_id: str):
    """Fetches all chat logs for a given user from Firestore."""
    try:
        logs_ref = db.collection("users").document(user_id).collection("logs")
        docs = logs_ref.stream()
        user_logs = []
        for doc in docs:
            log_data = doc.to_dict()
            log_data["chat_id"] = doc.id # Include the document ID
            user_logs.append(log_data)
        return {"status": "success", "logs": user_logs}
    except Exception as e:
        return {"status": "error", "message": f"Error fetching user logs: {e}"}

def delete_chat_log(user_id: str, chat_id: str):
    """Deletes a specific chat log from Firestore."""
    try:
        doc_ref = db.collection("users").document(user_id).collection("logs").document(chat_id)
        doc_ref.delete()
        return {"status": "success", "message": f"Log {chat_id} deleted for user {user_id}"}
    except Exception as e:
        return {"status": "error", "message": f"Error deleting chat log: {e}"}

def update_chat_prompt(user_id: str, chat_id: str, new_prompt: str):
    """Updates the prompt (title) of a specific chat log in Firestore."""
    try:
        doc_ref = db.collection("users").document(user_id).collection("logs").document(chat_id)
        doc_ref.update({"prompt": new_prompt})
        return {"status": "success", "message": f"Log {chat_id} prompt updated for user {user_id}"}
    except Exception as e:
        return {"status": "error", "message": f"Error updating chat prompt: {e}"}



def verify_firebase_token(id_token: str):
    """Verifies a Firebase ID token and returns the decoded token."""
    try:
        decoded_token = auth.verify_id_token(id_token)
        return {"status": "success", "decoded_token": decoded_token}
    except Exception as e:
        return {"status": "error", "message": f"Error verifying Firebase token: {e}"}