package com.example.springaichatbot.service;

import com.example.springaichatbot.controller.MessageDto;
import com.example.springaichatbot.tools.DateTimeTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    private final Resource systemPromptResource;
    private final List<String> availableModels;
    private final String defaultModel;

    public ChatService(
            ChatClient chatClient,
            ChatMemory chatMemory,
            @Value("${app.system-prompt-file:classpath:prompts/system-prompt.txt}") Resource systemPromptResource,
            @Value("${app.models:gpt-4o-mini}") List<String> availableModels,
            @Value("${app.default-model:gpt-4o-mini}") String defaultModel
    ) {
        this.chatClient = chatClient;
        this.chatMemory = chatMemory;
        this.systemPromptResource = systemPromptResource;
        this.availableModels = availableModels.stream().map(String::trim).filter(StringUtils::hasText).toList();
        this.defaultModel = StringUtils.hasText(defaultModel) ? defaultModel : "gpt-4o-mini";
    }

    public List<String> getAvailableModels() {
        if (!availableModels.isEmpty()) {
            return availableModels;
        }
        return List.of(defaultModel);
    }

    public String getDefaultModel() {
        return defaultModel;
    }

    /**
     * Blocking chat: sends the user message and returns the full assistant response.
     */
    public String chat(String sessionId, String userMessage, String model) {
        ChatClient.ChatClientRequestSpec request = chatClient.prompt()
                .system(systemPromptResource)
                .user(userMessage)
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(sessionId)
                        .build())
                .tools(new DateTimeTools())
                .options(OpenAiChatOptions.builder().model(resolveModel(model)).build());

        return request.call().content();
    }

    /**
     * Streaming chat: sends the user message and returns a Flux of content chunks.
     */
    public Flux<String> chatStream(String sessionId, String userMessage, String model) {
        ChatClient.ChatClientRequestSpec request = chatClient.prompt()
                .system(systemPromptResource)
                .user(userMessage)
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(sessionId)
                        .build())
                .tools(new DateTimeTools())
                .options(OpenAiChatOptions.builder().model(resolveModel(model)).build());

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

        if (availableModels.isEmpty() || availableModels.contains(requestedModel)) {
            return requestedModel;
        }

        return defaultModel;
    }
}
