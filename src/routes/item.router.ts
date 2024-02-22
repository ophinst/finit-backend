import * as express from "express";
import ItemController from "../controller/item.controller";
import AuthMiddleware from "../middleware/auth.middleware";
import UploadMiddleware from "../middleware/upload.middleware";

const ItemRouter = express.Router();

ItemRouter.post("/found", AuthMiddleware.VerifyToken, ItemController.CreateFoundItem);
ItemRouter.post("/lost", AuthMiddleware.VerifyToken, UploadMiddleware.ProcessFiles, ItemController.CreateLostItem);

ItemRouter.get("/found", ItemController.GetFoundItems);
ItemRouter.get("/found/:id", ItemController.GetFoundItemById);
ItemRouter.get("/lost", ItemController.GetLostItems);
ItemRouter.get("/lost/:id", ItemController.GetLostItemById);

export default ItemRouter;