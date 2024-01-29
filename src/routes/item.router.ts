import * as express from "express";
import ItemController from "../controller/item.controller";
import AuthMiddleware from "../middleware/auth.middleware";

const ItemRouter = express.Router();

ItemRouter.post("/found", AuthMiddleware.VerifyToken, ItemController.CreateFoundItem);

ItemRouter.get("/found", ItemController.GetFoundItems);
ItemRouter.get("/found/:id", ItemController.GetFoundItemById);

export default ItemRouter;