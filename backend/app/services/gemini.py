import google.generativeai as genai
from app.core.config import settings
from typing import List, AsyncGenerator
from app.models.chat import Message

# Configure the Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Use a model that supports streaming generation
model = genai.GenerativeModel('gemini-2.5-pro')

async def generate_code_with_gemini_stream(
    user_prompt: str, 
    learning_mode: bool = False, 
    conversation_history: List[Message] = []
) -> AsyncGenerator[str, None]:
    """
    Generates Python code and explanation using the Gemini API via streaming,
    considering conversation history. It yields the response chunks as they arrive.
    """
    model_history = []
    for msg in conversation_history:
        # The frontend now prepares a 'text' field for all message types.
        if msg.text:
            role = 'model' if msg.sender == 'ai' else 'user'
            model_history.append({'role': role, 'parts': [{'text': msg.text}]})

    # The main prompt instructing the model on its role and output format
    prompt_template = f"""
You are CodeCraft AI — an intelligent assistant that generates clean, educational Python code snippets.
Your tasks:
1. Interpret the developer’s natural language request, considering the conversation history.
2. Generate correct, well-formatted Python code inside a Markdown block.
3. Add short and clear explanations.
4. Optionally, include inline comments if the “learning mode” is active.
5. Your entire response should be a single Markdown-formatted text.
"""

    # Combine the system prompt with the user's latest message
    full_prompt = f"{prompt_template}\n\nUser: {user_prompt}"

    try:
        # Start a new chat session with the existing history
        chat_session = model.start_chat(history=model_history)
        
        # Send the user's prompt and stream the response
        response = await chat_session.send_message_async(full_prompt, stream=True)
        
        # Yield each chunk of the response as it is received
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        # In case of an error, yield a formatted error message
        error_message = f"Error calling Gemini API: {e}"
        print(error_message)
        yield error_message