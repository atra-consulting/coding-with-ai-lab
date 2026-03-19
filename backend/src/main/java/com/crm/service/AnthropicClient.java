package com.crm.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.crm.config.AssistantProperties;
import com.crm.dto.ChatMessageDTO;

import tools.jackson.databind.ObjectMapper;

@Service
public class AnthropicClient {

    private static final Logger log = LoggerFactory.getLogger(AnthropicClient.class);
    private static final String API_URL = "https://api.anthropic.com/v1/messages";

    private final AssistantProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AnthropicClient(AssistantProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(API_URL)
                .build();
    }

    public void streamChat(String systemPrompt,
                           List<ChatMessageDTO> messages,
                           Consumer<String> onChunk,
                           Runnable onDone) {
        String apiKey = properties.anthropic().apiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Anthropic API key ist nicht konfiguriert");
        }

        Map<String, Object> requestBody = Map.of(
                "model", properties.anthropic().model(),
                "max_tokens", properties.anthropic().maxTokens(),
                "stream", true,
                "system", systemPrompt,
                "messages", messages.stream()
                        .map(m -> Map.of("role", m.role(), "content", m.content()))
                        .toList()
        );

        restClient.post()
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .body(requestBody)
                .exchange((request, response) -> {
                    if (response.getStatusCode().isError()) {
                        int status = response.getStatusCode().value();
                        String errorBody = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
                        log.error("Anthropic API error {}: {}", status, errorBody);

                        if (status == 401) {
                            throw new IllegalStateException("Anthropic API key ist nicht konfiguriert");
                        } else if (status == 429) {
                            throw new RuntimeException("Rate limit ueberschritten");
                        }
                        throw new RuntimeException("Anthropic API Fehler: " + status);
                    }

                    try (var reader = new BufferedReader(
                            new InputStreamReader(response.getBody(), StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (line.startsWith("data: ")) {
                                String data = line.substring(6).trim();
                                if ("[DONE]".equals(data)) {
                                    break;
                                }
                                String text = extractTextDelta(data);
                                if (text != null) {
                                    onChunk.accept(text);
                                }
                            }
                        }
                    }
                    onDone.run();
                    return null;
                });
    }

    @SuppressWarnings("unchecked")
    private String extractTextDelta(String json) {
        try {
            Map<String, Object> event = objectMapper.readValue(json, Map.class);
            String type = (String) event.get("type");
            if ("content_block_delta".equals(type)) {
                Map<String, Object> delta = (Map<String, Object>) event.get("delta");
                if (delta != null) {
                    return (String) delta.get("text");
                }
            }
            return null;
        } catch (Exception e) {
            log.debug("Could not parse SSE chunk: {}", json);
            return null;
        }
    }
}
