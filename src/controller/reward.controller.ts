import { Request, Response } from "express";
import { Reward } from "../models/reward.model";
import { User } from "../models/user.model";
import { sequelize } from "../config/db";
import { UserReward } from "../models/user-reward.model";
import { nanoid } from "nanoid";
import { Storage } from "@google-cloud/storage";
import { Env } from "../config/env-loader";

User.belongsToMany(Reward, { through: "user-reward", as: "voucher", foreignKey: "uid", });
Reward.belongsToMany(User, { through: "user-reward", as: "owner", foreignKey: "rewardId", });
class RewardController {

	async GetRewards(req: Request, res: Response): Promise<Response> {
		try {
			const rewards = await Reward.findAll();

			return res.status(200).json({
				message: "Rewards fetched successfully",
				data: rewards

			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async PurchaseRewards(req: Request, res: Response): Promise<Response> {
		try {
			// Start a transaction
			await sequelize.transaction(async (t) => {
				// Use a lock to prevent race conditions when accessing the reward
				const reward = await Reward.findOne({
					where: { rewardId: req.params.rewardId },
					lock: t.LOCK.UPDATE, // Apply a lock to reward instance
					transaction: t
				});
	
				const user = await User.findOne({
					where: { uid: req.uid },
					transaction: t
				});

				if (!reward) {
					return res.status(404).json({ message: "Reward not found" });
				}
				
				if (reward.rewardStock <= 0) {
					return res.status(400).json({ message: "Reward is out of stock" });
				}
				
				if (user.points < reward.rewardPrice) {
					return res.status(400).json({ message: "Insufficient points" });
				}
				
				// Update user points within the transaction
				await user.update({
					points: user.points - reward.rewardPrice,
				}, { transaction: t });
				
				// Update reward stock within the transaction
				await reward.update({
					rewardStock: reward.rewardStock - 1
				}, { transaction: t });

				const newRewardCode = "finvouc-" + nanoid(10);
				const rewardCheck = await UserReward.findOne({
					where: { 
						uid: req.uid,
						rewardId: req.params.rewardId
					},
					transaction: t
				});

				// If user has already purchased this reward, update the reward code array
				if (rewardCheck) {
					// Get the existing array of reward codes and flatten it because API return nested arrays
					const rewardCodes: string[] = rewardCheck.rewardCode.flat(); 
					rewardCodes.push(newRewardCode);
					console.log(rewardCodes);

					// Update reward code array in db
					await rewardCheck.update({
						rewardCode: [rewardCodes]
					}, { transaction: t });

					// Fetch user and reward data using table association
					const updatedUserReward = await User.findOne({
						where: {
							uid: req.uid,
						},
						transaction: t,
						attributes:{
							exclude: ["password"]
						},
						include:{
							model: Reward,
							as: "voucher",
							attributes : ["rewardName"],
							through: {
								as: "ownedRewardCode",
								attributes: ["rewardCode"]
							}
						}
					});
					

					return res.status(200).json({
						message: "Reward purchased successfully",
						data: updatedUserReward
					});
				}
				
				await UserReward.create({
					uid: req.uid,
					rewardId: req.params.rewardId,
					rewardCode: [newRewardCode]
				}, { transaction: t });

				const updatedUserReward = await User.findOne({
					where: {
						uid: req.uid,
					},
					transaction: t,
					include:{
						model: Reward,
						as: "voucher",
						attributes : ["rewardName"],
						through: {
							as: "ownedRewardCode",
							attributes: ["rewardCode"]
						}
					}
				});

				return res.status(201).json({
					message: "Reward purchased successfully",
					data: updatedUserReward
				});
			});
		}
		catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	async CreateRewards(req: Request, res: Response): Promise<Response> {
		try {
			const { rewardName, rewardStock, rewardPrice, rewardDescription, rewardExpiration } = req.body;

			// if (!rewardName || !rewardStock || !rewardPrice || !rewardDescription || !rewardExpiration) {
			// 	return res.status(400).json({message: "Please provide all required fields"});
			// }

			const storage = new Storage({
				projectId: Env.GCP_PROJECT_ID,
				credentials: JSON.parse(Env.GCP_KEY)
			});
			const bucket = storage.bucket(Env.GCP_BUCKET_NAME);
		
			console.log("File attached to the request:", req.file); // Log the file object
		
			if (!req.file) {
				return res.status(400).json({ error: "Please provide an image" });
			}
		
			const folder = "rewardImage";
			const filename = `${folder}/${req.file.originalname}`;
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

					const reward = await Reward.create({
						rewardId: "rew-" + nanoid(10),
						rewardName: rewardName,
						rewardStock: rewardStock,
						rewardPrice: rewardPrice,
						rewardDescription: rewardDescription,
						rewardExpiration: rewardExpiration,
						rewardImage: publicUrl.toString()
					});

					return res.status(201).json({
						message: "Reward created successfully",
						data: reward
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

	async GetUserReward(req: Request, res: Response): Promise<Response> {
		const uid = req.uid;

		try {
			const userReward = await User.findOne({
				where: { uid: uid },
				include: {
					model: Reward,
					as: "voucher",
					through: {
						as: "ownedRewardCode",
						attributes: ["rewardCode"]
					}
				}
			});

			if (!userReward) {
				return res.status(404).json({ message: "User don't have any reward" });
			}

			return res.status(200).json({
				message: "User reward fetched successfully",
				data: userReward
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}
}

export default new RewardController();