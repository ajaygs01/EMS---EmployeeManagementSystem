import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getDb, IUser } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "ems_jwt_super_secret_key_2026";

export interface AuthRequest extends Request {
  user?: IUser;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      employeeId: user.employeeId
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access denied. No authentication token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const db = getDb();
    const user = db.users.find((u) => u.id === decoded.id && u.status === "Active");
    if (!user) {
      return res.status(401).json({ success: false, message: "User account invalid or inactive." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

export function authorizeRoles(...allowedRoles: Array<"Super Admin" | "HR Admin" | "Manager" | "Employee">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' does not have sufficient permissions for this operation.`
      });
    }
    next();
  };
}
