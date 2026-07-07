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

Bootstrap 5.3.8 is loaded after these variables so that Bootstrap utilities inherit the overrides. The load order is defined in the `styles` array of `frontend/angular.json`: first `src/_variables.scss`, then `node_modules/bootstrap/scss/bootstrap.scss`, then `src/styles.scss`. `styles.scss` also contains a redundant `@import 'variables'` at its top, which is harmless because the Angular build processes the `styles` array entries first. Custom SCSS is layered on top ("Bootstrap-first" convention: use Bootstrap utilities first, reach for custom rules only when Bootstrap cannot do it). Dark mode is not supported.

---

## AG Grid Theming

All entity list views use `ag-grid-angular` with `themeQuartz` as the base theme. Every list component applies the same param override:

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

- Bootstrap spinner element: `spinner-border text-primary` (only `spinner-border` is used; `spinner-grow` is not).

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

---

## Rechner Chart Colors

Canonical home. Cross-referenced from the Produktivität → Rechner section in `SPECS-frontend.md`.

| Chart | Slice / segment | Color |
|-------|-----------------|-------|
| Pie A (Arbeit vs. Warten) — all 4 tabs | Arbeit / KI-Arbeit | `#264892` |
| Pie A (Arbeit vs. Warten) — all 4 tabs | Warten | `#cf944f` |
| Pie B (Rollen-Split) — agile tabs only | BA | `#6f42c1` |
| Pie B (Rollen-Split) — agile tabs only | Dev | `#0f766e` |
| Pie B (Rollen-Split) — agile tabs only | Tester | `#9a6700` |

`#264892` and `#cf944f` also color the work/wait segments of the Balken bar and the Flussdiagramm boxes. The 3 role colors are fixed, identical across both agile tabs, and distinct from Bootstrap's `success`/`danger` semantic colors. Each slice's percent label is white (`#fff`), on both Pie A and Pie B.

---

## Public-Page Card Template

### Shared pattern — Login, FeedbackQr

These two components share the same visual template:

- Centered card (`.login-card` / `.qr-card`), `width: 480px`.
- `border-radius: 12px` — except `.qr-card` which uses `border-radius: 16px`.
- Entry animation: `slideUp 0.4s ease-out` (`translateY(20px) → 0`, `opacity 0 → 1`).
- Header gradient: `linear-gradient(135deg, $primary 0%, color.adjust($primary, $lightness: -8%) 100%)`.
- Box shadow: `0 10px 40px rgba(38, 72, 146, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)`.
- Page wrapper uses `min-height: 100vh`, flexbox centering, and a light diagonal gradient background (`135deg, #f5f6f8 → #e8eaf0 → #dde1ea`).

### Deviating component — FeedbackForm

`feedback-form.component.scss` does not follow the shared template above. Its differences:

- Card is responsive: `width: 100%`, `max-width: 580px` (not a fixed `480px`).
- `border-radius: 20px` (not `12px`).
- Box shadow: `0 20px 60px rgba(38, 72, 146, 0.10), 0 4px 16px rgba(0, 0, 0, 0.05)` (not the shared shadow).
- Entry animation: `slideUp 0.5s ease-out` (duration is `0.5s`, not `0.4s`); start position is `translateY(24px)` (not `20px`).
- Header gradient lightness adjustment: `-10%` (not `-8%`).
- Page background gradient: `linear-gradient(160deg, #f0f2f7 0%, #e2e6f0 50%, #d8dde9 100%)` — different angle (`160deg` vs `135deg`) and different stop colors.

---

## Cross-Reference

Component behavior and usage contracts: `docs/specs/SPECS-frontend.md`
