package com.example.springaichatbot.controller;

import com.example.springaichatbot.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * Blocking chat endpoint — returns the full assistant response.
     */
    @PostMapping
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String response = chatService.chat(request.sessionId(), request.message());
        return new ChatResponse(response);
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

