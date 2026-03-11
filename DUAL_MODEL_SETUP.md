# Dual Model Support: Remote & Local

## Overview

The application now supports both **remote models** (e.g., OpenAI, Claude) and **local models** (e.g., Ollama, LM Studio) with separate API configurations.

## Architecture

### Backend Configuration (`application.yml`)

```yaml
app:
  models-remote: ${APP_MODELS_REMOTE:gpt-4o-mini}
  models-local: ${APP_MODELS_LOCAL}
  openai-base-url-remote: ${SPRING_AI_OPENAI_BASE_URL:}
  openai-api-key-remote: ${SPRING_AI_OPENAI_API_KEY:}
  openai-base-url-local: ${SPRING_AI_OPENAI_BASE_URL_LOCAL:http://localhost:11434/v1}
  openai-api-key-local: ${SPRING_AI_OPENAI_API_KEY_LOCAL:}
```

### Bean Configuration (`AiConfig.java`)

Two separate OpenAiChatModel beans:
- **remoteOpenAiChatModel**: Uses remote base URL and API key
- **localOpenAiChatModel**: Uses local base URL and API key

Two separate ChatClient beans:
- **remoteChatClient**: Routes requests to remote models
- **localChatClient**: Routes requests to local models

### Service Logic (`ChatService.java`)

- **`getChatClientForModel(model)`**: Selects the appropriate ChatClient based on model type
  - If model is in `localModels` → use `localChatClient`
  - Otherwise → use `remoteChatClient`

- **`getAvailableModels()`**: Returns models grouped by type (remote/local)

- **`isValidModel(model)`**: Validates model names against configured lists

## Usage

### 1. Set Environment Variables

Create a `.env` file in the backend directory:

```bash
# Remote API (OpenAI)
SPRING_AI_OPENAI_BASE_URL=https://api.openai.com/v1
SPRING_AI_OPENAI_API_KEY=sk-your-openai-key

# Local API (Ollama)
SPRING_AI_OPENAI_BASE_URL_LOCAL=http://localhost:11434/v1
SPRING_AI_OPENAI_API_KEY_LOCAL=  # Usually empty for Ollama

# Model Lists
APP_MODELS_REMOTE=gpt-4o-mini,gpt-4
APP_MODELS_LOCAL=qwen:latest,llama2

# Default
SPRING_AI_OPENAI_CHAT_MODEL=gpt-4o-mini
```

### 2. Start Ollama (for local models)

```bash
ollama serve  # Runs on http://localhost:11434/v1
```

### 3. Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

### 5. Select a Model

In the frontend header, use the model dropdown to select:
- **Remote Models** (OpenAI, etc.)
- **Local Models** (Ollama, etc.)

## Flow Diagram

```
User selects model in frontend
         ↓
Frontend sends model name with message
         ↓
Backend ChatController receives request
         ↓
ChatService.chat() / chatStream()
         ↓
getChatClientForModel(model)
         ↓
        / \
       /   \
      /     \
  Local?   Remote?
   |          |
   ↓          ↓
localChatClient  remoteChatClient
   ↓          ↓
  Local API   OpenAI API
(Ollama)      (API call)
   ↓          ↓
Response streams back to frontend
```

## Key Features

✅ **Separate Credentials**: Remote and local APIs have independent API keys/URLs  
✅ **Automatic Routing**: Model type determines which ChatClient to use  
✅ **Grouped UI**: Frontend dropdown shows models organized by type  
✅ **Validation**: Backend validates all model names before use  
✅ **Fallback Safety**: Invalid models fallback to default with no errors  
✅ **Environment-Driven**: All configurations via `.env` file

## Troubleshooting

### Local models not responding?
- Check Ollama is running: `ollama serve`
- Verify base URL: `SPRING_AI_OPENAI_BASE_URL_LOCAL=http://localhost:11434/v1`
- Check logs for connection errors

### Remote API failing?
- Verify API key is correct
- Check base URL is accessible
- Ensure model name matches OpenAI model list

### Model not appearing in dropdown?
- Add to `APP_MODELS_REMOTE` or `APP_MODELS_LOCAL` in `.env`
- Restart backend for changes to take effect
- Check `/api/chat/models` endpoint response

