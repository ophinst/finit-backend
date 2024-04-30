// import sequelize library and database configuration
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";

// define user reward properties to indicate to Typescript that they are part of User Reward model
class UserReward extends Model {
	public id!: number;
	public uid!: string;
	public rewardId!: string;
	public rewardCode!: string[];
}

// initialize user reward model configuration
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