import { User } from "../models/user.model";
import { Request, Response } from "express";
import { Storage } from "@google-cloud/storage";
import { Env } from "../config/env-loader";

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
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	async UpdateUserData(req: Request, res: Response): Promise<Response> {
		try {
			const uid = req.uid;
			const user = await User.findOne({ where: { uid: uid} });
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			const { name, phoneNumber } = req.body;
			if (!name && !phoneNumber) {
				return res.status(400).json({ message: "You have not edited any data" });
			}

			await user.update({
				name: name,
				phoneNumber: phoneNumber
			});

			const updatedUser = await User.findOne({ 
				where: { uid: uid},
				attributes: {
					exclude: ["password"]
				}
			});

			return res.status(200).json({
				message: "User data updated successfully",
				data: updatedUser
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async UpdateUserProfilePicture(req: Request, res: Response): Promise<Response> {
		const storage = new Storage({
			projectId: Env.GCP_PROJECT_ID,
			credentials: JSON.parse(Env.GCP_KEY)
		});
		const bucket = storage.bucket(Env.GCP_BUCKET_NAME);

		console.log("File attached to the request:", req.file); // Log the file object
		try {
			const uid = req.uid;
			const user = await User.findOne({ where: { uid: uid} });
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			const folder = "userProfile";
			const filename = `${folder}/${req.uid}/${req.file.originalname}`;
			const blob = bucket.file(filename);
			const publicUrl = new URL(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
			const stream = blob.createWriteStream();

			// Pipe the file data to the stream
			stream.end(req.file.buffer);

			stream.on("error", (error: Error) => {
				console.error("Stream Error:", error);
				return res.status(500).json({ message: "Failed to process image. Try again later" });
			});

			stream.on("finish", async () => {
				await blob.makePublic();
				await user.update({ image: publicUrl.toString()});

				const updatedUser = await User.findOne({ 
					where: { uid: uid},
					attributes: {
						exclude: ["password"]
					}
				});
				
				return res.status(200).json({
					message: "User profile picture updated successfully",
					data: updatedUser
				});
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async UploadUserIdCard(req: Request, res: Response): Promise<Response> {
		const storage = new Storage({
			projectId: Env.GCP_PROJECT_ID,
			credentials: JSON.parse(Env.GCP_KEY)
		});
		const bucket = storage.bucket(Env.GCP_BUCKET_NAME);

		console.log("File attached to the request:", req.file); // Log the file object
		try {
			const uid = req.uid;
			const user = await User.findOne({ where: { uid: uid} });
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			const folder = "userIdCard";
			const filename = `${folder}/${req.uid}/${req.file.originalname}`;
			const blob = bucket.file(filename);
			const publicUrl = new URL(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
			const stream = blob.createWriteStream();

			// Pipe the file data to the stream
			stream.end(req.file.buffer);

			stream.on("error", (error: Error) => {
				console.error("Stream Error:", error);
				return res.status(500).json({ message: "Failed to process image. Try again later" });
			});

			stream.on("finish", async () => {
				await blob.makePublic();
				await user.update({ image: publicUrl.toString()});

				const updatedUser = await User.findOne({ 
					where: { uid: uid},
					attributes: {
						exclude: ["password"]
					}
				});
				
				return res.status(200).json({
					message: "User ID card uploaded successfully",
					data: updatedUser
				});
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}
}

export default new UserController();