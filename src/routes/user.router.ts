import * as express from "express";
import UserController from "../controller/user.controller";
import AuthMiddleware from "../middleware/auth.middleware";

const userRouter = express.Router();

userRouter.get("/data", AuthMiddleware.VerifyToken ,UserController.GetUser);

export default userRouter;