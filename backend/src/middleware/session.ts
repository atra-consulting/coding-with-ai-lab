import session from 'express-session';
import { LibsqlSessionStore } from './libsqlSessionStore.js';

const SESSION_SECRET = process.env['SESSION_SECRET'] ?? 'crm-dev-secret-key';

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
