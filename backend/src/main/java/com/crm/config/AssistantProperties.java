package com.crm.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "assistant")
public record AssistantProperties(
    AnthropicProperties anthropic,
    HistoryProperties history,
    ContextProperties context
) {
    public record AnthropicProperties(
        String apiKey,
        String model,
        int maxTokens
    ) {}

    public record HistoryProperties(
        int maxPairs,
        int ttlMinutes
    ) {}

    public record ContextProperties(
        int maxRecordsPerEntity
    ) {}
}
