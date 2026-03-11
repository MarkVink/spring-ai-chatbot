package com.example.springaichatbot.controller;

public record ChatRequest(String sessionId, String message, String model) {
}
