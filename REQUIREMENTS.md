# Spring AI Chatbot – Requirements

## 1. Project Overview & Goals

### Overview
A full-stack demo application showcasing **Spring AI** — a framework that brings AI capabilities (LLM integration, prompt templating, chat memory, vector stores, etc.) to the Spring ecosystem. The project consists of a **React** frontend chat UI and a **Spring Boot** backend that acts as an AI gateway.

### Goals
- Demonstrate how Spring AI simplifies integrating LLMs into a Java/Kotlin application.
- Provide a clean, working chatbot UI that streams AI responses in real time.
- Show model-provider abstraction (swap OpenAI ↔ Anthropic ↔ Ollama with a config change).
- Serve as a reference architecture for production Spring AI applications.

### Target Audience
Developers evaluating Spring AI or building their own AI-powered Spring Boot services.

---

## 2. Tech Stack

### Backend
| Layer | Technology | Version |
|---|---|---|
| Language | Java | 21 LTS (or Kotlin 2.x as opt-in) |
| Runtime | Spring Boot | 3.4.x |
| AI Framework | Spring AI | 1.0.x (GA) |
| Build tool | Maven | 3.9.x |
| Reactive layer | Spring WebFlux | (included in Spring Boot) |
| Persistence | Spring Data JPA + H2 (dev) / PostgreSQL (prod) | - |
| API docs | SpringDoc OpenAPI (Swagger UI) | 2.x |

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.x |
| Framework | React | 19.x |
| Build tool | Vite | 6.x |
| Styling | Tailwind CSS | 4.x |
| Data fetching | TanStack Query (React Query) | 5.x |
| HTTP client | Axios | 1.x |
| SSE streaming | Native `EventSource` API | - |
| Markdown rendering | react-markdown | 9.x |
| Linting / Formatting | ESLint + Prettier | latest |

### AI Providers (pluggable via Spring AI)
| Provider | Usage |
|---|---|
| **OpenAI** | Primary provider (GPT-4o / GPT-4o-mini) |
| **Anthropic** | Optional alternative (Claude 3.x) |
| **Ollama** | Optional local/offline alternative (Llama 3, Mistral, etc.) |

---

## 3. Frontend Requirements

### 3.1 Features
- **Chat window** — displays the conversation thread with user and assistant messages.
- **Streaming responses** — assistant tokens are streamed via SSE and appended in real time (typing effect).
- **Persistent session** — the browser stores a `sessionId` in `localStorage`; reopening the browser restores the same conversation automatically.
- **Session isolation** — each browser (or private window) generates its own unique `sessionId`, so different users have completely separate conversations.
- **Conversation history** — full message thread is loaded on page (re)load from the backend, so the chat is never lost within a session.
- **Markdown support** — assistant messages render markdown (code blocks, lists, bold, etc.).
- **Copy to clipboard** — button on each assistant message.
- **Error handling** — display user-friendly error messages on API failures.
- **Responsive design** — works on desktop and mobile viewports.

### 3.2 Key Components
```
frontend/
├── src/
│   ├── components/
│   │   ├── ChatWindow.tsx        # Scrollable message thread
│   │   ├── MessageBubble.tsx     # Individual user/assistant message
│   │   ├── TypingIndicator.tsx   # Animated dots while waiting for first token
│   │   └── ChatInput.tsx         # Text area + send button
│   ├── hooks/
│   │   ├── useChat.ts            # Sends messages, manages SSE stream
│   │   └── useSession.ts         # Reads/creates sessionId in localStorage
│   ├── api/
│   │   └── chatApi.ts            # Axios/fetch wrappers for backend API
│   ├── types/
│   │   └── chat.ts               # Message, etc.
│   ├── App.tsx
│   └── main.tsx
```

### 3.3 Frontend Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "axios": "^1.7.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "react-syntax-highlighter": "^15.0.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 4. Backend Requirements

