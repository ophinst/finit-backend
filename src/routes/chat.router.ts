import * as express from "express";
import ChatController from "../controller/chat.controller";
import AuthMiddleware from "../middleware/auth.middleware";

const ChatRouter = express.Router();

ChatRouter.get("/chat", AuthMiddleware.VerifyToken, ChatController.GetChats);
ChatRouter.get("/chat/:receiverId", AuthMiddleware.VerifyToken, ChatController.GetChatById);

export default ChatRouter;