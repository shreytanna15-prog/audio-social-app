# VibeOGram app (`audio-social-app`)

Before changing screens, features, or API clients in this repo:

1. Read product context in the sibling backend: **`../audio-social-backend/docs/project-context.md`** (and relevant `docs/features/*.md` there).
2. Follow **`.agents/skills/audio-app-codebase-patterns/SKILL.md`** (this repo’s coding SSOT — wins over generic Expo architecture when they conflict).
3. Supporting skills (same `.agents/skills/` root): `expo-clean-architecture`, `vercel-react-native-skills`, `native-data-fetching`, `building-native-ui`, `mobile-design`.
4. Do **not** change Superpowered / approved DSP values unless the user explicitly asks.
5. Do not invent backend APIs or Prisma models — match the backend docs + schema.

Skills live under **`.agents/skills/`** only (no `.claude/skills`).

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any Expo API code.
