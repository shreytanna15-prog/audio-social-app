---
name: expo-clean-architecture
description: A scalable, modular architecture pattern for Expo Router + React Native apps. Organizes code by domain features, enforces one-way dependency flow, and provides clear conventions for state management, UI, navigation, and data layers.
version: 1.0.0
license: MIT
---

# Expo Clean Architecture

**You MUST use this skill when asked to architect, refactor, or restructure an Expo app's codebase.**

This is NOT a migration guide. It defines the **target state** — what the project should look like after applying these rules. An agent should be able to take any Expo project and reshape it to match this pattern.

## Core Principles

1. **Routes are thin shells** — `app/` only defines navigation layouts and connects routes to feature screens. No business logic.
2. **Code is organized by domain, not by file type** — a feature owns everything it needs (components, hooks, services, types, data).
3. **Dependencies flow one way** — `app/` → `features/` → `shared/` → `core/`. Never the reverse.
4. **State has clear ownership** — UI state is local, client state lives in feature stores, server state belongs to a query layer.
5. **Shared code must be earned** — if only one feature uses a thing, keep it in that feature. Promote to shared only when 2+ features need it.

## Project Structure

```
project-root/
│
├── app/                              # Expo Router — navigation ONLY
│   ├── _layout.tsx                   # Root layout: providers only
│   ├── index.tsx                     # Home page
│   ├── +not-found.tsx                # 404 handler
│   ├── (auth)/                       # Auth route group
│   │   ├── _layout.tsx               # Auth layout (redirect logic)
│   │   ├── login.tsx                 # Thin screen shell
│   │   └── register.tsx
│   ├── (tabs)/                       # Tab navigation group
│   │   ├── _layout.tsx               # Tab bar configuration
│   │   ├── feed.tsx
│   │   └── profile.tsx
│   └── [feature]/                    # Dynamic/detail routes
│       └── [id].tsx
│
├── src/
│   ├── features/                     # DOMAIN FEATURES (one folder per product domain)
│   │   ├── auth/
│   │   │   ├── components/           # Feature-specific UI (NOT reusable)
│   │   │   ├── hooks/                # Feature-specific hooks
│   │   │   ├── services/             # Business logic / use cases
│   │   │   ├── api/                  # API calls for this feature
│   │   │   ├── store/                # Zustand store (if needed)
│   │   │   ├── types/                # Feature-specific types
│   │   │   ├── utils/                # Feature-specific helpers
│   │   │   └── index.ts              # Public barrel export only
│   │   │
│   │   └── audio/                    # Example: audio feature
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── domain/               # Pure logic, no React imports
│   │       ├── data/                 # Repository pattern (file I/O, DB)
│   │       ├── store/
│   │       ├── types/
│   │       ├── utils/
│   │       └── index.ts
│   │
│   ├── shared/                       # REUSABLE ACROSS FEATURES (used by 2+)
│   │   ├── components/               # Design system (UI primitives)
│   │   │   ├── ui/                   # Button, Text, View, Input, Card
│   │   │   └── layout/               # ScreenWrapper, SafeAreaContainer
│   │   ├── hooks/                    # Generic hooks (useDebounce, useNetworkStatus)
│   │   ├── utils/                    # Pure helpers (formatDate, formatDuration)
│   │   └── types/                    # Shared types (pagination, API responses)
│   │
│   ├── core/                         # INFRASTRUCTURE (no business logic)
│   │   ├── theme/                    # Colors, spacing, typography tokens
│   │   │   ├── colors.ts
│   │   │   ├── typography.ts
│   │   │   ├── spacing.ts
│   │   │   └── index.ts
│   │   ├── api/                      # Base API client + interceptors
│   │   │   ├── client.ts            # Axios/fetch wrapper
│   │   │   ├── errors.ts            # Typed error classes
│   │   │   └── index.ts
│   │   ├── storage/                  # MMKV / expo-file-system wrappers
│   │   ├── config/                   # Environment config
│   │   └── types/                    # Global ambient types
│   │
│   ├── store/                        # Only cross-feature Zustand stores
│   │   └── app.store.ts             # e.g., theme, feature flags
│   │
│   └── global.css                    # Tailwind CSS entry (optional)
│
├── assets/
│   ├── images/
│   ├── fonts/
│   └── animations/
│
├── modules/                          # Custom Expo native modules
│   └── my-native-module/
│
├── app.json
├── app.config.ts
├── tsconfig.json
├── metro.config.js
└── package.json
```

## Dependency Flow

