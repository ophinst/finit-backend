import { Request, Response } from "express";
import { Message } from "../models/message.model";
import { nanoid } from "nanoid";
import { Chat } from "../models/chat.model";
import { Storage } from "@google-cloud/storage";
import { Env } from "../config/env-loader";

class MessageController {
	async GetMessages(req: Request, res: Response): Promise<Response> {
		try {
			const messages = await Message.findAll({
				where: {
					chatId: req.params.chatId
				}
			});

			if (!messages) {
				return res.status(400).json({ message: "Chatroom does not exist" });
			}

			if (!messages) {
				return res.status(404).json({ message: "No messages found" });
			}

			return res.status(200).json({
				message: "Messages retrieved successfully",
				data: messages
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async SendMessage(req: Request, res: Response): Promise<Response> {
		try {
			const chatId = req.params.chatId;
			const payload = req.body.payload;
			const image = req.file;

			if (!chatId) {
				return res.status(400).json({ message: "Invalid parameter"});
			}

			const chatRoom = await Chat.findOne({
				where: {
					chatId: chatId
				}
			});

			if (!chatRoom) {
				return res.status(400).json({ message: "Chatroom does not exist" });
			}

			
			const messageId = chatId + "-msg-" + nanoid(10);
			
			if (image) {
				await MessageController.SendMessageWithImage(req, res, chatId, messageId, payload);
				return;
			}
			
			if (!payload) {
				return res.status(400).json({ message: "Message cannot be empty" });
			}

			const message = await Message.create({
				messageId: messageId,
				message: payload,
				chatId: chatId,
				senderId: req.uid
				
			});

			if (!message) {
				return res.status(400).json({ message: "Message not sent" });
			}

			return res.status(201).json({
				message: "Message sent successfully",
				data: message
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	static async SendMessageWithImage(req: Request, res: Response, chatId: string, messageId: string, payload?: string) {
		const storage = new Storage({
			projectId: Env.GCP_PROJECT_ID,
			credentials: JSON.parse(Env.GCP_KEY)
		});
		const bucket = storage.bucket(Env.GCP_BUCKET_NAME);
		
		console.log("File attached to the request:", req.file); // Log the file object
		
		if (!req.file) {
			return res.status(400).json({ error: "Please provide an image" });
		}
		
		const folder = "messageImage";
		const filename = `${folder}/${req.uid}/${messageId}/${req.file.originalname}`;
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
			try {
				await blob.makePublic();

				const message = await Message.create({
					messageId: messageId,
					message: payload,
					chatId: chatId,
					senderId: req.uid,
					imageUrl: publicUrl.toString(),
				});

				return res.status(201).json({
					message: "Message and image sent successfully",
					data: message
				});
			} catch (error) {
				console.error(error);
				return res.status(500).json({ message: "Internal server error" });
			}
		});
	}
}

export default new MessageController();