import { Request, Response } from "express";
import { Message } from "../models/message.model";
import { nanoid } from "nanoid";
import { Chat } from "../models/chat.model";

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
			const payload = req.body.message;

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

			if (!payload) {
				return res.status(400).json({ message: "Message cannot be empty" });
			}

			const messageId = chatId + "-msg-" + nanoid(10);
			
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
}

export default new MessageController();