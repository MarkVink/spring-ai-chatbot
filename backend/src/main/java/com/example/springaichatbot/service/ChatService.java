package com.example.springaichatbot.service;

import com.example.springaichatbot.controller.MessageDto;
import com.example.springaichatbot.controller.ModelGroup;
import com.example.springaichatbot.tools.DateTimeTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatClient remoteChatClient;
    private final ChatClient localChatClient;
    private final ChatMemory chatMemory;
    private final Resource systemPromptResource;
    private final List<String> remoteModels;
    private final List<String> localModels;
    private final String defaultModel;

    public ChatService(
            @Qualifier("remoteChatClient") ChatClient remoteChatClient,
            @Qualifier("localChatClient") ChatClient localChatClient,
            ChatMemory chatMemory,
            @Value("${app.system-prompt-file}") Resource systemPromptResource,
            @Value("${app.models-remote}") List<String> remoteModels,
            @Value("${app.models-local}") List<String> localModels,
            @Value("${app.default-model}") String defaultModel
    ) {
        this.remoteChatClient = remoteChatClient;
        this.localChatClient = localChatClient;
        this.chatMemory = chatMemory;
        this.systemPromptResource = systemPromptResource;
        this.remoteModels = remoteModels.stream().map(String::trim).filter(StringUtils::hasText).toList();
        this.localModels = localModels.stream().map(String::trim).filter(StringUtils::hasText).toList();
        this.defaultModel = defaultModel;
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

        ChatClient.ChatClientRequestSpec request = client.prompt()
                .system(systemPromptResource)
                .user(userMessage)
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(sessionId)
                        .build())
                .tools(new DateTimeTools())
                .options(OpenAiChatOptions.builder().model(resolvedModel).build());

        return request.call().content();
    }

    /**
     * Streaming chat: sends the user message and returns a Flux of content chunks.
     */
    public Flux<String> chatStream(String sessionId, String userMessage, String model) {
        String resolvedModel = resolveModel(model);
        ChatClient client = getChatClientForModel(resolvedModel);

        ChatClient.ChatClientRequestSpec request = client.prompt()
                .system(systemPromptResource)
                .user(userMessage)
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(sessionId)
                        .build())
                .tools(new DateTimeTools())
                .options(OpenAiChatOptions.builder().model(resolvedModel).build());

        return request.stream().content();
    }

    /**
     * Returns the full message history for the given session.
     */
    public List<MessageDto> getHistory(String sessionId) {
        List<Message> messages = chatMemory.get(sessionId, Integer.MAX_VALUE);
        if (messages == null) {
            return List.of();
        }
        return messages.stream()
                .filter(m -> m instanceof UserMessage || m instanceof AssistantMessage)
                .map(m -> {
                    String role = m instanceof UserMessage ? "user" : "assistant";
                    return new MessageDto(role, m.getText());
                })
                .collect(Collectors.toList());
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
}
