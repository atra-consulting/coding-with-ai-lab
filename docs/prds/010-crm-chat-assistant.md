# PRD-010: CRM Chat Assistant

## Source

Internal initiative. Learning goal: "RAG light" -- provide CRM data as context to an LLM API. No existing AI, chat, or streaming code in the codebase.

Related PRDs:
- [007-globale-volltextsuche.md](007-globale-volltextsuche.md) -- similar "query CRM data" pattern, but UI-driven not AI-driven.

## Problem Statement

Users ask questions about CRM data every day. Questions like:

- "Which companies in Munich had no activities this quarter?"
- "Show me all contracts expiring next month."
- "Who are the top contacts at Schmidt AG?"

Today, answering these requires manual work:
1. Navigate to the correct list view.
2. Apply filters (if they exist).
3. Cross-reference multiple entities manually.
4. Repeat for each follow-up question.

**Pain points:**
- Multi-entity queries are impossible in a single step.
- No natural language interface. Users must know the UI.
- Time wasted on repetitive lookups.

## Requirements

### REQ-001: Chat Widget

The frontend shows a floating chat button. Bottom-right corner.

- Click expands a chat panel (overlay, not a full page).
- Panel has a message input, send button, and scrollable message history.
- Collapsible. User can minimize back to the floating button.
- Panel does not block navigation. Other pages remain usable.
- Widget only visible to users with `CRM_ASSISTENT` permission.

Priority: High.

### REQ-002: Send Message to Backend

User types a question in natural language. Frontend sends it to the backend.

- Endpoint: `POST /api/assistant/chat`
- Request body: `{ "message": "..." }`
- Backend returns a streaming response (SSE).
- Frontend displays tokens as they arrive.

Priority: High.

### REQ-003: CRM Data Context (RAG Light)

The backend analyzes the user question. It queries relevant CRM data from the database. It injects that data as context into the LLM prompt.

- The backend determines which entities are relevant (Firmen, Personen, Aktivitaeten, Chancen, Vertraege, Adressen).
- It runs targeted queries against H2. **Approach: dump all relevant entity data (limited to max 50 records per entity type) as structured text context. Let the LLM reason over the data.** This is simple and works well for the H2 dataset size.
- It formats the results as structured text.
- It sends a prompt to the LLM: system instructions + CRM context + user question.
- **Max input message length:** 2000 characters.

Priority: High.

### REQ-004: Streaming Responses via SSE

Responses stream token by token. Users see text appear incrementally.

- Backend uses `SseEmitter` (Spring MVC). Not WebFlux.
- Frontend uses `fetch()` with `ReadableStream` to consume the SSE stream. **Not** the `EventSource` API (it only supports GET and cannot send custom headers or POST bodies).
- The `fetch()` call includes the JWT `Authorization` header and sends a POST body.
- Each SSE event contains a text chunk from the LLM.
- A final `[DONE]` event signals completion.
- If the stream closes without a `[DONE]` event, the frontend shows "[Antwort abgebrochen]".
- Timeout: 60 seconds max per response.
- Auto-scroll: The chat panel scrolls to the bottom as new tokens arrive. Stops auto-scrolling if the user manually scrolls up.

Priority: High.

### REQ-005: LLM Integration (Anthropic Claude API)

The backend calls the Anthropic Claude API to generate answers.

- API key and model name are configurable via `application.properties`.
- Properties: `assistant.anthropic.api-key`, `assistant.anthropic.model`, `assistant.anthropic.max-tokens`.
- The backend makes an HTTP call to `https://api.anthropic.com/v1/messages` with streaming enabled.
- System prompt instructs the LLM to answer based only on the provided CRM data.
- System prompt is in German.

Priority: High.

### REQ-006: Chat History (In-Memory)

Chat history persists for a limited time. No database storage. Backend is stateless (no HTTP sessions).

