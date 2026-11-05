/**
 * Local mock API for VibeOGram QA when Singer backend .env / /api/tracks are unavailable.
 * Matches app envelope: { success, data } and auth + tracks routes used by the client.
 * Persist: .local-dev-api-data.json (gitignored via leading dot in scripts cwd).
 */
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.LOCAL_DEV_API_PORT || 3015);
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', '.local-dev-api-data.json');

/** @typedef {{ id: string, email: string, username: string, name: string | null, password: string, createdAt: string, updatedAt: string }} User */
/** @typedef {{ id: string, userId: string, kind: string, status: string, storageState: string, title: string, durationMs: number, mixUrl: string | null, publishedAt: string | null, createdAt: string, updatedAt: string, layers: unknown[] }} Track */

const state = loadState();

function loadState() {
  if (existsSync(DATA_PATH)) {
    try {
      return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
    } catch {
      /* fall through */
    }
  }
  return { users: /** @type {User[]} */ ([]), tracks: /** @type {Track[]} */ ([]), tokens: {} };
}

function saveState() {
  writeFileSync(DATA_PATH, JSON.stringify(state, null, 2));
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, x-refresh-token',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  });
  res.end(payload);
}

function ok(res, data, message = 'OK') {
  json(res, 200, { success: true, message, data });
}

function created(res, data, message = 'Created') {
  json(res, 201, { success: true, message, data });
}