```
app/  ──►  features/  ──►  shared/  ──►  core/
  │          │                │              │
  │          │                │              │
  └────── Only import features ──────────────┘
                     │
                     └── Features can import shared/ and core/
                                  │
                                  └── shared/ and core/ must NEVER import from features/
```

**Rules:**
- `app/` → can import from `features/`, `shared/`, `core/`
- `features/` → can import from `shared/`, `core/`, and other `features/` ONLY via their public `index.ts` barrel
- `shared/` → can import from `core/` only. MUST NOT import from `features/`
- `core/` → MUST NOT import from `features/` or `shared/`
- **No circular imports. Ever.**

## Naming Conventions

```
┌─────────────────────┬─────────────────────────┬──────────────────────────────┐
│ Category            │ Convention              │ Examples                     │
├─────────────────────┼─────────────────────────┼──────────────────────────────┤
│ Files               │ kebab-case              │ use-auth.ts, auth-service.ts │
│ React components    │ PascalCase (file + fn)  │ LoginForm.tsx, UserCard.tsx  │
│ Hooks               │ use-prefix + kebab      │ use-auth.ts, use-debounce.ts │
│ Services/classes    │ PascalCase or camelCase  │ AuthService, recorderService │
│ Functions/variables │ camelCase               │ handleLogin(), isSubmitting  │
│ Constants           │ UPPER_SNAKE_CASE        │ MAX_FILE_SIZE, API_TIMEOUT   │
│ Types/interfaces    │ PascalCase               │ type User, interface AuthState│
│ Enums               │ PascalCase               │ enum RecordingMode           │
│ Stores              │ camelCase + Store suffix │ useAuthStore, settingsStore  │
│ Directories         │ kebab-case              │ audio/, shared/              │
│ Tests               │ co-located, .test.      │ auth-service.test.ts         │
└─────────────────────┴─────────────────────────┴──────────────────────────────┘
```

## Screen File Pattern

Every screen file in `app/` must be a **thin shell** — at most ~20 lines, no business logic:

```tsx
// app/(tabs)/feed.tsx — CORRECT: thin shell
import FeedScreen from '@/features/feed/components/feed-screen';

export default function FeedRoute() {
  return <FeedScreen />;
}
```

```tsx
// app/(tabs)/feed.tsx — WRONG: too much logic in route
import { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { fetchPosts } from '@/features/feed/api';  // ❌ should live in feature

export default function FeedRoute() {
  const [posts, setPosts] = useState([]);           // ❌ state in route
  // ... 50+ lines of logic
}
```

## State Management Rules

### 1. Local State (`useState` / `useReducer`)

Use for state that lives entirely within one component or one screen.

- Form inputs
- Toggle states (modals, expand/collapse)
- Animation progress
- Scroll position

### 2. Feature State (Zustand store inside feature/)

Use for state shared across multiple components WITHIN one feature.

```tsx
// features/audio/store/audio-session.store.ts
import { create } from 'zustand';

type AudioSessionState = {
  status: 'idle' | 'recording' | 'paused' | 'preview';
  timerSeconds: number;
  recordingMode: string | null;
};

type AudioSessionActions = {
  startRecording: (mode: string) => Promise<void>;
  stopRecording: () => Promise<void>;
  reset: () => void;
};

export const useAudioSessionStore = create<AudioSessionState & AudioSessionActions>(
  (set) => ({
    status: 'idle',
    timerSeconds: 0,
    recordingMode: null,

    startRecording: async (mode) => {
      // ❌ DO NOT put service calls here
      // Delegate to a service function, then update state:
      set({ status: 'recording', recordingMode: mode, timerSeconds: 0 });
    },

    stopRecording: async () => {
      set({ status: 'preview' });
    },

    reset: () => {
      set({ status: 'idle', timerSeconds: 0, recordingMode: null });
    },
  }),
);
```

**Store rules:**
- Store holds state shape + simple actions that call services
- Store MUST NOT import data/repository layers directly
- Store MUST NOT contain complex business logic — delegate to services
- Use selectors (`useStore(s => s.field)`) to avoid unnecessary re-renders
- Never persist the entire store — persist only specific slices

### 3. Cross-Feature State (Zustand store in src/store/)

Use ONLY when 3+ features need the same state.

Good candidates:
- Theme (dark/light)
- Auth/session token
- Feature flags
- Network status

### 4. Server State (TanStack Query)

When the app fetches from an API, use TanStack Query:

