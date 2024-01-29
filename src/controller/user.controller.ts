import { User } from "../models/user.model";
import { Request, Response } from "express";

class UserController {
	async GetUser(req: Request, res: Response): Promise<void> {
		try {
			const users = await User.findAll({
				attributes: ["name", "email"]
			});
			res.json(users);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "An error occurred while fetching users." });
		}
	}
}

export default new UserController();