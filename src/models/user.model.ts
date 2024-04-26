import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";

class User extends Model {
	public uid!: string; // Note that the `null assertion` `!` is required
	public name!: string;
	public email!: string;
	public password!: string;
	public phoneNumber: string;
	public image: string;
	public balance: number;
	public points: number;
}

User.init({
	uid: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false        
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false
	},
	phoneNumber: {
		type: DataTypes.STRING,
	},
	image: {
		type: DataTypes.STRING,
	},
	balance: {
		type: DataTypes.NUMBER,
	},
	points: {
		type: DataTypes.NUMBER,
	},
}, {
	sequelize,
	modelName: "user",
});

export { User };