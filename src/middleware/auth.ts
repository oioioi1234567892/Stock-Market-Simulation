import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      req.user = {
        uid: token.length > 30 ? token.slice(0, 28) : token,
        email: 'trader@local.app',
        name: '操盤手會員',
      };
    }
  }
  next();
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      uid: 'guest_trader',
      email: 'guest@local.app',
      name: '訪客操盤手',
    };
    return next();
  }
  const token = authHeader.split('Bearer ')[1]?.trim();
  req.user = {
    uid: token || 'guest_trader',
    email: 'trader@local.app',
    name: '操盤手會員',
  };
  next();
};
