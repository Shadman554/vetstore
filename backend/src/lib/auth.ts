import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET;
  if (!auth?.startsWith("Bearer ") || !jwtSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    jwt.verify(auth.slice(7), jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export interface VendorTokenPayload {
  role: "vendor";
  vendorId: string;
}

export interface CustomerTokenPayload {
  role: "customer";
  customerId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      vendorId?: string;
      customerId?: string;
    }
  }
}

function verifyToken<T extends { role: string }>(req: Request, role: T["role"]): T | null {
  const auth = req.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET;
  if (!auth?.startsWith("Bearer ") || !jwtSecret) return null;
  try {
    const payload = jwt.verify(auth.slice(7), jwtSecret) as T;
    if (payload.role !== role) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireVendor(req: Request, res: Response, next: NextFunction) {
  const payload = verifyToken<VendorTokenPayload>(req, "vendor");
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.vendorId = payload.vendorId;
  next();
}

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  const payload = verifyToken<CustomerTokenPayload>(req, "customer");
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.customerId = payload.customerId;
  next();
}

export function optionalCustomer(req: Request, _res: Response, next: NextFunction) {
  const payload = verifyToken<CustomerTokenPayload>(req, "customer");
  if (payload) req.customerId = payload.customerId;
  next();
}

export function signVendorToken(vendorId: string): string {
  const jwtSecret = process.env.JWT_SECRET as string;
  return jwt.sign({ role: "vendor", vendorId } satisfies VendorTokenPayload, jwtSecret, {
    expiresIn: "30d",
  });
}

export function signCustomerToken(customerId: string): string {
  const jwtSecret = process.env.JWT_SECRET as string;
  return jwt.sign({ role: "customer", customerId } satisfies CustomerTokenPayload, jwtSecret, {
    expiresIn: "30d",
  });
}
