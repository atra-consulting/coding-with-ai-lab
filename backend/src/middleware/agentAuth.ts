import { Request, Response, NextFunction } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import { UnauthorizedError } from '../utils/errors.js';

export function requireAgentToken(req: Request, _res: Response, next: NextFunction): void {
  const configuredToken = process.env['AGENT_API_TOKEN'];
  if (!configuredToken) {
    next(new UnauthorizedError('Agent-API-Token ist nicht konfiguriert'));
    return;
  }

  let incomingToken: string | undefined;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    incomingToken = authHeader.slice(7);
  } else {
    const xAgentToken = req.headers['x-agent-token'];
    if (typeof xAgentToken === 'string') {
      incomingToken = xAgentToken;
    }
  }

  if (!incomingToken) {
    next(new UnauthorizedError('Agent-Token fehlt'));
    return;
  }

  const expectedHash = createHash('sha256').update(configuredToken).digest();
  const incomingHash = createHash('sha256').update(incomingToken).digest();

  if (!timingSafeEqual(expectedHash, incomingHash)) {
    next(new UnauthorizedError('Ungültiger Agent-Token'));
    return;
  }

  next();
}
