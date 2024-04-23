import * as express from "express";
import MessageController from "../controller/message.controller";
import AuthMiddleware from "../middleware/auth.middleware";
import UploadMiddleware from "../middleware/upload.middleware";

const MessageRouter = express.Router();

MessageRouter.get("/message/:chatId", MessageController.GetMessages);
MessageRouter.post("/message/:chatId", AuthMiddleware.VerifyToken, UploadMiddleware.ProcessFiles, MessageController.SendMessage);

export default MessageRouter;