import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction} from "express";
import { Env } from "../config/env-loader";
import Token from "../models/token.model";

class TokenMiddleware {
	async RefreshToken (req: Request, res: Response, next:NextFunction, expiredToken): Promise<void> {
		const decoded = jwt.decode(expiredToken);
		if (typeof decoded === "object" && decoded !== null && "uid" in decoded) {
			req.uid = decoded.uid;
		}

		const oldTokenInstance = await Token.findOne({
			attributes: ["token"],
			where: {
				uid: req.uid,
			},
		});

		try {

			const oldToken = oldTokenInstance.get("token");
			
			jwt.verify(oldToken, Env.JWT_SECRET);

			const newToken = jwt.sign({ uid: req.uid, name: req.name, email: req.email }, Env.JWT_SECRET, {
				expiresIn: "7d"
			});

			await Token.update({
				token: newToken
			}, {
				where: {
					uid: req.uid
				}
			});

			res.cookie("token", oldToken, {
				httpOnly: true,
				sameSite: true,
				maxAge: 24 * 60 * 60 * 1000,
				secure: false
			});
			next();
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				res.status(401).json({
					success: false,
					message: "Your session expired, please relogin!"
				});
			
			} else if (!oldTokenInstance) {
				res.status(404).json({
					success: false,
					message: "Can't find token, please relogin!"
				});
			} 
			else{
				console.log(error);
				res.status(500).json({
					success: false,
					message: "Internal server error!"
				});
			}
		}
	}
}

export default new TokenMiddleware;