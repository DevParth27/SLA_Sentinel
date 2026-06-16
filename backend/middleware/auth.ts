import { Request, Response, NextFunction } from "express";

// TODO: Replace with real JWT/session auth before production
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  next();
}
