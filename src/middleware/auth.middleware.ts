import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Env } from "../config/env-loader";
import { User } from "../models/user.model";
import tokenMiddleware from "./token.middleware";

class AuthMiddleware {
	/** Verify Token */
	async VerifyToken (req: Request, res: Response, next: NextFunction): Promise<Response> {
		const header = req.headers["authorization"];
		const token = header && header.split(" ")[1];
	
		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Missing Token!"
			});
		}
	
		try {
			jwt.verify(token, Env.JWT_SECRET as jwt.Secret);
			const decoded = jwt.decode(token);
			if (typeof decoded === "object" && decoded !== null && "name" in decoded) {
				req.uid = decoded.uid;
			} else {
				return res.status(401).json({ error: "Invalid token" });
			}
			next();
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				tokenMiddleware.RefreshToken(req, res, next, token);
			} else if (error instanceof jwt.JsonWebTokenError) {
				return res.status(403).json({
					success: false,
					message: "Invalid token!"
				});
			} else {
				return res.status(500).json({
					success: false,
					message: "Server error!"
				});
			}
		}
	}

	/** Verify User */
	async verifyUser (req: Request, res: Response, next: NextFunction): Promise<Response> {
		try {
			const email = req.method === "GET" ? req.query.email : req.body.email;
			const user = await User.findOne({
				where: {
					email
				}
			});
			if (!user) {
				return res.status(404).json({
					success: false,
					message: "Can't find Email!"
				});
			}
			next();
		} catch (err) {
			console.log(err);
			return res.status(404).json({
				success: false,
				message: err
			});
		}
	}
}

export default new AuthMiddleware;

