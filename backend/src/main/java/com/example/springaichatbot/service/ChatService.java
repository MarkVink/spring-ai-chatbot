package com.example.springaichatbot.service;

import com.example.springaichatbot.controller.MessageDto;
import com.example.springaichatbot.controller.ModelGroup;
import com.example.springaichatbot.tools.AppointmentBookingTool;
import com.example.springaichatbot.tools.DateTimeTools;
import com.example.springaichatbot.tools.EmailConfirmationTool;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatService {

    private final ChatClient remoteChatClient;
    private final ChatClient localChatClient;
    private final ChatMemory chatMemory;
    private final EmailService emailService;
    private final Resource systemPromptResource;
    private final List<String> remoteModels;
    private final List<String> localModels;
    private final String defaultModel;
    private final String baseSystemPrompt;
    private final Map<String, String> sessionReferenceDateTime = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> sessionCalledTools = new ConcurrentHashMap<>();

    public ChatService(
            @Qualifier("remoteChatClient") ChatClient remoteChatClient,
            @Qualifier("localChatClient") ChatClient localChatClient,
            ChatMemory chatMemory,
            EmailService emailService,
            @Value("${app.system-prompt-file}") Resource systemPromptResource,
            @Value("${app.models-remote}") List<String> remoteModels,
            @Value("${app.models-local}") List<String> localModels,
            @Value("${app.default-model}") String defaultModel
    ) {
        this.remoteChatClient = remoteChatClient;
        this.localChatClient = localChatClient;
        this.chatMemory = chatMemory;
        this.emailService = emailService;
        this.systemPromptResource = systemPromptResource;
        this.remoteModels = remoteModels.stream().map(String::trim).filter(StringUtils::hasText).toList();
        this.localModels = localModels.stream().map(String::trim).filter(StringUtils::hasText).toList();
        this.defaultModel = defaultModel;
        this.baseSystemPrompt = readSystemPromptResource();
    }

    public List<ModelGroup> getAvailableModels() {
        List<ModelGroup> groups = new java.util.ArrayList<>();
        if (!remoteModels.isEmpty()) {
            groups.add(new ModelGroup("remote", remoteModels));
        }
        if (!localModels.isEmpty()) {
            groups.add(new ModelGroup("local", localModels));
        }
        return groups;
    }

    public String getDefaultModel() {
        return defaultModel;
    }

    /**
     * Returns the raw system prompt text.
     */
    public String getSystemPrompt() {
        return baseSystemPrompt;
    }

    private String readSystemPromptResource() {
        try {
            return systemPromptResource.getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Could not read system prompt", e);
        }
    }

    /**
     * Determines if a model is valid and exists in the configured lists.
     */
    public boolean isValidModel(String model) {
        if (!StringUtils.hasText(model)) {
            return true; // Will use default
        }
        return remoteModels.contains(model) || localModels.contains(model);
    }

    /**
     * Blocking chat: sends the user message and returns the full assistant response.
     */
    public String chat(String sessionId, String userMessage, String model) {
        String resolvedModel = resolveModel(model);
        ChatClient client = getChatClientForModel(resolvedModel);
        String systemPrompt = buildSystemPromptWithReferenceDateTime(sessionId);
        Set<String> calledTools = getCalledToolsForSession(sessionId);

        ChatClient.ChatClientRequestSpec request = client.prompt()
                .system(systemPrompt)
                .user(userMessage)
                .tools(new DateTimeTools(), new AppointmentBookingTool(calledTools), new EmailConfirmationTool(emailService, calledTools))
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(sessionId)
                        .build())
                .options(OpenAiChatOptions.builder().model(resolvedModel).build());

        return request.call().content();
    }

    /**
     * Streaming chat: sends the user message and returns a Flux of content chunks.
     */
    public Flux<String> chatStream(String sessionId, String userMessage, String model) {
        String resolvedModel = resolveModel(model);
        ChatClient client = getChatClientForModel(resolvedModel);
        String systemPrompt = buildSystemPromptWithReferenceDateTime(sessionId);
        Set<String> calledTools = getCalledToolsForSession(sessionId);

        ChatClient.ChatClientRequestSpec request = client.prompt()
                .system(systemPrompt)
                .user(userMessage)
                .tools(new DateTimeTools(), new AppointmentBookingTool(calledTools), new EmailConfirmationTool(emailService, calledTools))
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(sessionId)
                        .build())
                .options(OpenAiChatOptions.builder().model(resolvedModel).build());

        return request.stream().content();
    }

    /**
     * Returns the full message history for the given session.
     */
    public List<MessageDto> getHistory(String sessionId) {
        return chatMemory.get(sessionId).stream()
                .filter(m -> m instanceof UserMessage || m instanceof AssistantMessage)
                .map(m -> {
                    String role = m instanceof UserMessage ? "user" : "assistant";
                    return new MessageDto(role, m.getText());
                })
                .toList();
    }

    private String resolveModel(String requestedModel) {
        if (!StringUtils.hasText(requestedModel)) {
            return defaultModel;
        }

        // Validate the model exists in either list
        if (remoteModels.contains(requestedModel) || localModels.contains(requestedModel)) {
            return requestedModel;
        }

        // Invalid model, fallback to default
        return defaultModel;
    }

    private ChatClient getChatClientForModel(String model) {
        if (localModels.contains(model)) {
            return localChatClient;
        }
        return remoteChatClient;
    }

    private Set<String> getCalledToolsForSession(String sessionId) {
        return sessionCalledTools.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet());
    }

    private String buildSystemPromptWithReferenceDateTime(String sessionId) {
        String referenceDateTime = sessionReferenceDateTime.computeIfAbsent(
                sessionId,
                ignored -> java.time.ZonedDateTime.now(java.time.ZoneId.of("Europe/Amsterdam")).toString()
        );

        return baseSystemPrompt
                + "\n\nVaste tijdreferentie voor deze conversatie (Europe/Amsterdam): "
                + referenceDateTime
                + "\nGebruik deze tijdreferentie als enige basis voor relatieve datums in deze sessie.\n";
    }
}
