import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export function Middleware (req: Request, res: Response, next: NextFunction) { 
    const token = req.headers["authorization"] ?? "";

    if(!token){ 
        return res.status(403).json({ 
            Msg: "No token provided or invalid token"
        })
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if(decoded){ 
        //@ts-ignore
        req.userId = decoded.userId;
        next();
    }else{ 
        res.status(404).json({ 
        Msg: "Unauthorized or user not found"
        })
    }
}