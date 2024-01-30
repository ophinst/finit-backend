import * as express from "express";
import UserController from "../controller/user.controller";
import AuthMiddleware from "../middleware/auth.middleware";

const UserRouter = express.Router();

UserRouter.get("/data", AuthMiddleware.VerifyToken ,UserController.GetUser);

export default UserRouter;