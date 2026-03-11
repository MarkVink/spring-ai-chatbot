package com.example.springaichatbot.controller;

import com.example.springaichatbot.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;

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
        return Mono.fromCallable(() -> chatService.chat(request.sessionId(), request.message()))
                .subscribeOn(Schedulers.boundedElastic())
                .map(ChatResponse::new);
    }

    /**
     * Streaming chat endpoint — returns SSE text/event-stream.
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@RequestBody ChatRequest request) {
        return chatService.chatStream(request.sessionId(), request.message());
    }

    /**
     * Returns the full message history for the given session.
     */
    @GetMapping("/history/{sessionId}")
    public List<MessageDto> history(@PathVariable String sessionId) {
        return chatService.getHistory(sessionId);
    }
}
