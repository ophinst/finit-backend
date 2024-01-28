import { Request, Response } from "express";
import { FoundItem } from "../models/item.model";

class ItemController {
	async CreateFoundItem(req: Request, res :Response) : Promise<void> {
		try {
			const { 
				itemName, 
				itemDescription, 
				foundDate, 
				category, 
				latitude, 
				longitude, 
				locationDetail 
			} = req.body;
			if (!itemName ||!itemDescription ||!foundDate ||!category ||!latitude ||!longitude) {
				res.status(400).json({ 
					error: "Please provide all required fields" 
				});
			}
			const foundItem = await FoundItem.create({
				// uid: req.cookies.id,
				itemName: itemName,
				itemDescription: itemDescription,
				foundDate: foundDate,
				category: category,
				latitude: latitude,
				longitude: longitude,
				locationDetail: locationDetail,
			});
			res.status(201).json({
				message: "Item created successfully",
				data: foundItem
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({
				message: "Internal server error"
			});
		}
	}
}

export default new ItemController();