import * as express from "express";
import AuthController from "../controller/auth.controller";

const AuthRouter = express.Router();

AuthRouter.post("/register", AuthController.Register);
AuthRouter.post("/login", AuthController.Login);
AuthRouter.get("/logout", AuthController.Logout);

export default AuthRouter;