### 4.1 Features
- **Chat endpoint (streaming)** — accepts a user message + `sessionId`, forwards it to the configured LLM via Spring AI, and streams the response as SSE.
- **Chat endpoint (blocking)** — synchronous version for simpler clients / testing.
- **History endpoint** — returns the full message history for a given `sessionId`, so the frontend can restore a conversation on page reload.
- **In-memory chat memory** — Spring AI's `InMemoryChatMemory` keyed by `sessionId`; no database required. Data lives for the lifetime of the running application.
- **Stateful context** — every request automatically includes all previous messages for that session via `MessageChatMemoryAdvisor`, giving the AI knowledge of the full conversation history.
- **System prompt** — configurable globally via `application.yml`.
- **Model abstraction** — swap providers (OpenAI / Anthropic / Ollama) purely via configuration, no code changes.
- **API documentation** — Swagger UI exposed at `/swagger-ui.html`.
- **Health check** — Spring Actuator endpoint at `/actuator/health`.
- **CORS** — configured to allow the frontend dev-server origin.

### 4.2 REST API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat/stream` | Stream assistant response (SSE / `text/event-stream`) |
| `POST` | `/api/chat` | Blocking chat request, returns full response JSON |
| `GET` | `/api/chat/history/{sessionId}` | Return full message history for the session |

#### Request body – `POST /api/chat/stream`
```json
{
  "sessionId": "uuid-generated-by-browser",
  "message": "Explain Spring AI in simple terms"
}
```

#### SSE Response (per chunk)
```
data: {"token": "Spring", "done": false}
data: {"token": " AI", "done": false}
data: {"token": "...", "done": true}
```

#### Response – `GET /api/chat/history/{sessionId}`
```json
[
  { "role": "user",      "content": "Explain Spring AI in simple terms" },
  { "role": "assistant", "content": "Spring AI is a framework that..." }
]
```

### 4.3 Spring AI Integration
- Use `ChatClient` (fluent API) for sending prompts.
- Use `MessageChatMemoryAdvisor` to inject all previous messages for the session automatically.
- Configure `ChatMemory` with `InMemoryChatMemory` keyed by `sessionId` — no database needed.
- Support SSE streaming via `ChatClient`'s streaming API returning `Flux<String>`.
- System prompt configurable in `application.yml` under `app.system-prompt`.

### 4.4 Backend Project Structure
```
backend/
├── src/main/
│   ├── java/com/example/springaichatbot/
│   │   ├── SpringAiChatbotApplication.java
│   │   ├── config/
│   │   │   ├── AiConfig.java          # ChatClient bean, InMemoryChatMemory bean
│   │   │   └── WebConfig.java         # CORS configuration
│   │   ├── controller/
│   │   │   └── ChatController.java    # /api/chat, /api/chat/stream, /api/chat/history/{sessionId}
│   │   └── service/
│   │       └── ChatService.java       # ChatClient calls + memory advisor
│   └── resources/
│       └── application.yml
└── pom.xml
```

### 4.5 Maven Dependencies (`pom.xml`)
```xml
<!-- Spring Boot parent -->
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>3.4.x</version>
</parent>

<!-- Spring AI BOM -->
<dependencyManagement>
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-bom</artifactId>
    <version>1.0.x</version>
    <type>pom</type>
    <scope>import</scope>
  </dependency>
</dependencyManagement>

<dependencies>
  <!-- Core -->
  spring-boot-starter-webflux
  spring-boot-starter-actuator

  <!-- Spring AI -->
  spring-ai-openai-spring-boot-starter       <!-- OpenAI -->
  spring-ai-anthropic-spring-boot-starter    <!-- Anthropic (optional) -->
  spring-ai-ollama-spring-boot-starter       <!-- Ollama (optional) -->

  <!-- API docs -->
  org.springdoc:springdoc-openapi-starter-webflux-ui
</dependencies>
```

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | First token delivered to the UI within 2 seconds under normal network conditions. Streaming keeps perceived latency low. |
| **Scalability** | Single-instance demo (in-memory state is not shared across instances). Suitable for local/demo use. |
| **Security** | API keys stored only in environment variables / secrets manager, never committed to version control. No sensitive data logged. |
| **CORS** | Backend restricts CORS to the configured frontend origin(s). |
| **Error handling** | All errors return structured JSON `{ "error": "...", "status": 4xx/5xx }`. Frontend displays friendly messages. |
| **Observability** | Spring Actuator metrics + health endpoints. Optional Micrometer / OpenTelemetry tracing. |
| **Test coverage** | Unit tests for service layer; integration tests for controller layer using `@SpringBootTest`. Frontend unit tests with Vitest + React Testing Library. |
| **Code quality** | Checkstyle / ktlint for backend; ESLint + Prettier for frontend enforced in CI. |

