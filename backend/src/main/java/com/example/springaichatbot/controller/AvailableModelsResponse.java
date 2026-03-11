package com.example.springaichatbot.controller;

import java.util.List;

public record AvailableModelsResponse(List<ModelGroup> groups, String defaultModel) {
}

