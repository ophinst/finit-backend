import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";
import User from "./user.model";

class Token extends Model {
	public uid!: string;
	public token!: string;
}

Token.init({
	tokenId: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	uid: {
		type: DataTypes.STRING,
		references: {
			model: User,
			key: "uid",
		}
	},
	token: {
		type: DataTypes.STRING,       
	}
}, {
	sequelize,
	modelName: "token",
});

export default Token;