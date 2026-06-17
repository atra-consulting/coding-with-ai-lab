# UI / Design-System Specification

Visual and styling facts for the CRM frontend. Component behavior and usage contracts live in `docs/specs/SPECS-frontend.md`.

---

## Design Tokens

Defined in `frontend/src/_variables.scss` and imported globally.

| Token | Value | Usage |
|-------|-------|-------|
| `$primary` | `#264892` | Brand blue — buttons, sidebar bg, page-header border |
| `$secondary` | `#777777` | Muted text, secondary actions |
| `$danger` | `#dc421e` | Destructive actions, active sidebar indicator |
| `$light` | `#dedede` | Light gray surfaces |
| `$body-bg` | `#f5f6f8` | Page background |
| Font | `"Helvetica Neue", Helvetica, Arial, sans-serif` | `$font-family-sans-serif` |

Bootstrap 5.3.x (`bootstrap` ^5.3.8 in `frontend/package.json`) is loaded after these variables so that Bootstrap utilities inherit the overrides. Custom SCSS is layered on top ("Bootstrap-first" convention: use Bootstrap utilities first, reach for custom rules only when Bootstrap cannot do it). Dark mode is supported via `data-bs-theme="dark"` on the `<html>` element, toggled by a button in the navbar and persisted to `localStorage` — see the [Dark Mode](#dark-mode) section.

---

## AG Grid Theming

All entity list views use `ag-grid-angular` (`ag-grid-angular` / `ag-grid-community` ^35.1.0 in `frontend/package.json`) with `themeQuartz` as the base theme. Every list component applies the same param override:

```ts
theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
```

Grid element sizing in every list template:

```html
style="width: 100%; height: calc(100vh - 180px)"
```

Global header overrides in `frontend/src/styles.scss` (applied via CSS class selectors that AG Grid exposes):

| Selector | Property | Value | `!important` |
|----------|----------|-------|:---:|
| `.ag-header` | `background-color` | `#f0f4ff` | yes |
| `.ag-header` | `border-bottom` | `3px solid #0044cc` | yes |
| `.ag-header-cell-label` | `color` | `#0044cc` | yes |
| `.ag-header-cell-label` | `font-weight` | `800` | yes |
| `.ag-header-cell-label` | `text-transform` | `uppercase` | no |
| `.ag-header-cell-label` | `font-size` | `0.85rem` | no |
| `.ag-header-cell-label` | `letter-spacing` | `0.05em` | no |
| `.ag-header-icon` | `color` | `#0044cc` | yes |

> **Note:** The five rows marked `yes` in the `!important` column carry that flag in the source. These overrides require `!important` to penetrate AG Grid's own theme cascade (themeQuartz applies its styles via high-specificity scoped selectors). Rows without `!important` target properties that AG Grid's theme does not set directly, so the flag is not needed there.

Note: `#0044cc` is a grid-only blue distinct from `$primary` (`#264892`). It is used nowhere else.

---

## AG Grid Cell Renderers

Custom Angular cell renderer components used inside AG Grid list views. Icons come from FontAwesome (`@fortawesome/free-solid-svg-icons` v7.x, rendered via `@fortawesome/angular-fontawesome` ^4.0.0 — see `frontend/package.json`).

### Aktivitaet type icon — `typ-icon-cell-renderer.component.ts`

Renders the Aktivitaet `typ` column as a FontAwesome icon followed by a German label (icon has `me-1` spacing). Mapping (`TYP_MAP`):

| `typ` value | Icon | Label |
|-------------|------|-------|
| ANRUF | `faPhone` | Anruf |
| EMAIL | `faEnvelope` | E-Mail |
| MEETING | `faUsers` | Meeting |
| NOTIZ | `faNoteSticky` | Notiz |
| AUFGABE | `faListCheck` | Aufgabe |

Unknown / empty values fall back to `faQuestion` and show the raw value as the label.

Location: `frontend/src/app/features/aktivitaet/aktivitaet-list/typ-icon-cell-renderer.component.ts`.

### Firma favorite star — `star-cell-renderer.component.ts`

Renders the Firma `favorit` column as a clickable star button.

- Icon: `faStar`, color `#ffc107` (Bootstrap warning yellow).
- Favorite state shown via opacity: `opacity: 1` when favorite, `0.3` when not.
- It is a `btn btn-link p-0` button with `aria-label="Als Favorit markieren"`; clicking calls the parent's `onToggle(id, currentValue)` callback (passed via cell renderer params) and stops event propagation so the row is not selected.

Location: `frontend/src/app/features/firma/firma-list/star-cell-renderer.component.ts`.

---

## Global Layout Measurements

Values from `frontend/src/styles.scss`.

### Sidebar

| State | CSS variable | Width |
|-------|-------------|-------|
| Expanded | `--sidebar-width: 250px` (set on `body`) | 250 px |
| Collapsed | `--sidebar-width: 60px` (set on `.sidebar-collapsed`) | 60 px |

- Position: `fixed`, `top: 56px`, `left: 0`, `z-index: 100`.
- `width: var(--sidebar-width)`.
- Transition: `width var(--sidebar-transition)` where `--sidebar-transition: 0.3s ease`.
- Background: `$primary` (`#264892`).
- Min-height: `calc(100vh - 56px)`.

### Navbar

- Height: `56px` (referenced by sidebar `top` and `.main-content` `margin-top`).

### `.main-content`

```scss
margin-left: var(--sidebar-width);
padding: 1.5rem;
margin-top: 56px;
transition: margin-left var(--sidebar-transition);
```

### `.page-header h2`

```scss
color: #264892;           // forced with !important
border-bottom: 3px solid #264892;
padding-bottom: 0.25rem;
font-weight: 700;
margin-bottom: 0;
```

---

## Surface Tokens

### `.table-container`

```scss
background: #fff;
border-radius: 0.5rem;
padding: 1.5rem;
box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
```

### `.card`

```scss
border: none;
box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
// hover lift:
box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
transition: box-shadow 0.15s ease-in-out;
```

---

## Widget Card Border-Left Semantics

`.widget-card` uses a 4px left border. The modifier classes are **inverted** relative to Bootstrap's default semantic colors:

| Class | Border color | Semantic meaning |
|-------|-------------|-----------------|
| `.primary` | `#264892` | Primary KPI |
| `.success` | `#a7c6eb` | Light blue — NOT Bootstrap green |
| `.warning` | `#f98752` | Warm orange |
| `.info` | `#dc421e` | Danger/attention — NOT Bootstrap teal |

These four classes are used on Dashboard widget cards only.

---

## Sidebar Navigation Styles

### Section Headers

```scss
// .nav-section-header
color: #a7c6eb;
font-size: 0.75rem;
text-transform: uppercase;
letter-spacing: 0.05em;
font-weight: 600;
```

### Nav Links

```scss
// .sidebar .nav-link
color: #adb5bd;       // default
// hover:
color: #fff;
background-color: rgba(255, 255, 255, 0.1);
// active:
color: #fff;
background-color: rgba(220, 66, 30, 0.15);
border-left: 3px solid $danger;   // $danger = #dc421e
```

FontAwesome icons (`fa-icon`) have a fixed `width: 20px` with `margin-right: 0.5rem` for alignment. In collapsed state the margin drops to 0.

---

## Shared Components — Appearance

Usage contracts (which service to inject, how to call) are in `SPECS-frontend.md`.

### NotificationComponent

- Fixed top-right Bootstrap alert.
- Auto-hides after 5 seconds.

### ConfirmDialogComponent

- Rendered via `NgbModal` (ng-bootstrap modal API).

### LoadingSpinnerComponent

- Bootstrap spinner element (`spinner-border` or `spinner-grow`).

### EurCurrencyPipe

- Formats numbers as EUR in `de-DE` locale, 2 decimal places (e.g. `1.234,56 €`).

---

## Phase Badge Color Map

Canonical home. Cross-referenced from the Chance Board section in `SPECS-frontend.md`.

| ChancePhase value | Bootstrap badge class |
|-------------------|-----------------------|
| NEU | `bg-primary` |
| QUALIFIZIERT | `bg-info` |
| ANGEBOT | `bg-warning text-dark` |
| VERHANDLUNG | `bg-secondary` |
| GEWONNEN | `bg-success` |
| VERLOREN | `bg-danger` |

Source: `frontend/src/app/shared/pipes/chance-phase-badge.pipe.ts` (`PHASE_BADGE_CLASSES`). ANGEBOT carries the extra `text-dark` token because Bootstrap's yellow `bg-warning` needs dark text for contrast. Unknown values fall back to `bg-secondary`.

---

## Dark Mode

The app supports a light/dark theme toggle.

- **Toggle location**: a button in the navbar (`frontend/src/app/layout/navbar/`), shown only when a user is logged in. It displays a moon icon (`faMoon`) in light mode and a sun icon (`faSun`) in dark mode, with German `aria-label`/`title` ("Dunkelmodus umschalten" / "Hellmodus umschalten").
- **Theming mechanism**: `ThemeService` (`frontend/src/app/core/services/theme.service.ts`) sets `data-bs-theme="dark"` (or `"light"`) on the `<html>` element. This uses Bootstrap 5.3's native color-mode support — Bootstrap components and utilities adapt automatically; no custom dark-mode SCSS is required.
- **State & persistence**: the current mode is held in an Angular signal and persisted to `localStorage` under the key `theme` (stored as a JSON boolean `isDark`). An `effect()` writes to `localStorage` and re-applies the `data-bs-theme` attribute on every change; the stored value is read back on startup so the choice survives reloads. Default is light mode.

---

## Public-Page Card Template

### Shared pattern — Login, Welcome, FeedbackQr

These three components share the same visual template:

- Centered card (`.login-card` / `.welcome-card` / `.qr-card`), `width: 480px`.
- `border-radius: 12px` — except `.qr-card` which uses `border-radius: 16px`.
- Entry animation: `slideUp 0.4s ease-out` (`translateY(20px) → 0`, `opacity 0 → 1`).
- Header gradient: `linear-gradient(135deg, $primary 0%, color.adjust($primary, $lightness: -8%) 100%)`.
- Box shadow: `0 10px 40px rgba(38, 72, 146, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)`.
- Page wrapper uses `min-height: 100vh`, flexbox centering, and a light diagonal gradient background (`135deg, #f5f6f8 → #e8eaf0 → #dde1ea`).

### Deviating component — FeedbackForm

`feedback-form.component.scss` does not follow the shared template above. Its differences:

- Card is responsive: `width: 100%`, `max-width: 580px` (not a fixed `480px`).
- `border-radius: 20px` (not `12px`).
- Entry animation: `slideUp 0.5s ease-out` (duration is `0.5s`, not `0.4s`).
- Header gradient lightness adjustment: `-10%` (not `-8%`).
- Page background gradient: `linear-gradient(160deg, #f0f2f7 0%, #e2e6f0 50%, #d8dde9 100%)` — different angle (`160deg` vs `135deg`) and different stop colors.

---

## Cross-Reference

Component behavior and usage contracts: `docs/specs/SPECS-frontend.md`
