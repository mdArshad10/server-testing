import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

// Sign JWT token
export const signToken = (id: string, role: string): string => {
  //@ts-ignore
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
};