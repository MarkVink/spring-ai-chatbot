import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { fetchModels, fetchSystemPrompt, type ModelGroup } from './api/chatApi';
import { CalendarCheck, AlertCircle, PlusCircle, Sparkles, ClipboardList } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import SystemPromptModal from './components/SystemPromptModal';

const FALLBACK_GROUPS: ModelGroup[] = [
  { type: 'remote', models: ['gpt-4o-mini', 'gpt-4'] },
  { type: 'local', models: ['docker.io/ai/qwen3:latest'] },
];

export default function App() {
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>(FALLBACK_GROUPS);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    fetchSystemPrompt()
      .then(setSystemPrompt)
      .catch((err) => console.warn('Failed to fetch system prompt', err));
  }, []);

  useEffect(() => {
    fetchModels()
      .then((response) => {
        const groups = response.groups?.filter((g) => g.models?.length > 0) ?? [];
        if (groups.length === 0) return;
        setModelGroups(groups);
        if (response.defaultModel) {
          const modelExists = groups.some((g) => g.models.includes(response.defaultModel));
          setSelectedModel(modelExists ? response.defaultModel : (groups[0]?.models[0] ?? response.defaultModel));
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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500">
          <CalendarCheck size={24} className="animate-pulse text-teal-600" />
          <span>Gesprek laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        {/* Logo mark */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
          <CalendarCheck size={22} />
        </div>

        {/* Title */}
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Afspraak Assistent</h1>
          <p className="text-xs text-slate-400">Plan eenvoudig uw afspraak</p>
        </div>

        {/* System prompt button — styled like the model selector pill */}
        {systemPrompt && (
          <button
            onClick={() => setShowPrompt(true)}
            title="Bekijk assistentinstructies"
            className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-400
                       transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 sm:flex"
          >
            <ClipboardList size={13} className="text-teal-600" />
            <span className="text-xs font-medium text-slate-400">Prompt</span>
          </button>
        )}

        {/* Model selector */}
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
          <Sparkles size={13} className="text-teal-600" />
          <label className="text-xs font-medium text-slate-400" htmlFor="header-model-select">
            Model
          </label>
          <select
            id="header-model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading}
            className="min-w-44 border-0 bg-transparent pr-6 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {modelGroups.map((group) => (
              <optgroup
                key={group.type}
                label={group.type === 'local' ? 'Lokaal' : 'Extern'}
              >
                {group.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* New conversation */}
        <button
          onClick={handleClearSession}
          disabled={messages.length === 0}
          title="Nieuw gesprek starten"
          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600
                     transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700
                     disabled:cursor-not-allowed disabled:opacity-40
                     disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
        >
          <PlusCircle size={14} />
          Nieuw gesprek
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
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onSubmitSpecialInput={(message) => sendMessage(message, selectedModel)}
      />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isLoading={isLoading}
        selectedModel={selectedModel}
      />

      {/* System prompt modal */}
      {showPrompt && (
        <SystemPromptModal prompt={systemPrompt} onClose={() => setShowPrompt(false)} />
      )}
    </div>
  );
}
