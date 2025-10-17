import { auth } from '../lib/firebase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

async function getAuthHeader() {
  const user = auth.currentUser;
  if (user) {
    const idToken = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}

export async function* generateCode(prompt, learningMode, userId, conversationHistory = []) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BACKEND_URL}/generate-code`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      user_id: userId,
      prompt,
      learning_mode: learningMode,
      conversation_history: conversationHistory,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to generate code');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    yield decoder.decode(value, { stream: true });
  }
}

export async function saveLog(logData) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BACKEND_URL}/save-log`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(logData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to save log');
  }
  return response.json();
}

export async function getLogs(userId) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BACKEND_URL}/get-logs?user_id=${userId}`, {
    method: 'GET',
    headers: headers,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch logs');
  }
  return response.json();
}

export async function deleteLog(userId, chatId) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BACKEND_URL}/delete-log/${userId}/${chatId}`, {
    method: 'DELETE',
    headers: headers,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete log');
  }
  return response.json();
}

export async function updateLogTitle(userId, chatId, newTitle) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BACKEND_URL}/update-log-title/${userId}/${chatId}`, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify({ new_title: newTitle }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update title');
  }
  return response.json();
}