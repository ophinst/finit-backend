import * as express from "express";
import ItemController from "../controller/item.controller";

const itemRouter = express.Router();

itemRouter.post("/found", ItemController.CreateFoundItem);

export default itemRouter;