- Backend stores conversation history in a `ConcurrentHashMap` keyed by **user ID** (extracted from JWT `benutzerId` claim).
- History includes user messages and assistant responses.
- History is sent as context with each new request (up to a configurable limit).
- **TTL-based eviction:** Entries expire after 30 minutes of inactivity (no session concept exists in the stateless architecture).
- Max history: 20 message pairs (configurable).
- Frontend stores messages in component state. Page refresh clears frontend display and backend history (frontend sends empty history marker on first message).

Priority: Medium.

### REQ-007: Access Control

New permission: `CRM_ASSISTENT`.

- Add to `Permission.kt` enum.
- Assign to ADMIN and VERTRIEB roles in `RolePermissionMapping.kt`.
- Backend controller: `@PreAuthorize("hasAuthority('CRM_ASSISTENT')")`.
- Frontend route guard: not applicable (widget is not a route). Use `AuthService.hasPermission('CRM_ASSISTENT')` directly in the template.
- Chat widget hidden when user lacks the permission.
- **Data filtering:** The context builder must respect the user's role permissions. Only include entity types the user has permission to access (e.g., VERTRIEB cannot see Gehalt data, PERSONAL cannot see Vertrag/Chance data).

Priority: High.

### REQ-008: Error Handling

Graceful degradation when things fail.

| Scenario | Behavior |
|----------|----------|
| LLM API unreachable | Display: "Assistent ist derzeit nicht verfuegbar." |
| LLM API key missing/invalid | Log error. Display: "Assistent nicht konfiguriert." |
| SSE connection drops | Display: "Verbindung unterbrochen." Allow retry. |
| Query returns no CRM data | Assistant responds: "Ich habe keine relevanten CRM-Daten zu dieser Frage gefunden." Does NOT fall back to general knowledge. |
| Rate limit exceeded | Display: "Bitte warten Sie einen Moment." |

Priority: High.

## Special Instructions

### What This Is NOT

- Not a general-purpose chatbot. It answers CRM data questions only.
- Not a replacement for search. The global search (PRD-007) handles exact lookups.
- Not an autonomous agent. It does not create, update, or delete CRM data.
- Not a production RAG system. No vector database. No embeddings. Simple query-based context injection.

### Constraints

- **No WebFlux.** The backend uses `spring-boot-starter-webmvc`. Use `SseEmitter` for streaming.
- **No new database tables.** Chat history lives in memory only.
- **No external dependencies beyond an HTTP client for the Anthropic API.** Use Spring's `RestClient` or `RestTemplate`.
- **API key must never appear in frontend code or API responses.**
- **German UI labels.** All chat interface text in German.

## Implementation Approach

### Backend

1. **New permission:** Add `CRM_ASSISTENT` to `Permission.kt`. Assign to ADMIN and VERTRIEB in `RolePermissionMapping.kt`.

2. **Configuration:** New properties in `application.properties` for Anthropic API key, model, max tokens, and history limit.

3. **Context builder service:** Analyzes the user question for keywords. Maps keywords to entity types. Runs targeted JPA queries. Formats results as text for the LLM prompt.

4. **LLM client service:** Calls the Anthropic Messages API with streaming. Reads the streamed response chunks. Forwards each chunk to the `SseEmitter`.

5. **Chat controller:** `POST /api/assistant/chat`. Accepts user message. Returns `SseEmitter`. Orchestrates: context lookup, prompt assembly, LLM call, streaming response.

6. **User-keyed chat history:** Stores message pairs in a `ConcurrentHashMap` keyed by user ID (from JWT `benutzerId` claim). TTL-based eviction (30 min idle). Trims to max size. Included in each LLM call as conversation context.

### Frontend

1. **Chat widget component:** Floating button (bottom-right). Expands to a panel with message list and input field. Uses Angular signals for state.

2. **Chat service:** Sends POST request. Connects to SSE endpoint. Parses incoming text chunks. Updates the message list reactively.

3. **SSE consumption:** Uses `fetch()` with `ReadableStream` (NOT `EventSource`). The `fetch` call includes the JWT `Authorization` header. Parses incoming SSE `data:` lines. Appends tokens to the current assistant message as they arrive.

