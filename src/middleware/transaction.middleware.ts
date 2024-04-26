import { FoundItem, LostItem } from "../models/item.model";
import { User } from "../models/user.model";

class TransactionMiddleware{
	async CheckFoundTransactionStatus(foundId) {
		try {
			const userCompletionStatus = await FoundItem.findOne({
				where: {
					foundId: foundId
				}
			});

			if (userCompletionStatus.foundUserStatus === true && userCompletionStatus.lostUserStatus === true) {
				const foundUser = await User.findOne({where: {uid: userCompletionStatus.uid}});
				
				await User.update({
					points: foundUser.points + Math.floor(Math.random() * 100) + 1
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

	async CheckLostTransactionStatus(lostId) {
		try {
			const userCompletionStatus = await LostItem.findOne({
				where: {
					lostId: lostId
				}
			});

			if (userCompletionStatus.foundUserStatus === true && userCompletionStatus.lostUserStatus === true) {
				const foundUserId = userCompletionStatus.foundUserId;
				const foundUser = await User.findOne({where: {uid: foundUserId}});

				await User.update({
					points: foundUser.points + Math.floor(Math.random() * 100) + 1
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
}

export default new TransactionMiddleware;