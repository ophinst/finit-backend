import * as express from "express";
import RewardController from "../controller/reward.controller";
import AuthMiddleware from "../middleware/auth.middleware";

const RewardRouter = express.Router();

RewardRouter.get("/reward", RewardController.GetRewards);

RewardRouter.post("/reward", RewardController.CreateRewards);

RewardRouter.patch("/reward/:rewardId", AuthMiddleware.VerifyToken, RewardController.PurchaseRewards);

export default RewardRouter;