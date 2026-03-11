package com.example.springaichatbot.controller;

import com.example.springaichatbot.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * Blocking chat endpoint executed on a worker scheduler to keep Netty event-loop non-blocking.
     */
    @PostMapping
    public Mono<ChatResponse> chat(@RequestBody ChatRequest request) {
        return Mono.fromCallable(() -> chatService.chat(request.sessionId(), request.message(), request.model()))
                .subscribeOn(Schedulers.boundedElastic())
                .map(ChatResponse::new);
    }

    /**
     * Streaming chat endpoint — returns SSE JSON chunks to preserve token boundaries and whitespace.
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<ChatStreamChunk>> chatStream(@RequestBody ChatRequest request) {
        return chatService.chatStream(request.sessionId(), request.message(), request.model())
                .map(token -> ServerSentEvent.builder(new ChatStreamChunk(token))
                        .event("token")
                        .build());
    }

    @GetMapping("/system-prompt")
    public Mono<String> systemPrompt() {
        return Mono.fromCallable(chatService::getSystemPrompt)
                .subscribeOn(Schedulers.boundedElastic());
    }

    @GetMapping("/models")
    public AvailableModelsResponse models() {
        return new AvailableModelsResponse(
                chatService.getAvailableModels(),
                chatService.getDefaultModel()
        );
    }

    /**
     * Validates a model name against configured models.
     */
    @PostMapping("/validate-model")
    public Map<String, Boolean> validateModel(@RequestBody Map<String, String> request) {
        String model = request.get("model");
        boolean valid = chatService.isValidModel(model);
        return Map.of("valid", valid);
    }

    /**
     * Returns the full message history for the given session.
     */
    @GetMapping("/history/{sessionId}")
    public List<MessageDto> history(@PathVariable String sessionId) {
        return chatService.getHistory(sessionId);
    }
}
