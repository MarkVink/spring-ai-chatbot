import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { Bot, AlertCircle, Trash2 } from 'lucide-react';
import { useCallback } from 'react';

export default function App() {
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
      <ChatInput onSend={sendMessage} onStop={stopStreaming} isLoading={isLoading} />
    </div>
  );
}

