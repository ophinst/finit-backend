import * as express from "express";
import UserController from "../controller/user.controller";
import AuthMiddleware from "../middleware/auth.middleware";
import UploadMiddleware from "../middleware/upload.middleware";

const UserRouter = express.Router();

UserRouter.get("/user", UserController.GetUser);
UserRouter.get("/user/:id", UserController.GetUserById);

UserRouter.patch("/user", AuthMiddleware.VerifyToken, UserController.UpdateUserData);
UserRouter.patch("/user/profile", AuthMiddleware.VerifyToken, UploadMiddleware.ProcessFiles, UserController.UpdateUserProfilePicture);

export default UserRouter;