function fail(res, status, message, code = 'BAD_REQUEST') {
  json(res, status, { success: false, message, code });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

function issueTokens(userId) {
  const accessToken = `access_${userId}_${randomUUID()}`;
  const refreshToken = `refresh_${userId}_${randomUUID()}`;
  state.tokens[accessToken] = { userId, type: 'access' };
  state.tokens[refreshToken] = { userId, type: 'refresh' };
  saveState();
  return { accessToken, refreshToken };
}

function userPublic(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function authUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const entry = state.tokens[token];
  if (!entry || entry.type !== 'access') return null;
  return state.users.find((u) => u.id === entry.userId) || null;
}

function listItem(track) {
  return {
    id: track.id,
    kind: track.kind,
    status: track.status,
    storageState: track.storageState,
    title: track.title,
    durationMs: track.durationMs,
    mixUrl: track.mixUrl,
    createdAt: track.createdAt,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method || 'GET';

  if (method === 'OPTIONS') {
    return json(res, 204, {});
  }

  if (method === 'GET' && path === '/') {
    return ok(res, { service: 'local-dev-api', port: PORT });
  }

  if (method === 'POST' && path === '/api/auth/signup') {
    const body = await readBody(req);
    if (!body?.email || !body?.password || !body?.username || !body?.name) {
      return fail(res, 400, 'Missing signup fields');
    }
    if (state.users.some((u) => u.email === body.email.toLowerCase())) {
      return fail(res, 400, 'Email is already registered');
    }
    if (state.users.some((u) => u.username === body.username.toLowerCase())) {
      return fail(res, 400, 'Username is already taken');
    }
    const now = new Date().toISOString();
    /** @type {User} */
    const user = {
      id: randomUUID(),
      email: String(body.email).toLowerCase().trim(),
      username: String(body.username).toLowerCase().trim(),
      name: String(body.name).trim(),
      password: String(body.password),
      createdAt: now,
      updatedAt: now,
    };
    state.users.push(user);
    const tokens = issueTokens(user.id);
    return created(res, { user: userPublic(user), tokens }, 'Signup successful');
  }

  if (method === 'POST' && path === '/api/auth/login') {
    const body = await readBody(req);
    const user = state.users.find(
      (u) => u.email === String(body?.email || '').toLowerCase() && u.password === body?.password,
    );
    if (!user) return fail(res, 401, 'Invalid credentials', 'UNAUTHORIZED');
    const tokens = issueTokens(user.id);
    return ok(res, { user: userPublic(user), tokens }, 'Login successful');
  }

  if (method === 'POST' && path === '/api/auth/refresh') {
    const refreshToken = req.headers['x-refresh-token'];
    const entry = typeof refreshToken === 'string' ? state.tokens[refreshToken] : null;
    if (!entry || entry.type !== 'refresh') {
      return fail(res, 401, 'Invalid or expired token', 'UNAUTHORIZED');
    }
    const tokens = issueTokens(entry.userId);
    return ok(res, tokens);
  }

  if (path === '/api/tracks' && method === 'GET') {
    const user = authUser(req);
    if (!user) return fail(res, 401, 'Unauthorized', 'UNAUTHORIZED');
    const status = url.searchParams.get('status');
    let tracks = state.tracks.filter((t) => t.userId === user.id);
    if (status) tracks = tracks.filter((t) => t.status === status);
    tracks = tracks.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return ok(res, tracks.map(listItem));
  }

  if (path === '/api/tracks' && method === 'POST') {
    const user = authUser(req);
    if (!user) return fail(res, 401, 'Unauthorized', 'UNAUTHORIZED');
    const body = await readBody(req);
    if (!body?.id || !body?.kind || !body?.title) {
      return fail(res, 400, 'Invalid create track body');
    }
    const now = new Date().toISOString();
    /** @type {Track} */
    const track = {
      id: body.id,
      userId: user.id,
      kind: body.kind,
      status: 'DRAFT',
      storageState: 'LOCAL_ONLY',
      title: body.title,
      durationMs: Number(body.durationMs) || 0,
      mixUrl: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      layers: Array.isArray(body.layers) ? body.layers : [],
    };
    state.tracks = state.tracks.filter((t) => t.id !== track.id);
    state.tracks.push(track);
    saveState();
    return created(res, { id: track.id });
  }

  const trackMatch = path.match(/^\/api\/tracks\/([^/]+)$/);
  if (trackMatch) {
    const user = authUser(req);
    if (!user) return fail(res, 401, 'Unauthorized', 'UNAUTHORIZED');
    const trackId = decodeURIComponent(trackMatch[1]);
    const track = state.tracks.find((t) => t.id === trackId && t.userId === user.id);

    if (method === 'PATCH') {
      if (!track) return fail(res, 404, 'Track not found', 'NOT_FOUND');
      const body = await readBody(req);
      if (body?.title != null) track.title = String(body.title);
      if (body?.durationMs != null) track.durationMs = Number(body.durationMs) || 0;
      if (Array.isArray(body?.layers)) track.layers = body.layers;
      track.updatedAt = new Date().toISOString();
      saveState();
      return ok(res, { id: track.id });
    }

    if (method === 'DELETE') {
      if (!track) return fail(res, 404, 'Track not found', 'NOT_FOUND');
      state.tracks = state.tracks.filter((t) => t.id !== trackId);
      saveState();
      return ok(res, { id: trackId });
    }
  }

  const backupUrls = path.match(/^\/api\/tracks\/([^/]+)\/backup\/upload-urls$/);
  if (backupUrls && method === 'POST') {
    const user = authUser(req);
    if (!user) return fail(res, 401, 'Unauthorized', 'UNAUTHORIZED');
    return ok(res, {
      trackId: backupUrls[1],
      uploads: { mix: { path: 'mock', signedUrl: 'http://127.0.0.1/mock', token: 't' }, stems: [] },
    });
  }

  const backupComplete = path.match(/^\/api\/tracks\/([^/]+)\/backup\/complete$/);
  if (backupComplete && method === 'POST') {
    const user = authUser(req);
    if (!user) return fail(res, 401, 'Unauthorized', 'UNAUTHORIZED');
    const track = state.tracks.find((t) => t.id === backupComplete[1] && t.userId === user.id);
    if (track) {
      track.storageState = 'SYNCED';
      saveState();
    }
    return ok(res, { id: backupComplete[1], storageState: 'SYNCED' });
  }

  fail(res, 404, `No route ${method} ${path}`, 'NOT_FOUND');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[local-dev-api] listening on http://localhost:${PORT}`);
});
