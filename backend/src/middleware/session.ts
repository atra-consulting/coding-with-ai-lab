import session from 'express-session';
import { LibsqlSessionStore } from './libsqlSessionStore.js';

const SESSION_SECRET = process.env['SESSION_SECRET'] ?? 'crm-dev-secret-key';

if (process.env['NODE_ENV'] === 'production' && !process.env['SESSION_SECRET']) {
  // Cookies signed with the public dev default are forgeable.
  console.warn(
    '[session] SESSION_SECRET is not set — falling back to the insecure dev default. Set it in the deployment environment.',
  );
}

export const sessionMiddleware = session({
  secret: SESSION_SECRET,
  name: 'JSESSIONID',
  resave: false,
  saveUninitialized: false,
  store: new LibsqlSessionStore(),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});
