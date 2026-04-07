import session from 'express-session';
import MemoryStore from 'memorystore';

const MemoryStoreSession = MemoryStore(session);

const SESSION_SECRET = process.env['SESSION_SECRET'] ?? 'crm-dev-secret-key';

export const sessionMiddleware = session({
  secret: SESSION_SECRET,
  name: 'JSESSIONID',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});
