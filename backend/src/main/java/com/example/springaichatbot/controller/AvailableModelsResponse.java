package com.example.springaichatbot.controller;

import java.util.List;

public record AvailableModelsResponse(List<String> models, String defaultModel) {
}

