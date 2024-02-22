import { Request, Response } from "express";
import { FoundItem, LostItem } from "../models/item.model";
import { User } from "../models/user.model";
import * as jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { Storage } from "@google-cloud/storage";
import { Env } from "../config/env-loader";

FoundItem.belongsTo(User, { foreignKey: "uid", as: "foundOwner" });
User.hasMany(FoundItem, { foreignKey: "uid", as: "foundItems" });

LostItem.belongsTo(User, { foreignKey: "uid", as: "lostOwner" });
User.hasMany(LostItem, { foreignKey: "uid", as: "lostItems" });
class ItemController {
	async CreateFoundItem(req: Request, res :Response) : Promise<Response> {
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
				return res.status(400).json({ 
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
			return res.status(201).json({
				message: "Item created successfully",
				data: foundItem
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error"
			});
		}
	}

	async GetFoundItems(req: Request, res :Response) : Promise<Response> {
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
					as: "foundOwner",
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
				return res.status(404).json({
					message: "No items found"
				});
			}
			return res.status(200).json({
				message: "Found items retrieved successfully",
				data: foundItems.map(item => ({
					...item.get(),
					foundOwner : item.foundOwner.name
				}))
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error"
			});
		}
	}

	async GetFoundItemById(req: Request, res :Response) : Promise<Response> {
		try {
			const id = req.params.id;
			const foundItem = await FoundItem.findOne({
				where: {
					foundId: id
				},
				include: [{
					model: User,
					as: "foundOwner",
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
				return res.status(404).json({
					message: "Item not found"
				});
			}
			return res.status(200).json({
				message: "Item retrieved successfully",
				data: {
					...foundItem.get(),
					foundOwner : foundItem.foundOwner.name
				}
			});
		}
		catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error"
			});
		}
	}

	async CreateLostItem(req: Request, res: Response): Promise<Response> {
		const storage = new Storage({
			projectId: Env.GCP_PROJECT_ID,
			credentials: {
				client_email: Env.GCP_EMAIL,
				private_key: Env.GCP_KEY
			}
		});
		const bucket = storage.bucket(Env.GCP_BUCKET_NAME);
	
		try {
			const token = req.cookies.token;
			if (!token) {
				return res.status(401).json({ error: "Token not provided" });
			}
	
			const decoded = jwt.decode(token);
			if (typeof decoded === "object" && decoded !== null && "name" in decoded) {
				req.uid = decoded.uid;
			} else {
				return res.status(401).json({ error: "Invalid token" });
			}

			console.log("File attached to the request:", req.file); // Log the file object
	
			if (!req.file) {
				return res.status(400).json({ error: "Please provide an image" });
			}
	
			const folder = "lostImage";
			const filename = `${folder}/${req.uid}/${req.file.originalname}`;
			const blob = bucket.file(filename);
			const publicUrl = new URL(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
			const stream = blob.createWriteStream();
	
			// Pipe the file data to the stream
			stream.end(req.file.buffer);
	
			stream.on("error", (error: Error) => {
				console.error("Stream Error:", error);
				return res.status(500).json({ message: "Failed to process image. Try again later" });
			});
	
			stream.on("finish", async () => {
				try {
					await blob.makePublic();
					const {  
						itemName,  
						itemDescription,
						lostDate,
						lostTime,
						category,
						latitude,
						longitude,
					} = req.body;
	
					if (!itemName || !itemDescription || !lostDate || !lostTime || !category || !latitude || !longitude) {
						return res.status(400).json({ error: "Please provide all required fields" });
					}
	
					const id = nanoid(10);
					const lostItemId = "los-" + id;
	
					const lostItem = await LostItem.create({
						lostId: lostItemId,
						uid: req.uid,
						itemName: itemName,
						itemImage: publicUrl.toString(),
						itemDescription: itemDescription,
						lostDate: lostDate,
						lostTime: lostTime,
						category: category,
						latitude: latitude,
						longitude: longitude,
					});
					return res.status(201).json({
						message: "Item created successfully",
						data: lostItem
					});
				} catch (error) {
					console.error(error);
					return res.status(500).json({ message: "Internal server error" });
				}
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async GetLostItems(req: Request, res :Response) : Promise<Response> {
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
					as: "lostOwner",
					attributes: ["name"]
				}],
				attributes: [
					"lostId",
					"uid",
					"itemName",
					"itemImage",
					"category",
					"latitude",
					"longitude",
				]
			};

			if (category) {
				filter.where = {
					category: category
				};
			}

			const lostItems = await LostItem.findAll(filter);
			if (!lostItems) {
				return res.status(404).json({
					message: "No items found"
				});
			}
			return res.status(200).json({
				message: "Lost items retrieved successfully",
				data: lostItems.map(item => ({
					...item.get(),
					lostOwner : item.lostOwner.name
				}))
			});
		}
		catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async GetLostItemById(req: Request, res :Response) : Promise<Response> {
		try {
			const lostItem = await LostItem.findOne({
				where: {
					lostId: req.params.id
				},
				include: [{
					model: User,
					as: "lostOwner",
					attributes: ["name"]
				}],
			});

			if (!lostItem) {
				return res.status(404).json({
					message: "Item not found"
				});
			}
			
			return res.status(200).json({
				message: "Item retrieved successfully",
				data: {
					...lostItem.get(),
					lostOwner : lostItem.lostOwner.name
				}
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}
}

export default new ItemController();