---

## 6. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│  React 19 + TypeScript + Tailwind CSS               │
│  ┌──────────────────────────────────────────────┐   │
│  │  Chat UI  (sessionId stored in localStorage) │   │
│  └────────────────────┬─────────────────────────┘   │
│                       │ HTTP/SSE  (+sessionId)       │
└───────────────────────┼─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│              Spring Boot 3.4 (WebFlux)               │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ChatController                                  │ │
│  │   POST /api/chat/stream  (SSE Flux)             │ │
│  │   POST /api/chat         (blocking)             │ │
│  │   GET  /api/chat/history/{sessionId}            │ │
│  └──────────────────────┬──────────────────────────┘ │
│                         │                            │
│  ┌──────────────────────▼──────────────────────────┐ │
│  │              ChatService                        │ │
│  │  ChatClient + MessageChatMemoryAdvisor          │ │
│  │  InMemoryChatMemory  (keyed by sessionId)       │ │
│  └──────────────────────┬──────────────────────────┘ │
│                         │                            │
│  ┌──────────────────────▼──────────────────────────┐ │
│  │           AI Provider (via Spring AI)           │ │
│  │   OpenAI API  /  Anthropic API  /  Ollama       │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 7. Setup & Configuration

### 7.1 Repository Structure (Monorepo)
```
spring-ai-chatbot/
├── backend/          # Spring Boot Maven project
├── frontend/         # React + Vite project
├── .env.example
└── REQUIREMENTS.md
```

### 7.2 Environment Variables

#### Backend (`backend/.env` or system environment)
```dotenv
# AI Provider – choose one (or configure multiple)
SPRING_AI_OPENAI_API_KEY=sk-...
SPRING_AI_OPENAI_CHAT_MODEL=gpt-4o-mini

SPRING_AI_ANTHROPIC_API_KEY=sk-ant-...
SPRING_AI_ANTHROPIC_CHAT_MODEL=claude-3-5-sonnet-20241022

OLLAMA_BASE_URL=http://localhost:11434   # only for Ollama


# App
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (`frontend/.env`)
```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

### 7.3 Running Locally

#### Prerequisites
- Java 21+
- Node.js 22+
- Maven 3.9+
- (Optional) Ollama installed locally for offline mode

#### Backend
```bash
cd backend
./mvnw spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### 7.4 `application.yml` Key Properties
```yaml
spring:
  ai:
    openai:
      api-key: ${SPRING_AI_OPENAI_API_KEY}
      chat:
        options:
          model: ${SPRING_AI_OPENAI_CHAT_MODEL:gpt-4o-mini}
          temperature: 0.7
          max-tokens: 2048
app:
  system-prompt: "You are a helpful assistant."
server:
  port: ${SERVER_PORT:8080}
cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173}
```

---

## 8. Out of Scope (for this demo)
- User authentication / multi-tenancy
- RAG (Retrieval-Augmented Generation) / vector store integration *(could be a follow-up milestone)*
- Fine-tuned model deployment
- Production-grade secret management (Vault, AWS Secrets Manager)
- CI/CD pipeline configuration

