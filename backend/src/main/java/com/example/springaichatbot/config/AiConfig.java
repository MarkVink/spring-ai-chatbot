package com.example.springaichatbot.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class AiConfig {

    @Value("${app.openai-base-url-remote:}")
    private String remoteBaseUrl;

    @Value("${app.openai-api-key-remote:}")
    private String remoteApiKey;

    @Value("${app.openai-base-url-local:http://localhost:11434/v1}")
    private String localBaseUrl;

    @Value("${app.openai-api-key-local:}")
    private String localApiKey;

    @Bean
    public ChatMemory chatMemory() {
        return new InMemoryChatMemory();
    }

    /**
     * OpenAiApi appends "/v1/chat/completions" to the base URL internally.
     * Strip a trailing "/v1" from the configured URL to avoid "/v1/v1/..." doubles.
     */
    private static String normalizeBaseUrl(String url) {
        if (url == null) return url;
        String trimmed = url.stripTrailing();
        // Remove trailing slash first, then check for /v1 suffix
        if (trimmed.endsWith("/")) trimmed = trimmed.substring(0, trimmed.length() - 1);
        if (trimmed.endsWith("/v1")) trimmed = trimmed.substring(0, trimmed.length() - 3);
        return trimmed;
    }

    /**
     * OpenAiChatModel for remote API (OpenAI, etc.)
     */
    @Bean(name = "remoteOpenAiChatModel")
    public OpenAiChatModel remoteOpenAiChatModel() {
        if (!StringUtils.hasText(remoteBaseUrl)) {
            throw new IllegalStateException("Remote base URL must be set via SPRING_AI_OPENAI_BASE_URL or app.openai-base-url-remote");
        }
        if (!StringUtils.hasText(remoteApiKey)) {
            throw new IllegalStateException("Remote API key must be set via SPRING_AI_OPENAI_API_KEY or app.openai-api-key-remote");
        }

        OpenAiApi remoteApi = new OpenAiApi(normalizeBaseUrl(remoteBaseUrl), remoteApiKey);
        return new OpenAiChatModel(remoteApi);
    }

    /**
     * OpenAiChatModel for local API (Ollama, LM Studio, etc.)
     */
    @Bean(name = "localOpenAiChatModel")
    public OpenAiChatModel localOpenAiChatModel() {
        if (!StringUtils.hasText(localBaseUrl)) {
            throw new IllegalStateException("Local base URL must be set via SPRING_AI_OPENAI_BASE_URL_LOCAL or app.openai-base-url-local");
        }

        OpenAiApi localApi = new OpenAiApi(normalizeBaseUrl(localBaseUrl), StringUtils.hasText(localApiKey) ? localApiKey : "dummy");
        return new OpenAiChatModel(localApi);
    }

    /**
     * ChatClient for remote models
     */
    @Bean(name = "remoteChatClient")
    public ChatClient remoteChatClient(OpenAiChatModel remoteOpenAiChatModel) {
        return ChatClient.builder(remoteOpenAiChatModel).build();
    }

    /**
     * ChatClient for local models
     */
    @Bean(name = "localChatClient")
    public ChatClient localChatClient(OpenAiChatModel localOpenAiChatModel) {
        return ChatClient.builder(localOpenAiChatModel).build();
    }

    /**
     * Default ChatClient (uses remote if available, otherwise local)
     */
    @Bean
    @ConditionalOnMissingBean
    public ChatClient chatClient(ChatClient.Builder builder) {
        if (StringUtils.hasText(remoteBaseUrl) && StringUtils.hasText(remoteApiKey)) {
            return remoteChatClient(remoteOpenAiChatModel());
        }
        return localChatClient(localOpenAiChatModel());
    }
}

