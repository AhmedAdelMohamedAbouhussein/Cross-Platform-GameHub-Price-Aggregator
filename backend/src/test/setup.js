/**
 * Jest global setup — runs before every test file.
 *
 * We mock connect-mongo so that MongoStore.create() never tries to open a
 * real MongoDB connection when app.js is imported during tests.
 */

// Mock connect-mongo before anything imports it
jest.unstable_mockModule('connect-mongo', () => ({
    default: {
        create: () => ({
            // Minimal session-store interface required by express-session
            get: (_sid, cb) => cb(null, null),
            set: (_sid, _session, cb) => cb(null),
            destroy: (_sid, cb) => cb(null),
            on: () => { },
        }),
    },
}));
