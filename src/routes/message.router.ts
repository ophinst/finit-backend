import * as express from "express";
import MessageController from "../controller/message.controller";
import AuthMiddleware from "../middleware/auth.middleware";

const MessageRouter = express.Router();

MessageRouter.get("/message/:chatId", MessageController.GetMessages);
MessageRouter.post("/message/:chatId", AuthMiddleware.VerifyToken, MessageController.SendMessage);

export default MessageRouter;