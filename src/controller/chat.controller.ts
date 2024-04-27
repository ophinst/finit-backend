import { Request, Response } from "express";
import { Chat } from "../models/chat.model";
import { Op } from "sequelize";
import { nanoid } from "nanoid";

class ChatController {
	async CreateChat(req: Request, res: Response, receiverId): Promise<Response> {
		try {
			const chatId = "chat-" + nanoid(10); 
			const chatRoom = await Chat.create({
				chatId: chatId,
				members: [req.uid, receiverId]
			});

			return res.status(201).json({
				message: "Chat created successfully",
				data: chatRoom
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async GetChats(req: Request, res: Response): Promise<Response> {
		try {
			const chats = await Chat.findAll({
				where: {
					members: {
						[Op.contains] : [req.uid]
					}
				}
			});

			if (!chats) {
				return res.status(404).json({ message: "You have not started a chat"});
			}

			return res.status(200).json({
				message: "Chats retrieved successfully",
				data: chats
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async GetChatById(req: Request, res: Response): Promise<Response> {
		try {
			const receiverId = req.params.receiverId;
			const itemId = req.params.itemId;

			if (!receiverId || !itemId) {
				return res.status(400).json({ message: "Invalid parameter"});
			}

			const chat = await Chat.findOne({
				where: {
					members: [req.uid, receiverId],
					itemId: itemId
				}
			});

			if (!chat) {
				const chatId = "chat-" + nanoid(10); 
				const chatRoom = await Chat.create({
					chatId: chatId,
					members: [req.uid, receiverId],
					itemId: itemId
				});
	
				return res.status(201).json({
					message: "Chat created successfully",
					data: chatRoom
				});
			}

			return res.status(200).json({
				message: "Chat retrieved successfully",
				data: chat
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}
}

export default new ChatController();