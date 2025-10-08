import { Request, Response, NextFunction } from 'express';

export function basicAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Internal API"');
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const base64 = authHeader.split(' ')[1];
  const decoded = Buffer.from(base64, 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');

  if (user === process.env.APP_BASIC_USER && pass === process.env.APP_BASIC_PASSWORD) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Internal API"');
  return res.status(401).json({ error: 'Invalid credentials' });
}
