import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";

class UserReward extends Model {
	public id!: number;
	public uid!: string;
	public rewardId!: string;
	public rewardCode!: string[];
}

UserReward.init({
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		allowNull: false,
		autoIncrement: true,
	},
	rewardCode: {
		type: DataTypes.ARRAY(DataTypes.STRING),
		allowNull: false
	},
},
{
	sequelize,
	modelName: "user-reward",
});

export { UserReward };