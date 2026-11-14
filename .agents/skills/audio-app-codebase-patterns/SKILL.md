---
name: audio-app-codebase-patterns
description: >-
  Build or change features in audio-social-app (VibeOGram) using its Expo Router,
  feature-folder, React Query, apiRequest, and studio/player conventions. Use when
  adding screens, hooks, API clients, library/social UI, navigation, or app
  integrations in this repository. Prefer this skill over generic Expo architecture
  skills when they conflict with this repo.
---

# Audio App Codebase Patterns

Use this skill for **all app work** in `audio-social-app`. This repo’s real layout and product rules win over generic Expo/React Native skills.

**Sibling backend:** `audio-social-backend`. Product SSOT: that repo’s `docs/project-context.md` and feature docs under `docs/`. Do not invent API shapes or Prisma models — match the backend.

**Golden examples:** `src/features/tracks`, `src/features/projects`, `src/features/users`, `src/features/saves`, `src/features/comments`.

---

## Conflict resolution (skill precedence)

| Concern | Follow |
|---------|--------|
| Feature folders, `api/` + hooks, auth client, studio vs player, Superpowered, product wiring | **This skill** |
| Generic feature-layer ideas | `expo-clean-architecture` — **adapt**; do not reorganize the app just to match that skill |
| Lists / animation / RN performance | `vercel-react-native-skills` |
| Fetch / React Query patterns | `native-data-fetching` (adapt to this repo’s `apiRequest` + feature hooks) |
| Expo Router UI primitives | `building-native-ui` |
| Visual / mobile UX critique | `mobile-design` only |

Agent home for skills is **`.agents/skills/`** only. Do not add `.claude/skills` duplicates.

---

## Stack (this repo)

- Expo ~56, Expo Router, React Native, TypeScript
- NativeWind / Tailwind v4
- TanStack React Query (`@/core/api/query-client`)
- Zustand for some local/player/studio state
- `apiRequest` from `@/core/api` (JWT + refresh)
- Studio audio: `expo-audio`, **`superpowered-audio`**, FFmpeg, etc.
- Comments rule: `.cursor/rules/comments.mdc` — rare comments, why only

Read Expo versioned docs per root `AGENTS.md` (v56) when using Expo APIs.

---

## Source layout

```text
src/
├── app/                      # Expo Router — thin route shells only
├── features/<domain>/        # screens, components, api/, hooks, types
│   ├── api/
│   │   ├── service.ts        # apiRequest calls
│   │   ├── hooks.ts          # useQuery / useMutation
│   │   └── types.ts          # DTO types aligned with backend
│   ├── screens/
│   ├── components/
│   ├── index.ts              # public barrel exports
│   └── ...
├── shared/                   # UI kit, navigation, cross-feature utils
├── core/                     # api client, theme, query-client
└── modules/                  # native packages (superpowered-audio, input-monitor)
```

**Dependency direction:** `app/` → `features/` → `shared/` / `core/`. Features should not import other features’ deep internals; use barrels (`@/features/tracks`) when crossing domains. Promote to `shared/` only when 2+ features need it.

---

## Routes vs features

- `src/app/**` files are **thin**: import a screen from a feature and render it (plus layout/auth redirects).
- Business logic, data fetching, and domain UI live under `src/features/<domain>/`.
- Do not dump new screens only under `app/` without a feature home.

---

## API + React Query conventions

1. **HTTP:** use `apiRequest` from `@/core/api` (envelope `{ success, message, data }` / error `{ success: false, code, message }`).
2. **Base URL:** `EXPO_PUBLIC_API_URL` (see `src/core/api/client.ts`).
3. **Per feature:**
   - `api/service.ts` — plain async functions calling the backend
   - `api/hooks.ts` — `useQuery` / `useMutation`, stable query keys (`TRACKS_QUERY_KEY`, etc.)
   - `api/types.ts` — types matching backend DTOs
4. **Invalidate** related keys in `onSuccess` (see `useSaveTrackDraft` invalidating `tracks` + `projects`).
5. Export public hooks/types from `features/<domain>/index.ts`.
6. Do not call `fetch` ad hoc for authenticated API when `apiRequest` already handles auth refresh.

Copy `tracks` / `projects` / `saves` / `comments` when adding a new API-backed feature.

---

## Studio vs listen player (critical)

| Surface | Tech | Role |
|---------|------|------|
| **Studio** (quick record, multitrack, import, effects) | Superpowered + `expo-audio` + local files | Create/edit drafts; backup to cloud |
| **Global player** (mini / Now Playing) | App player store (+ future stream of **mixUrl**) | Listen to published (and queued) social audio |

- **Do not** change Superpowered modules, approved effect values, or native audio patches unless the user **explicitly** asks.
- **Do not** merge studio playback into the social player or vice versa.
- Social listen audio is the published **mix** from object storage, not stems.
- Player may still be stubby (progress/queue); extend carefully without breaking studio.

Local draft sync (create → backup → restore → delete) lives with `features/tracks` + `features/audio` / `features/studio`. Follow existing backup/restore helpers; don’t invent a parallel sync protocol.

---

## UI conventions

- Prefer existing `@/shared/components` primitives (`Text`, `Button`, sheets, feedback dialog).
- Styling: NativeWind `className` patterns already used in neighboring screens.
- Lists: follow `vercel-react-native-skills` (virtualize, avoid leaked `&&` falsy renders, wrap strings in `<Text>`).
- Design critique / polish: `mobile-design` — not other design skills (removed from this repo).
- Replace fixtures with API when a feature doc says the backend exists; don’t leave dead fixture imports.

---

## Product boundaries (don’t build unless asked)

From backend `docs/project-context.md`:

- Feed (reels), Notifications, Recommendation, Tanpura, Concerts/coins, Subscriptions/payments, Admin — **deferred**.
- Song **heart** = Liked Songs (`features/saves` / like APIs), not a second like system.
- Comments: published tracks only; 1-level replies; hard delete own — match backend `docs/features/track-comments.md`.
- Share: OS share for MVP.

When product rules and UI disagree, **backend docs + schema win**; fix the app toward the docs.

---

## Implementation workflow

1. Read backend `docs/project-context.md` + relevant `docs/features/<feature>.md` if the change is API-backed.
2. Find the owning `features/<domain>/` (or create one matching peers).
3. Add/adjust `api/types` → `service` → `hooks`; export from `index.ts`.
4. Wire thin `app/` route to a feature screen.
5. Invalidate the right query keys; handle `ApiError` with existing feedback patterns.
6. Do not touch Superpowered / effect presets casually.
7. Avoid drive-by refactors and speculative folders.
8. Comments: only non-obvious why (`.cursor/rules/comments.mdc`).

---

## Important boundaries

- One skills root: **`.agents/skills/`**. Do not reintroduce `.claude/skills`.
- Do not invent backend endpoints or Prisma fields from the app side.
- Do not “fix” architecture by applying `expo-clean-architecture` wholesale if it fights existing `features/` + `core/` + `shared/`.
- Prefer small diffs that match neighboring feature code.

---

## Quick checklist

- [ ] Right `features/<domain>/` + barrel export  
- [ ] `service` + `hooks` + types; `apiRequest` used  
- [ ] Thin `app/` route  
- [ ] Query keys invalidated  
- [ ] Superpowered / studio DSP left alone unless requested  
- [ ] Product rules match backend docs  
- [ ] No new overlapping design/agent folders  
