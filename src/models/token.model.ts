import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";
import { User } from "./user.model";

class Token extends Model {
	public tokenId!: string;
	public uid!: string;
	public token!: string;
}

Token.init({
	tokenId: {
		type: DataTypes.STRING,
		primaryKey: true,
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