// import sequelize library and database configuration
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";

// define user properties to indicate to Typescript that they are part of User model
class User extends Model {
	public uid!: string;
	public name!: string;
	public email!: string;
	public password!: string;
	public phoneNumber: string;
	public image: string;
	public points: number;
}

// initialize user model configuration
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
	points: {
		type: DataTypes.INTEGER,
	},
}, {
	sequelize,
	modelName: "user",
});

export { User };