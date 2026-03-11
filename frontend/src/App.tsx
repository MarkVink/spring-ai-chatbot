import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { fetchModels } from './api/chatApi';
import { Bot, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const FALLBACK_MODELS = ['gpt-4o-mini', 'docker.io/ai/qwen3:latest'];

export default function App() {
  const [modelOptions, setModelOptions] = useState<string[]>(FALLBACK_MODELS);
  const [selectedModel, setSelectedModel] = useState(FALLBACK_MODELS[0]);

  useEffect(() => {
    fetchModels()
      .then((response) => {
        const models = response.models?.filter(Boolean) ?? [];
        if (models.length === 0) {
          return;
        }

        setModelOptions(models);
        if (response.defaultModel && models.includes(response.defaultModel)) {
          setSelectedModel(response.defaultModel);
        } else {
          setSelectedModel(models[0]);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch models from backend, using fallback models.', err);
      });
  }, []);

  const { sessionId, clearSession } = useSession();
  const { messages, isLoading, error, isHistoryLoaded, sendMessage, stopStreaming, clearMessages } =
    useChat(sessionId);

  const handleClearSession = useCallback(() => {
    stopStreaming();
    clearMessages();
    clearSession();
  }, [stopStreaming, clearMessages, clearSession]);

  if (!isHistoryLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Bot size={24} className="animate-pulse" />
          <span>Loading conversation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
          <Bot size={20} />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-gray-900">Spring AI Chatbot</h1>
          <p className="text-xs text-gray-500">Powered by Spring AI</p>
        </div>

        <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 sm:flex">
          <Sparkles size={14} className="text-blue-600" />
          <label className="text-xs font-medium text-gray-500" htmlFor="header-model-select">
            Model
          </label>
          <select
            id="header-model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading}
            className="min-w-44 border-0 bg-transparent pr-6 text-sm text-gray-700 outline-none disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleClearSession}
          disabled={messages.length === 0}
          title="Clear conversation"
          className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-600"
        >
          <Trash2 size={14} />
          New chat
        </button>
      </header>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 px-6 py-2 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Chat area */}
      <ChatWindow messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isLoading={isLoading}
        selectedModel={selectedModel}
      />
    </div>
  );
}
