import * as express from "express";
import UserController from "../controller/user.controller";

const UserRouter = express.Router();

UserRouter.get("/user", UserController.GetUser);
UserRouter.get("/user/:id", UserController.GetUserById);

export default UserRouter;