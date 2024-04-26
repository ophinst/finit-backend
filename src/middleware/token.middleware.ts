import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction} from "express";
import { Env } from "../config/env-loader";
import Token from "../models/token.model";
import { nanoid } from "nanoid";

class TokenMiddleware {
	async RefreshToken (req: Request, res: Response, next:NextFunction, expiredToken): Promise<Response> {
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

			const id = nanoid(10);
			const tokenId = "tkn-" + id;

			await Token.update({
				tokenId: tokenId,
				token: newToken
			}, {
				where: {
					uid: req.uid
				}
			});

			res.cookie("token", oldToken, {
				httpOnly: true,
				sameSite: true,
				maxAge: 7 * 24 * 60 * 60 * 1000,
				secure: false
			});
			next();
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				return res.status(401).json({
					message: "Your session expired, please relogin!"
				});
			
			} else if (!oldTokenInstance) {
				return res.status(404).json({
					message: "Can't find token, please relogin!"
				});
			} 
			else{
				console.log(error);
				return res.status(500).json({
					message: "Internal server error!"
				});
			}
		}
	}
}

export default new TokenMiddleware;