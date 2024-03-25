import { User } from "../models/user.model";
import { Request, Response } from "express";

class UserController {
	async GetUser(req: Request, res: Response): Promise<Response> {
		try {
			const users = await User.findAll({
				attributes: {
					exclude: ["password"]
				}
			});

			if (!users) {
				return res.status(404).json({ message: "User not found" });
			}

			return res.status(200).json({
				message: "User retrieved successfully",
				data: users
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async GetUserById(req: Request, res: Response): Promise<Response> {
		try {
			const uid = req.params.id;
			const user = await User.findOne({
				where: {
					uid: uid
				},
				attributes: {
					exclude: ["password"]
				}
			});

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			return res.status(200).json({
				message: "User retrieved successfully",
				data: user
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "User not found" });
		}
	}
}

export default new UserController();