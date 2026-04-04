import { vi, describe, test, expect } from 'vitest';
import request from 'supertest';

// ── Mock connect-mongo BEFORE app.js is imported ──────────────────────────────
// vi.mock() is automatically hoisted by Vitest above all imports, so the mock
// is always in place before the real modules load.
vi.mock('connect-mongo', () => ({
    default: {
        create: () => ({
            // Minimal express-session compatible in-memory store
            get: vi.fn((_sid, cb) => cb(null, null)),
            set: vi.fn((_sid, _session, cb) => cb(null)),
            destroy: vi.fn((_sid, cb) => cb(null)),
            on: vi.fn(),
        }),
    },
}));

import app from '../app.js';

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('API Health Checks', () => {
    test('GET /api/auth/authUser → 401 when not authenticated', async () => {
        const res = await request(app).get('/api/auth/authUser');
        expect(res.status).toBe(401);
    });

    test('GET /unknown-route → 404 from notfound middleware', async () => {
        const res = await request(app).get('/this-route-does-not-exist-xyz');
        expect(res.status).toBe(404);
    });

    test('POST /api/auth/logout without session → server does not crash (< 500)', async () => {
        const res = await request(app).post('/api/auth/logout');
        // No active session — server should respond gracefully, not 500
        expect(res.status).toBeLessThan(500);
    });
});