```tsx
// features/feed/api/use-feed.ts
import { useQuery } from '@tanstack/react-query';

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: () => fetch('/api/feed').then(r => r.json()),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
```

**Never put server response data into Zustand.** Let React Query own the cache.

## Service Layer Pattern

Business logic lives in **services**, not in stores, not in components:

```tsx
// features/audio/services/recording.service.ts
// Pure functions / classes — no React imports, no hooks

export const recordingService = {
  async startRecording(mode: string): Promise<string> {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission denied');
    }
    // ... start actual recording
    return recordingUri;
  },

  async processRecording(uri: string, mode: string): Promise<string> {
    // ... run FFmpeg, denoising, etc.
    return processedUri;
  },
};
```

Components call services via hooks. Hooks bridge services and state:

```tsx
// features/audio/hooks/use-recording.ts
import { useAudioSessionStore } from '../store/audio-session.store';
import { recordingService } from '../services/recording.service';

export function useRecording() {
  const { status, startRecording, stopRecording } = useAudioSessionStore();

  const handleStart = async (mode: string) => {
    startRecording(mode);                          // update state first
    const uri = await recordingService.startRecording(mode); // then execute
    // ... update with result
  };

  return { status, handleStart, handleStop: stopRecording };
}
```

## Data Layer (Repository Pattern)

Data access is abstracted behind repositories. Components never touch the file system or database directly:

```tsx
// features/audio/data/recording.repository.ts
import * as FileSystem from 'expo-file-system';

export const recordingRepository = {
  async save(id: string, data: Blob): Promise<string> {
    const path = `${FileSystem.documentDirectory}recordings/${id}.m4a`;
    await FileSystem.writeAsStringAsync(path, data);
    return path;
  },

  async list(): Promise<Recording[]> {
    // read index, return list
  },

  async delete(id: string): Promise<void> {
    // remove file + update index
  },
};
```

## Theme & Design System

Never hardcode colors or spacing. Use semantic tokens.

```tsx
// core/theme/colors.ts
export const colors = {
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#E8E8ED',
  },
  text: {
    primary: '#1C1C1E',
    secondary: '#636366',
    link: '#007AFF',
  },
  accent: {
    blue: '#007AFF',
    green: '#34C759',
    red: '#FF3B30',
  },
} as const;
```

```tsx
// core/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
```

Design system components in `shared/components/ui/` use these tokens:

```tsx
// shared/components/ui/button.tsx
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '@/core/theme';
import { spacing } from '@/core/theme';

type ButtonProps = {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onPress: () => void;
  disabled?: boolean;
};

export function Button({ title, variant = 'primary', onPress, disabled }: ButtonProps) {
  return (
    <Pressable
      style={[styles.base, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.accent.blue },
  secondary: { backgroundColor: colors.background.secondary },
  ghost: { backgroundColor: 'transparent' },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#FFFFFF' },
  secondaryText: { color: colors.text.primary },
  ghostText: { color: colors.accent.blue },
  disabled: { opacity: 0.5 },
});
```

## Layout File Patterns

### Root Layout — Providers Only

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/core/api/query-client';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### Auth Layout — Guard Logic

```tsx
// app/(auth)/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack />;
}
```

### Tab Layout — Configuration Only

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

## Import Conventions

- **Always** use `@/` path alias for cross-directory imports
- Use **relative imports** only within the same feature directory
- Features expose a **public barrel** (`index.ts`) — other features import ONLY from there

```tsx
// features/audio/index.ts — public API
export { useRecording } from './hooks/use-recording';
export { AudioPlayer } from './components/audio-player';
export type { Recording } from './types/recording';

// Outside the feature — MUST import from barrel:
import { useRecording, AudioPlayer } from '@/features/audio';
// NEVER do this:
import { useRecording } from '@/features/audio/hooks/use-recording';
```

```
Import order (separate groups by blank line):
1. Node/built-in modules
2. External packages (react, expo, zustand, etc.)
3. Internal packages (@/core, @/shared)
4. Feature imports (@/features/...)
5. Relative imports (./, ../)
6. CSS/styles
```

## TypeScript Rules

- Define types CLOSE to where they're used
- Feature-specific types go in `features/[name]/types/`
- Shared domain types go in `shared/types/`
- Global/infrastructure types go in `core/types/`
- Prefer `type` over `interface` (more constrained, faster compilation)
- Use `as const` for constants and enums
- Never use `any` — use `unknown` and narrow