4. **Routing/visibility:** Widget rendered conditionally based on `CRM_ASSISTENT` permission. No dedicated route needed (widget overlays all pages).

5. **Proxy configuration:** Add `/api/assistant` route to `proxy.conf.json` (already covered by the existing `/api` catch-all rule targeting port 7070).

## Test Strategy

### Backend Tests

| Test | Validates |
|------|-----------|
| Controller returns `SseEmitter` with correct content type | SSE endpoint setup |
| Controller rejects unauthenticated requests | Security config |
| Controller rejects users without `CRM_ASSISTENT` | Permission enforcement |
| Context builder extracts "Firmen" from question about companies | Keyword-to-entity mapping |
| Context builder returns empty context for irrelevant questions | Edge case handling |
| Chat history stores and retrieves messages per user | Session management |
| Chat history trims at max limit | Memory bounds |
| LLM client handles API errors gracefully | Error paths |

### Frontend Tests

| Test | Validates |
|------|-----------|
| Chat widget hidden without `CRM_ASSISTENT` permission | Access control |
| Chat widget toggles open/closed | UI interaction |
| Sending a message shows it in the message list | Message flow |
| SSE tokens append to the assistant message | Streaming display |
| Connection error shows error message in chat | Error handling |
| Chat panel does not block page navigation | Overlay behavior |

### Manual/E2E Tests

- Ask "Welche Firmen gibt es in Muenchen?" and verify response references actual seed data.
- Ask a follow-up question and verify the assistant remembers context.
- Open chat, navigate to a different page, verify chat stays open.
- Log out and log back in. Verify chat history is cleared.
- Remove `CRM_ASSISTENT` permission from a role. Verify widget disappears.

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Latency** | First token appears within 2 seconds of sending a message. |
| **Streaming** | Tokens render incrementally. No waiting for full response. |
| **Memory** | Chat history capped at 20 message pairs per user. Old messages evicted first. |
| **Security** | API key stored server-side only. Never exposed to frontend. |
| **Security** | SSE endpoint requires valid JWT + `CRM_ASSISTENT` permission. |
| **Timeout** | SSE connection times out after 60 seconds. |
| **Availability** | Chat failure does not affect other CRM features. Widget fails silently. |
| **Accessibility** | Chat panel supports keyboard navigation. Input field is focusable. Messages are screen-reader friendly. |
| **i18n** | All UI strings use ngx-translate. German is the only language for now. |
| **Configuration** | LLM provider settings are externalized. No hardcoded API keys or model names. |

## Success Criteria

1. A user with `CRM_ASSISTENT` permission can open the chat widget from any page.
2. The user types a CRM question in German. The assistant responds with data from the H2 database.
3. The response streams token by token. The user sees incremental text.
4. The assistant answers "Welche Firmen aus Muenchen haben noch keine Aktivitaeten dieses Quartal?" with a correct, data-backed response.
5. Follow-up questions within the same session use conversation history.
6. Users without `CRM_ASSISTENT` permission never see the chat widget.
7. If the Anthropic API is unreachable, the user sees a clear error message. No crash. No blank screen.

## Open Questions

1. **Rate limiting:** Should we limit requests per user per minute? If yes, what threshold?
2. **Multi-language:** Should the assistant respond in the language of the question, or always in German?
3. **Audit logging:** Should we log chat interactions for compliance or debugging?

## Resolved Decisions

1. **EventSource vs fetch:** Use `fetch()` with `ReadableStream`. EventSource cannot send POST or custom headers.
2. **Session vs user-keyed history:** Use JWT `benutzerId` as map key with 30-min TTL eviction. No HTTP sessions exist.
3. **Role-based data filtering:** Context builder respects user permissions. Not optional.
4. **No CRM data found:** Assistant says "keine relevanten Daten gefunden". No general knowledge fallback.
5. **Token budget:** Max 50 records per entity type. Simple approach for H2 dataset size.
6. **Markdown in responses:** System prompt instructs LLM to use plain text with simple formatting. No markdown library needed.

## Implementation

_Not yet implemented._
