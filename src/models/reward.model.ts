import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";

class Reward extends Model {
	public rewardId!: string;
	public rewardName!: string;
	public rewardStock!: number;
	public rewardPrice!: number;
	public rewardCode!: string[];
	public rewardDescription!: string;
	public rewardExpiration!: Date;
	public rewardImage!: string;
}

Reward.init({
	rewardId: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	rewardName: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	rewardStock: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	rewardPrice: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	rewardDescription: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	rewardExpiration: {
		type: DataTypes.DATEONLY,
		allowNull: false,
	},
	rewardImage: {
		type: DataTypes.STRING,
		allowNull: false,
	}
},
{
	sequelize,
	modelName: "reward",
});

export { Reward };