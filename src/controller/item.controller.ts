import { Request, Response } from "express";
import { FoundItem, LostItem } from "../models/item.model";
import { User } from "../models/user.model";
import { nanoid } from "nanoid";
import { Storage } from "@google-cloud/storage";
import { Env } from "../config/env-loader";
import { Op } from "sequelize";
import transactionMiddleware from "../middleware/transaction.middleware";

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
				}
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
				};
			} = {
				include: [{
					model: User,
					as: "lostOwner",
					attributes: ["name"]
				}]
			};

			if (category) {
				filter.where = {
					category: category
				};
			} else if (search) {
				filter.where = {
					itemName: {
						[Op.iLike]: `%${search}%`
					}
				};
			}

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
}

export default new ItemController();