import { User } from "../models/user.model";
import { Request, Response } from "express";

class UserController {
	async GetUser(req: Request, res: Response): Promise<Response> {
		try {
			const users = await User.findAll({
				attributes: ["name", "email"]
			});
			return res.json(users);
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "An error occurred while fetching users." });
		}
	}
}

export default new UserController();