// import sequelize library and database configuration
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";

// define chat properties to indicate to Typescript that they are part of Chat model
class Chat extends Model {
	public chatId!: string;
	public members!: [string];
}

// initialize chat model configuration
Chat.init({
	chatId: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	members: {
		type: DataTypes.ARRAY(DataTypes.STRING),
	},
	itemId: {
		type: DataTypes.STRING,
		allowNull: false,
	}
}, {
	sequelize,
	modelName: "chat",
});

export { Chat };