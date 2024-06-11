import { FoundItem, LostItem } from "../models/item.model";
import { User } from "../models/user.model";

class TransactionMiddleware{
	async CheckFoundTransactionStatus(foundId: string) {
		try {
			const userCompletionStatus = await FoundItem.findOne({
				where: {
					foundId: foundId
				}
			});

			if (userCompletionStatus.foundUserStatus === true && userCompletionStatus.lostUserStatus === true) {
				const foundUser = await User.findOne({where: {uid: userCompletionStatus.uid}});
				
				const rewardPoints = await this.CalculatePointReward(userCompletionStatus.category);
				console.log("=====" + parseInt(rewardPoints));

				await User.update({
					points: foundUser.points + parseInt(rewardPoints)
				},
				{
					where: {
						uid: userCompletionStatus.uid
					}
				});

				await FoundItem.update({
					completionStatus: true
				},
				{
					where: {
						foundId: foundId
					}
				});

				const updatedFoundUser = await User.findOne({
					where: {uid: userCompletionStatus.uid}, 
					attributes: {
						exclude: ["password"]
					}});
				const updatedItemData = await FoundItem.findOne({where: {foundId: foundId}});

				const foundUserData = updatedFoundUser.get({plain: true});
				const itemData = updatedItemData.get({plain: true});

				return { foundUserData, itemData };
			}
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	async CheckLostTransactionStatus(lostId: string) {
		try {
			const userCompletionStatus = await LostItem.findOne({
				where: {
					lostId: lostId
				}
			});

			if (userCompletionStatus.foundUserStatus === true && userCompletionStatus.lostUserStatus === true) {
				const foundUserId = userCompletionStatus.foundUserId;
				const foundUser = await User.findOne({where: {uid: foundUserId}});
				const rewardPoints = await this.CalculatePointReward(userCompletionStatus.category);
				console.log("=====" + parseInt(rewardPoints));

				await User.update({
					points: foundUser.points + parseInt(rewardPoints)
				},
				{
					where: {
						uid: foundUserId
					}
				});

				await userCompletionStatus.update({
					completionStatus: true
				},
				{
					where: {
						lostId: lostId
					}
				});

				const updatedFoundUser = await User.findOne({
					where: {uid: foundUserId}, 
					attributes: {
						exclude: ["password"]
					}});

				const updatedItemData = await LostItem.findOne({where: {lostId: lostId}});

				const foundUserData = updatedFoundUser.get({plain: true});
				const itemData = updatedItemData.get({plain: true});

				return { foundUserData, itemData };
			}
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	async CalculatePointReward(category: string){
		try {
			let rewardPoints;
			const itemCategory = category.toLowerCase();

			switch (itemCategory) {
				case "phone":
					rewardPoints = Math.floor(Math.random() * 36) + 35;
					break;
				case "wallet":
					rewardPoints = Math.floor(Math.random() * 16) + 25;
					break;
				case "card":
					rewardPoints = Math.floor(Math.random() * 11) + 10;
					break;
				case "watch":
					rewardPoints = Math.floor(Math.random() * 36) + 15;
					break;
				case "glasses":
					rewardPoints = Math.floor(Math.random() * 15) + 1;
					break;
				case "jewelry":
					rewardPoints = Math.floor(Math.random() * 41) + 30;
					break;
				case "tumbler":
					rewardPoints = Math.floor(Math.random() * 21) + 20;
					break;
				case "vehicle":
					rewardPoints = Math.floor(Math.random() * 51) + 50;
					break;
				default:
					rewardPoints = Math.floor(Math.random() * 35) + 1;
					break;
			}
			return rewardPoints;
		} catch (error) {
			console.error(error);
			return false;
		}
	}
}

export default new TransactionMiddleware;