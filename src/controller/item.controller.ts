import { Request, Response } from "express";
import { FoundItem, LostItem } from "../models/item.model";
import { User } from "../models/user.model";
import { nanoid } from "nanoid";
import { Storage } from "@google-cloud/storage";
import { Env } from "../config/env-loader";
import { Op } from "sequelize";
import transactionMiddleware from "../middleware/transaction.middleware";
import { getDistance } from "geolib";

FoundItem.belongsTo(User, { foreignKey: "uid", as: "foundOwner" });
User.hasMany(FoundItem, { foreignKey: "uid", as: "foundItems" });

LostItem.belongsTo(User, { foreignKey: "uid", as: "lostOwner" });
User.hasMany(LostItem, { foreignKey: "uid", as: "lostItems" });

// Type guards to check if an item is a FoundItem or LostItem
function isFoundItem(item: FoundItem | LostItem): item is FoundItem {
	return (item as FoundItem).foundOwner !== undefined;
}

function isLostItem(item: FoundItem | LostItem): item is LostItem {
	return (item as LostItem).lostOwner !== undefined;
}

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

			const foundItemId = "fou-" + nanoid(10);

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
			const page = parseInt(req.query.page as string);
			const search = req.query.search;

			const filter: {
				include: {
					model: typeof User;
					as: string;
					attributes: string[];
				}[];
				where?: {
					category?: string;
					itemName?;
					completionStatus?: boolean;
				};
			} = {
				include: [{
					model: User,
					as: "foundOwner",
					attributes: ["name"]
				}]
			};

			const whereClause = {
				category,
				itemName: {
					[Op.iLike]: `%${search}%`
				},
				completionStatus: false
			};

			if (category) {
				whereClause.category = category;
			} else {
				delete whereClause.category;
			}

			if (search) {
				whereClause.itemName;
			} else {
				delete whereClause.itemName;
			}

			filter.where = whereClause;

			let offset = 0;
			if (page) {
				offset = (page - 1) * 10;
			}

			// Combine filter and pagination options into a single options object
			const options = {
				...filter,
				offset: offset,
				limit: 10 // limit to 10 items per page
			};

			const foundItems = await FoundItem.findAll(options);

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
			const foundItem = await FoundItem.findOne({
				where: {
					foundId: req.params.foundId
				},
				include: [{
					model: User,
					as: "foundOwner",
					attributes: ["name"]
				}]
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
			credentials: JSON.parse(Env.GCP_KEY)
		});
		const bucket = storage.bucket(Env.GCP_BUCKET_NAME);

		try {
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
						locationDetail,
					} = req.body;

					if (!itemName || !itemDescription || !lostDate || !lostTime || !category || !latitude || !longitude) {
						return res.status(400).json({ error: "Please provide all required fields" });
					}

					const lostItemId = "los-" + nanoid(10);

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
						locationDetail: locationDetail,
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
			const page = parseInt(req.query.page as string);
			const search = req.query.search as string;

			const filter: {
				include: {
					model: typeof User;
					as: string;
					attributes: string[];
				}[];
				where?: {
					category?: string;
					itemName?;
					completionStatus?: boolean;
				};
			} = {
				include: [{
					model: User,
					as: "lostOwner",
					attributes: ["name"]
				}],
			};

			const whereClause = {
				category,
				itemName: {
					[Op.iLike]: `%${search}%`
				},
				completionStatus: false
			};

			if (category) {
				whereClause.category = category;
			} else {
				delete whereClause.category;
			}

			if (search) {
				whereClause.itemName;
			} else {
				delete whereClause.itemName;
			}

			filter.where = whereClause;

			let offset = 0;

			if (page) {
				offset = (page - 1) * 5;
			}

			// Combine filter and pagination options into a single options object
			const options = {
				...filter,
				offset: offset,
				limit: 10 // limit to 10 items per page
			};

			const lostItems = await LostItem.findAll(options);

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
					lostId: req.params.lostId
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

	async FinishFoundTransaction(req: Request, res: Response): Promise<Response> {
		try {
			const uid = req.uid;
			const foundId = req.params.foundId;
			const foundItem = await FoundItem.findOne({ where: { foundId: foundId } });

			if (!foundItem) {
				return res.status(404).json({ message: "Item not found" });
			}

			if (foundItem.completionStatus) {
				return res.status(400).json({ message: "This transaction is already finished" });
			}

			const updateStatus = foundItem.uid === uid ? "foundUserStatus" : "lostUserStatus";
			const statusMessage = updateStatus === "foundUserStatus" ? "Found user status in transaction updated" : "Lost user status in transaction updated";
			await FoundItem.update({ [updateStatus]: true }, { where: { foundId: foundId } });

			const transactionStatus = await transactionMiddleware.CheckFoundTransactionStatus(foundId);

			if (transactionStatus && transactionStatus.foundUserData && transactionStatus.itemData) {
				return res.status(200).json({
					message: "Transaction finished successfully and points sent to found user",
					data: {
						foundUserData: transactionStatus.foundUserData,
						itemData: transactionStatus.itemData
					}
				});
			}

			const updatedFoundItem = await FoundItem.findOne({ where: { foundId: foundId }});
			return res.status(200).json({
				message: statusMessage,
				data: updatedFoundItem
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async FinishLostTransaction(req: Request, res: Response): Promise<Response> {
		try {
			const uid = req.uid;
			const lostId = req.params.lostId;
			const lostItem = await LostItem.findOne({ where: { lostId: lostId } });

			if (!lostItem) {
				return res.status(404).json({ message: "Item not found" });
			}

			if (lostItem.completionStatus) {
				return res.status(400).json({ message: "This transaction is already finished" });
			}

			if (lostItem.uid != uid) {
				await lostItem.update({
					foundUserId: uid,
				}, {
					where: {
						lostId: lostId
					}
				});
			}

			const updateStatus = lostItem.uid === uid ? "lostUserStatus" : "foundUserStatus";
			const statusMessage = updateStatus === "lostUserStatus" ? "Lost user status in transaction updated" : "Found user status in transaction updated";
			await LostItem.update({ [updateStatus]: true }, { where: { lostId: lostId } });

			const transactionStatus = await transactionMiddleware.CheckLostTransactionStatus(lostId);

			if (transactionStatus && transactionStatus.foundUserData && transactionStatus.itemData) {
				return res.status(200).json({
					message: "Transaction finished successfully and points sent to found user",
					data: {
						foundUserData: transactionStatus.foundUserData,
						itemData: transactionStatus.itemData
					}
				});
			}

			const updatedLostItem = await LostItem.findOne({ where: { lostId: lostId }});
			return res.status(200).json({
				message: statusMessage,
				data: updatedLostItem
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async GetNearbyItem(req: Request, res: Response): Promise<Response> {
		const userLat = parseFloat(req.params.userLat);
		const userLong = parseFloat(req.params.userLong);
	
		try {
			if (!userLat || !userLong) {
				return res.status(400).json({ message: "Invalid parameter"});
			}
	
			// Define a default radius in meters
			const defaultRadius = 3000;
	
			// Query items within the specified radius
			const foundItems = await FoundItem.findAll({
				where: {
					latitude: {
						[Op.between]: [userLat - defaultRadius, userLat + defaultRadius]
					},
					longitude: {
						[Op.between]: [userLong - defaultRadius, userLong + defaultRadius]
					}
				},
				include: [{
					model: User,
					as: "foundOwner",
					attributes: ["name"]
				}]
			});
	
			const lostItems = await LostItem.findAll({
				where: {
					latitude: {
						[Op.between]: [userLat - defaultRadius, userLat + defaultRadius]
					},
					longitude: {
						[Op.between]: [userLong - defaultRadius, userLong + defaultRadius]
					}
				},
				include: [{
					model: User,
					as: "lostOwner",
					attributes: ["name"]
				}]
			});
	
			// Filter items based on the actual distance
			const nearbyFoundItems = foundItems.filter(item => getDistance({ latitude: userLat, longitude: userLong }, { latitude: item.latitude, longitude: item.longitude }) <= defaultRadius);
			const nearbyLostItems = lostItems.filter(item => getDistance({ latitude: userLat, longitude: userLong }, { latitude: item.latitude, longitude: item.longitude }) <= defaultRadius);
			
			if (!foundItems.length && !lostItems.length) {
				return res.status(404).json({ message: "No items found" });
			}
	
			// Combine foundItems and lostItems into a single array
			const combinedItems = [...nearbyFoundItems, ...nearbyLostItems];

			const mappedItems = combinedItems.map(item => {
				if (isFoundItem(item)) {
					return {
						...item.get(),
						type: "Found Item",
						foundOwner: item.foundOwner.name
					};
				} else if (isLostItem(item)) {
					return {
						...item.get(),
						type: "Lost Item",
						lostOwner: item.lostOwner.name
					};
				}
			});
	
			return res.status(200).json({
				message: "Nearby items retrieved successfully",
				data: mappedItems
			});
	
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async GetRecentActivity(req: Request, res: Response): Promise<Response> {
		try {
			const category = req.query.category as string;
			const search = req.query.search as string;
			const uid = req.uid as string;

			const filter: {
				where?: {
					category?: string;
					itemName?;
					uid?: string;
				}
			} = {
				where: {
					uid: uid
				}
			};
			if (category) {
				filter.where.category = category;
			} else {
				delete filter.where.category;
			}

			if (search) {
				filter.where.itemName = {
					[Op.iLike]: `%${search}%`
				};
			} else {
				delete filter.where.itemName;
			}

			const userActivity = {
				... filter,
				uid: uid
			};

			const recentFoundItem = await FoundItem.findAll(userActivity);
			const recentLostItem = await LostItem.findAll(userActivity);

			if (!recentFoundItem && !recentLostItem) {
				return res.status(404).json({ message: "No items found" });
			}

			// Combine foundItems and lostItems into a single array and sort them in descending order
			const userRecentActivity = [...recentFoundItem, ...recentLostItem].sort((a, b) => {
				const dateA = new Date(a.createdAt);
				const dateB = new Date(b.createdAt);

				return dateB.getTime() - dateA.getTime();
			});

			return res.status(200).json({
				message: "Recent activity retrieved successfully",
				data: userRecentActivity
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error"
			});
		}
	}

	async DeleteItemReport(req: Request, res: Response): Promise<Response> {
		try {
			const itemId = req.params.itemId;
			const uid = req.uid;

			if (!itemId) {
				return res.status(400).json({ message: "Invalid parameter" });
			}
	
			if (itemId.includes("los")) {
				const item = await LostItem.findOne({ where: { lostId: itemId } });
				if (!item) {
					return res.status(404).json({ message: "Item not found" });
				}
				if (item.uid != uid) {
					return res.status(400).json({ message: "Item not yours" });
				}

				await item.destroy();
				return res.status(200).json({ message: "Item report deleted successfully" });
			} else {
				const item = await FoundItem.findOne({ where: { foundId: itemId } });
				if (!item) {
					return res.status(404).json({ message: "Item not found" });
				}
				if (item.uid != uid) {
					return res.status(400).json({ message: "Item not yours" });
				}

				await item.destroy();
				return res.status(200).json({ message: "Item report deleted successfully" });
			}
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}
}

export default new ItemController();