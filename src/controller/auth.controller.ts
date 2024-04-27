import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import Token from "../models/token.model";
import { Env } from "../config/env-loader";
import { nanoid } from "nanoid";

class AuthController {
	async Register(req: Request, res: Response): Promise<Response> { 
		try {
			const { name, email, password, confirmPassword } = req.body;
			if (!name || !email || !password || !confirmPassword) {
				res.status(400).json({
					error: "Please provide all required fields" 
				});
			}

			const existUser = await User.findOne({
				where: { email } 
			});
			if (existUser) {
				return res.status(400).json({
					message: `User with ${email} already exist` 
				});
			}
			if (!email.includes("@")) {
				return res.status(400).json({
					message: "Email format is invalid!"
				});
			}
			if (password.length < 8) {
				return res.status(400).json({
					message: "Password must be at least 8 characters!"
				});
			}
			if (password !== confirmPassword) {
				return res.status(403).json({
					message: "Password and confirm password don't match!"
				});
			}

			const salt = await bcrypt.genSalt();
			const hashedPassword = await bcrypt.hash(password, salt);

			const uid = "fin-" + nanoid(10);

			await User.create({
				uid: uid,
				name: name,
				email: email,
				password: hashedPassword,
			});

			const token = jwt.sign({ uid, name }, Env.JWT_SECRET, {
				expiresIn: "24h"
			});

			const refreshToken = jwt.sign({ uid, name }, Env.JWT_SECRET, {
				expiresIn: "7d"
			});

			const tokenId = "tkn-" + nanoid(10);

			await Token.create({
				tokenId: tokenId,
				uid: uid,
				token: refreshToken,
			});

			return res.status(201).json({
				message: "User registered successfully",
				data: {
					name,
					email,
					token
				}
			});
			
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error"
			});
		}
	}

	async Login(req: Request, res: Response): Promise<Response> {
		try {
			const { email, password } = req.body;
			if (!email || !password) {
				res.status(400).json({
					error: "Please provide all required fields" 
				});
			}

			const user = await User.findOne({ 
				where: { email },
			});
			
			if (!user) {
				return res.status(401).json({
					message: "User not registered"
				});
			}

			const uid = user.uid;
			const name = user.name;

			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(401).json({
					message: "Invalid password"
				});
			}

			const token = jwt.sign({ uid, name }, Env.JWT_SECRET, {
				expiresIn: "24h"
			});

			const refreshToken = jwt.sign({ uid, name }, Env.JWT_SECRET, {
				expiresIn: "7d"
			});

			const tokenId = "tkn-" + nanoid(10);

			const existingToken = await Token.findOne({
				where: {
					uid: uid
				}
			});

			if (!existingToken) {
				await Token.create({
					tokenId: tokenId,
					uid: uid,
					token: refreshToken,
				});
			} else {
				await Token.update({
					tokenId: tokenId,
					uid: uid,
					token: refreshToken,
				}, {
					where: {
						uid: uid
					}
				});
			}
			
			res.cookie("token", token, {
				httpOnly: true,
				sameSite: true,
				maxAge: 7 * 24 * 60 * 60 * 1000,
				secure: false
			});

			return res.status(200).json({
				success: true,
				message: "Login successful",
				data: {
					uid,
					name,
					email,
					token
				}
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error"
			});
		}
	}
	
	async Logout(req: Request, res: Response): Promise<Response> { 
		try {			
			const token = req.cookies.token;
			if (!token) {
				return res.status(204).json();
			}

			const decoded = jwt.decode(token);
			
			if (typeof decoded === "object" && decoded !== null && "uid" in decoded) {
				req.uid = decoded.uid;
			}
			
			const user = await User.findOne({
				where: {
					uid: req.uid
				}
			});
			
			if (!user) {
				return res.status(401).json({
					message: "User not found"
				});
			}
			
			await Token.destroy({
				where: {
					uid: req.uid
				}
			});
			
			res.clearCookie("token");
			
			return res.status(200).json({
				message: "Logout successful"
			});
			
		} catch (error) {
			console.log(error);
			return res.status(500).json({
				message: "Internal server error"
			});
		}
	}

}

export default new AuthController();