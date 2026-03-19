# Implementation Plan: CRM-CHAT-ASSISTANT

## Test Command
```bash
cd ciam && mvn clean compile && cd ../backend && mvn clean compile && cd ../frontend && npx ng build
```

## Tasks

### Phase 1: Permission & Configuration (independent tasks)

- [ ] 1.1 **CIAM: Add `CRM_ASSISTENT` permission**
  - File: `ciam/src/main/kotlin/com/crm/ciam/security/Permission.kt` — add `CRM_ASSISTENT` to enum
  - File: `ciam/src/main/kotlin/com/crm/ciam/security/RolePermissionMapping.kt` — add to VERTRIEB set (ADMIN gets it automatically via `allOf`)
  - Verify: `cd ciam && mvn clean compile`

- [ ] 1.2 **Backend: Configuration properties**
  - File (NEW): `backend/src/main/java/com/crm/config/AssistantProperties.java` — `@ConfigurationProperties(prefix = "assistant")` record with nested `AnthropicProperties`, `HistoryProperties`, `ContextProperties`
  - File (MODIFY): `backend/src/main/resources/application.properties` — add `assistant.anthropic.api-key`, `assistant.anthropic.model`, `assistant.anthropic.max-tokens`, `assistant.history.max-pairs`, `assistant.history.ttl-minutes`, `assistant.context.max-records-per-entity`, `spring.mvc.async.request-timeout=60000`
  - File (MODIFY): Main application class — add `@EnableConfigurationProperties(AssistantProperties.class)` + `@EnableScheduling`

- [ ] 1.3 **Backend: DTOs**
  - File (NEW): `backend/src/main/java/com/crm/dto/ChatRequestDTO.java` — record with `@NotBlank @Size(max=2000) String message`
  - File (NEW): `backend/src/main/java/com/crm/dto/ChatMessageDTO.java` — record with `String role, String content`

- [ ] 1.4 **Frontend: Chat model**
  - File (NEW): `frontend/src/app/core/models/assistant.model.ts` — `ChatMessage` interface (role, content, timestamp, isStreaming, isError) + `ChatRequest` interface

### Phase 2: Backend Services

- [ ] 2.1 **CrmContextBuilder service**
  - File (NEW): `backend/src/main/java/com/crm/service/CrmContextBuilder.java`
  - Injects all 8 repositories + `AssistantProperties`
  - `buildContext(String userMessage, Collection<? extends GrantedAuthority> authorities)` — queries permitted entity types (max 50 records each), formats as structured text
  - Permission-to-entity mapping: FIRMEN→Firma, PERSONEN→Person, ABTEILUNGEN→Abteilung, ADRESSEN→Adresse, AKTIVITAETEN→Aktivitaet, GEHAELTER→Gehalt, VERTRAEGE→Vertrag, CHANCEN→Chance
  - Must be `@Transactional(readOnly = true)` (open-in-view=false)

- [ ] 2.2 **AnthropicClient service**
  - File (NEW): `backend/src/main/java/com/crm/service/AnthropicClient.java`
  - Uses `RestClient` to call `https://api.anthropic.com/v1/messages` with `stream: true`
  - `streamChat(systemPrompt, messages, Consumer<String> onChunk, Runnable onDone)` — reads raw InputStream line by line, parses SSE `data:` lines, extracts `content_block_delta` text deltas via ObjectMapper
  - Handles errors: 401→"nicht konfiguriert", 429→"bitte warten", 500→"nicht verfuegbar"

- [ ] 2.3 **ChatHistoryService**
  - File (NEW): `backend/src/main/java/com/crm/service/ChatHistoryService.java`
  - `ConcurrentHashMap<Long, ChatSession>` keyed by `benutzerId`
  - Methods: `getHistory(Long benutzerId)`, `addExchange(Long benutzerId, String userMsg, String assistantMsg)`
  - TTL eviction via `@Scheduled(fixedRate = 300_000)` — removes entries idle > 30 min
  - Max 20 message pairs, FIFO eviction

### Phase 3: Backend Controller + Frontend Service

- [ ] 3.1 **AssistantController**
  - File (NEW): `backend/src/main/java/com/crm/controller/AssistantController.java`
  - `@RestController @RequestMapping("/api/assistant") @PreAuthorize("hasAuthority('CRM_ASSISTENT')")`
  - `POST /chat` — accepts `ChatRequestDTO`, returns `SseEmitter(60000L)`
  - Runs on virtual thread (`Executors.newVirtualThreadPerTaskExecutor()`)
  - Orchestrates: build context → assemble system prompt (German) → get history → call AnthropicClient → stream chunks → save to history
  - System prompt: instructs LLM to answer only from CRM data, respond in German, use plain text formatting
  - Verify: `cd backend && mvn clean compile`

- [ ] 3.2 **Frontend: AssistantService**
  - File (NEW): `frontend/src/app/core/services/assistant.service.ts`
  - Uses `fetch()` with `ReadableStream` (NOT EventSource — cannot do POST/headers)
  - Manually attaches JWT from `AuthService.getAccessToken()`
  - `sendMessage(message, callbacks: {onToken, onDone, onError})` — parses SSE data lines, handles `[DONE]` sentinel
  - `AbortController` for cancellation

### Phase 4: Frontend UI

- [ ] 4.1 **ChatWidgetComponent**
  - File (NEW): `frontend/src/app/features/assistant/chat-widget/chat-widget.component.ts` — signals: `isOpen`, `messages`, `inputText`, `isLoading`; methods: `toggle()`, `send()`, `clearChat()`, `onKeydown()`, auto-scroll with manual-scroll-up detection
  - File (NEW): `frontend/src/app/features/assistant/chat-widget/chat-widget.component.html` — floating FAB button, expandable panel with header/messages/input, `@if`/`@for` control flow, aria labels
  - File (NEW): `frontend/src/app/features/assistant/chat-widget/chat-widget.component.scss` — fixed position bottom-right, z-index 1040, user/assistant bubble styles, streaming cursor animation, responsive at 480px

- [ ] 4.2 **Integrate widget into app shell**
  - File (MODIFY): `frontend/src/app/app.ts` — import `ChatWidgetComponent`, add `showAssistant = computed(() => this.authService.hasPermission('CRM_ASSISTENT'))`
  - File (MODIFY): `frontend/src/app/app.html` — add `@if (showAssistant()) { <app-chat-widget /> }` inside authenticated block, after main layout div

- [ ] 4.3 **i18n strings**
  - File (MODIFY): `frontend/public/i18n/de.json` — add `assistant` section with title, button labels, error messages

### Phase 5: Verification

- [ ] 5.1 Run full compile check: `cd ciam && mvn clean compile && cd ../backend && mvn clean compile && cd ../frontend && npx ng build`

## Tests

### Backend Tests (compile verification)
- [ ] CIAM compiles with new `CRM_ASSISTENT` permission
- [ ] Backend compiles with all new services and controller
- [ ] `AssistantProperties` binds correctly from `application.properties`

### Frontend Tests (build verification)
- [ ] Angular build succeeds with new component and service
- [ ] Chat widget renders only for users with `CRM_ASSISTENT` permission

### Manual/E2E Tests
- [ ] Start full stack, log in as ADMIN, see chat FAB button
- [ ] Click FAB, panel opens. Type question, get streaming response
- [ ] Ask "Welche Firmen gibt es?" — response references seed data
- [ ] Close and reopen panel — messages preserved
- [ ] Log in as PERSONAL user — no chat FAB visible
- [ ] Set empty API key — see "Assistent nicht konfiguriert" error
