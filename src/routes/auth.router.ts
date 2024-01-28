import * as express from "express";
import AuthController from "../controller/auth.controller";

const authRouter = express.Router();

authRouter.post("/register", AuthController.Register);
authRouter.post("/login", AuthController.Login);
authRouter.get("/logout", AuthController.Logout);

export default authRouter;