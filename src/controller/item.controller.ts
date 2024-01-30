import { Request, Response } from "express";
import { FoundItem } from "../models/item.model";
import { User } from "../models/user.model";
import * as jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

FoundItem.belongsTo(User, { foreignKey: "uid", as: "owner" });
User.hasMany(FoundItem, { foreignKey: "uid", as: "items" });
class ItemController {
	async CreateFoundItem(req: Request, res :Response) : Promise<void> {
		try {
			const { 
				itemName, 
				itemDescription, 
				foundDate,
				foundTime,
				category, 
				latitude, 
				longitude, 
				locationDetail 
			} = req.body;

			if (!itemName || !itemDescription || !foundDate || !foundTime || !category || !latitude || !longitude || !locationDetail) {
				res.status(400).json({ 
					error: "Please provide all required fields" 
				});
			}

			const token = req.cookies.token;
			const decoded = jwt.decode(token);
			if (typeof decoded === "object" && decoded !== null && "name" in decoded) {
				req.uid = decoded.uid;
			}

			const id = nanoid(10);
			const foundItemId = "fou-" + id;

			const foundItem = await FoundItem.create({
				foundId: foundItemId,
				uid: req.uid,
				itemName: itemName,
				itemDescription: itemDescription,
				foundDate: foundDate,
				foundTime: foundTime,
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

	async GetFoundItems(req: Request, res :Response) : Promise<void> {
		try {
			const category = req.query.category as string;
			
			const filter: {
				include: {
					model: typeof User;
					as: string;
					attributes: string[];
				}[];
				attributes: string[];
				where?: {
					category?: string;
				};
			} = {
				include: [{
					model: User,
					as: "owner",
					attributes: ["name"]
				}],
				attributes: [
					"foundId",
					"uid",
					"itemName",
					"itemDescription",
					"foundDate",
					"foundTime",
					"category",
					"latitude",
					"longitude",
					"locationDetail",
				]
			};
	
			if (category) {
				filter.where = {
					category: category
				};
			}
	
			const foundItems = await FoundItem.findAll(filter);
	
			if (!foundItems) {
				res.status(404).json({
					message: "No items found"
				});
			}
			res.status(200).json({
				message: "Found items retrieved successfully",
				data: foundItems.map(item => ({
					...item.get(),
					owner : item.owner.name
				}))
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({
				message: "Internal server error"
			});
		}
	}

	async GetFoundItemById(req: Request, res :Response) : Promise<void> {
		try {
			const id = req.params.id;
			const foundItem = await FoundItem.findOne({
				where: {
					foundId: id
				},
				include: [{
					model: User,
					as: "owner",
					attributes: ["name"]
				}],
				attributes: [
					"foundId",
					"itemName",
					"itemDescription",
					"foundDate",
					"foundTime",
					"latitude",
					"longitude",
					"locationDetail"
				]
			});

			if (!foundItem) {
				res.status(404).json({
					message: "Item not found"
				});
			}
			res.status(200).json({
				message: "Item retrieved successfully",
				data: {
					...foundItem.get(),
					owner : foundItem.owner.name
				}
			});
		}
		catch (error) {
			console.error(error);
			res.status(500).json({
				message: "Internal server error"
			});
		}
	}
}

export default new ItemController();