package com.crm.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.crm.config.AssistantProperties;
import com.crm.dto.ChatMessageDTO;

@Service
public class ChatHistoryService {

    private static final Logger log = LoggerFactory.getLogger(ChatHistoryService.class);

    private final int maxPairs;
    private final int ttlMinutes;
    private final ConcurrentHashMap<Long, ChatSession> sessions = new ConcurrentHashMap<>();

    public ChatHistoryService(AssistantProperties properties) {
        this.maxPairs = properties.history().maxPairs();
        this.ttlMinutes = properties.history().ttlMinutes();
    }

    public List<ChatMessageDTO> getHistory(Long benutzerId) {
        ChatSession session = sessions.get(benutzerId);
        if (session == null) {
            return List.of();
        }
        session.touch();
        return session.getMessages();
    }

    public void addExchange(Long benutzerId, String userMessage, String assistantResponse) {
        ChatSession session = sessions.computeIfAbsent(benutzerId, k -> new ChatSession());
        session.addExchange(userMessage, assistantResponse, maxPairs);
    }

    @Scheduled(fixedRate = 300_000)
    public void evictExpired() {
        Instant cutoff = Instant.now().minus(ttlMinutes, ChronoUnit.MINUTES);
        int removed = 0;
        var it = sessions.entrySet().iterator();
        while (it.hasNext()) {
            var entry = it.next();
            if (cutoff.isAfter(entry.getValue().lastAccess)) {
                it.remove();
                removed++;
            }
        }
        if (removed > 0) {
            log.debug("Evicted {} expired chat sessions", removed);
        }
    }

    private static class ChatSession {
        private final List<ChatMessageDTO> messages = new ArrayList<>();
        volatile Instant lastAccess = Instant.now();

        synchronized List<ChatMessageDTO> getMessages() {
            return List.copyOf(messages);
        }

        synchronized void addExchange(String userMessage, String assistantResponse, int maxPairs) {
            messages.add(new ChatMessageDTO("user", userMessage));
            messages.add(new ChatMessageDTO("assistant", assistantResponse));
            while (messages.size() > maxPairs * 2) {
                messages.removeFirst();
                messages.removeFirst();
            }
            touch();
        }

        void touch() {
            lastAccess = Instant.now();
        }
    }
}
