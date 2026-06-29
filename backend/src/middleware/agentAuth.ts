import { Request, Response, NextFunction } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { findById } from '../config/users.js';

export function requireAgentToken(req: Request, _res: Response, next: NextFunction): void {
  const configuredToken = process.env['AGENT_API_TOKEN'];
  if (!configuredToken) {
    next(new UnauthorizedError('Agent-API-Token ist nicht konfiguriert'));
    return;
  }

  if (process.env['AGENT_AUTH_ALLOW_LOOPBACK'] === '1') {
    const remoteAddress = req.socket?.remoteAddress ?? '';
    const localhostAddresses = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    const hasAuthHeader = !!req.headers['authorization'] || !!req.headers['x-agent-token'];
    // Refuse bypass when a proxy forwarding header is present — a same-host
    // reverse proxy would appear as 127.0.0.1 on the socket.
    const hasForwardingHeader =
      !!req.headers['x-forwarded-for'] || !!req.headers['x-real-ip'] || !!req.headers['forwarded'];
    if (localhostAddresses.includes(remoteAddress) && !hasAuthHeader && !hasForwardingHeader) {
      next();
      return;
    }
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

// Accepts loopback bypass, agent token, OR admin session.
// Use on admin endpoints that skills also need to read locally.
export function requireAgentTokenOrAdminSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const configuredToken = process.env['AGENT_API_TOKEN'];

  // Loopback bypass — same rules as requireAgentToken
  if (process.env['AGENT_AUTH_ALLOW_LOOPBACK'] === '1') {
    const remoteAddress = req.socket?.remoteAddress ?? '';
    const localhostAddresses = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    const hasAuthHeader = !!req.headers['authorization'] || !!req.headers['x-agent-token'];
    const hasForwardingHeader =
      !!req.headers['x-forwarded-for'] || !!req.headers['x-real-ip'] || !!req.headers['forwarded'];
    if (localhostAddresses.includes(remoteAddress) && !hasAuthHeader && !hasForwardingHeader) {
      next();
      return;
    }
  }

  // Agent token
  if (configuredToken) {
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
    if (incomingToken) {
      const expectedHash = createHash('sha256').update(configuredToken).digest();
      const incomingHash = createHash('sha256').update(incomingToken).digest();
      if (timingSafeEqual(expectedHash, incomingHash)) {
        next();
        return;
      }
    }
  }

  // Admin session
  const userId = req.session?.userId;
  if (userId) {
    const user = findById(userId);
    if (user) {
      if (!user.roles.includes('ADMIN')) {
        next(new ForbiddenError('Zugriff verweigert'));
        return;
      }
      req.currentUser = user;
      next();
      return;
    }
  }

  next(new UnauthorizedError('Nicht authentifiziert'));
}