```tsx
// features/audio/types/recording.ts
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'optimizing' | 'preview';

export type RecordingMode = 'speech' | 'instrument' | 'mixed' | 'raw';

export type Recording = {
  id: string;
  uri: string;
  durationMs: number;
  mode: RecordingMode;
  createdAt: string;
};
```

## Decision Tree

```
Question: "Where does this code belong?"
│
├── Is it a route, layout, or navigation config?
│   ├── YES → app/
│   └── NO  ↓
│
├── Is it specific to ONE product domain (auth, audio, feed, etc.)?
│   ├── YES → features/[domain]/
│   │   ├── UI only?               → components/
│   │   ├── React-side-effect?     → hooks/
│   │   ├── Business logic?        → services/
│   │   ├── API communication?     → api/
│   │   ├── File/DB access?        → data/
│   │   ├── Shared state?          → store/
│   │   ├── Pure types?            → types/
│   │   └── Pure functions?        → utils/
│   └── NO  ↓
│
├── Is it used by 2+ features?
│   ├── YES → Is it a UI primitive?           → shared/components/ui/
│   ├── YES → Is it a generic hook?           → shared/hooks/
│   ├── YES → Is it a pure helper?            → shared/utils/
│   ├── YES → Is it a shared type?            → shared/types/
│   └── NO  ↓
│
├── Is it infrastructure? (API client, storage, config, theme)
│   ├── YES → core/
│   └── NO  ↓
│
└── Keep it local to the component via useState
```

## Common Mistakes

**Mistake 1: Business logic in route files**
```tsx
// ❌ WRONG
export default function AudioScreen() {
  const [recording, setRecording] = useState(null);
  useEffect(() => { /* ... complex init */ }, []);
  // ... 100 lines
}
```
```tsx
// ✅ CORRECT
import { RecordingScreen } from '@/features/audio/components/recording-screen';
export default function AudioRoute() {
  return <RecordingScreen />;
}
```

**Mistake 2: Store importing data layer directly**
```tsx
// ❌ WRONG
import { create } from 'zustand';
import { stagePreviewRecording } from '../data/recording-repository';
```
```tsx
// ✅ CORRECT — store updates state, services do the work
import { create } from 'zustand';
import { recordingService } from '../services/recording.service';

// Store calls service, service calls repository
```

**Mistake 3: Scattered hardcoded colors**
```tsx
// ❌ WRONG — 15 components each with '#F8F9FA'
```
```tsx
// ✅ CORRECT — single source of truth
import { colors } from '@/core/theme';
// colors.background.secondary
```

**Mistake 4: Barrel imports from deep paths**
```tsx
// ❌ WRONG — reaching into another feature's internals
import { useAuthStore } from '@/features/auth/store/auth.store';
```
```tsx
// ✅ CORRECT — through the public barrel
import { useAuthStore } from '@/features/auth';
```

**Mistake 5: Mixed naming conventions**
```
// ❌ WRONG — inconsistent
recording-repository.ts
use-audio-recorder-binding.ts
RecordingCard.tsx
audio-effects.service.ts

// ✅ CORRECT — consistent
kebab-case for files: recording-repository.ts, use-audio-recorder.ts
PascalCase for components: RecordingCard.tsx
```

**Mistake 6: Zustand as a catch-all**
```tsx
// ❌ WRONG — server data in Zustand
const { posts } = useFeedStore();
```
```tsx
// ✅ CORRECT — server data in TanStack Query
const { data: posts } = useQuery({ queryKey: ['feed'], queryFn: fetchPosts });
```

## Example Invocations

User: "Refactor the project using expo-clean-architecture rules"
→ Restructure `src/` into `features/`, `shared/`, `core/`. Move routes into thin shells. Extract business logic into services. Create theme tokens.

User: "Where should I put this API call?"
→ If it's specific to one feature → `features/[name]/api/`. If it's the base client setup → `core/api/client.ts`.

User: "How do I organize state in this app?"
→ `useState` for local UI, Zustand inside feature for shared client state, TanStack Query for server data, `core/store/` only for cross-feature concerns.

User: "Fix this screen — it has 200 lines and is hard to read"
→ Extract business logic into `services/`, data access into `data/`, create a `components/` file for UI, leave the screen as a thin composition shell.

User: "Add a new feature called 'messaging'"
→ Create `features/messaging/` with its own components, hooks, services, api, types, and store. Wire routes in `app/(tabs)/messages.tsx` as a thin shell.

User: "Our codebase is messy with no structure"
→ Apply the full architecture: create `features/`, `shared/`, `core/` directories. Move files by domain. Standardize naming. Extract theme. Create barrel exports.
