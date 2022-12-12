import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { parseJwt } from '../utils/token';

export const validateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header('Authorization')?.slice(7); // cut Beare

  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, process.env.JWT_KEY || '');
    next();
  } catch (err) {
    return res.status(400).send('Invalid Token');
  }
};
