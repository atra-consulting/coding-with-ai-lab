package com.crm.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.crm.dto.ChatMessageDTO;
import com.crm.dto.ChatRequestDTO;
import com.crm.security.JwtPrincipal;
import com.crm.service.AnthropicClient;
import com.crm.service.ChatHistoryService;
import com.crm.service.CrmContextBuilder;

import jakarta.annotation.PreDestroy;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/assistant")
@PreAuthorize("hasAuthority('CRM_ASSISTENT')")
public class AssistantController {

    private static final Logger log = LoggerFactory.getLogger(AssistantController.class);

    private final CrmContextBuilder contextBuilder;
    private final AnthropicClient anthropicClient;
    private final ChatHistoryService chatHistoryService;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public AssistantController(CrmContextBuilder contextBuilder,
                                AnthropicClient anthropicClient,
                                ChatHistoryService chatHistoryService) {
        this.contextBuilder = contextBuilder;
        this.anthropicClient = anthropicClient;
        this.chatHistoryService = chatHistoryService;
    }

    @PreDestroy
    void shutdown() {
        executor.shutdown();
    }

    @DeleteMapping("/history")
    public void clearHistory(Authentication authentication) {
        JwtPrincipal principal = (JwtPrincipal) authentication.getPrincipal();
        chatHistoryService.clearHistory(principal.benutzerId());
    }

    @PostMapping("/chat")
    public SseEmitter chat(@Valid @RequestBody ChatRequestDTO request,
                           Authentication authentication) {
        JwtPrincipal principal = (JwtPrincipal) authentication.getPrincipal();
        Long benutzerId = principal.benutzerId();

        SseEmitter emitter = new SseEmitter(60_000L);

        emitter.onCompletion(() -> log.debug("SSE completed for user {}", benutzerId));
        emitter.onTimeout(() -> {
            log.warn("SSE timeout for user {}", benutzerId);
            emitter.complete();
        });
        emitter.onError(e -> log.warn("SSE error for user {}", benutzerId, e));

        executor.execute(() -> {
            StringBuilder fullResponse = new StringBuilder();
            AtomicBoolean aborted = new AtomicBoolean(false);
            try {
                String crmContext = contextBuilder.buildContext(
                        request.message(), authentication.getAuthorities());

                String systemPrompt = buildSystemPrompt(crmContext);

                List<ChatMessageDTO> history = chatHistoryService.getHistory(benutzerId);
                List<ChatMessageDTO> messages = new ArrayList<>(history);
                messages.add(new ChatMessageDTO("user", request.message()));

                anthropicClient.streamChat(
                        systemPrompt,
                        messages,
                        chunk -> {
                            if (aborted.get()) return;
                            try {
                                fullResponse.append(chunk);
                                emitter.send(SseEmitter.event().data(chunk));
                            } catch (IOException e) {
                                log.warn("SSE send failed", e);
                                aborted.set(true);
                                emitter.completeWithError(e);
                            }
                        },
                        () -> {
                            if (aborted.get()) return;
                            try {
                                emitter.send(SseEmitter.event().data("[DONE]"));
                                emitter.complete();
                                chatHistoryService.addExchange(
                                        benutzerId, request.message(), fullResponse.toString());
                            } catch (IOException e) {
                                emitter.completeWithError(e);
                            }
                        }
                );
            } catch (Exception e) {
                if (aborted.get()) return;
                log.error("Assistant chat error", e);
                try {
                    String errorMsg = resolveErrorMessage(e);
                    emitter.send(SseEmitter.event().name("error").data(errorMsg));
                    emitter.complete();
                } catch (IOException ex) {
                    emitter.completeWithError(ex);
                }
            }
        });

        return emitter;
    }

    private String buildSystemPrompt(String crmContext) {
        return """
                Du bist ein CRM-Assistent. Du beantwortest Fragen ausschließlich auf Basis der \
                bereitgestellten CRM-Daten. Wenn die Daten keine Antwort hergeben, sage: \
                "Ich habe keine relevanten CRM-Daten zu dieser Frage gefunden."

                Antworte NICHT auf Fragen, die nichts mit den CRM-Daten zu tun haben. \
                Verwende kein Allgemeinwissen. Beziehe dich nur auf die unten stehenden Daten.

                Antworte auf Deutsch. Verwende einfache Textformatierung (Aufzählungen mit \
                Bindestrichen, keine Markdown-Überschriften).

                === CRM-DATEN ===
                %s
                === ENDE CRM-DATEN ===
                """.formatted(crmContext.isEmpty()
                ? "Keine CRM-Daten verfügbar."
                : crmContext);
    }

    private String resolveErrorMessage(Exception e) {
        String msg = e.getMessage();
        if (msg != null && msg.contains("nicht konfiguriert")) {
            return "Assistent nicht konfiguriert.";
        }
        if (msg != null && msg.contains("Rate limit")) {
            return "Bitte warten Sie einen Moment.";
        }
        return "Assistent ist derzeit nicht verfügbar.";
    }
}
