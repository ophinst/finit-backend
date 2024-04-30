// import sequelize library and database configuration
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";
// import chat model to define foreign key constraints
import { Chat } from "./chat.model";

// define message properties to indicate to Typescript that they are part of Message model
class Message extends Model {
	public messageId!: string;
	public chatId!: string;
	public senderId!: string;
	public message!: string;
	public imageUrl?: string;
}

// initialize message model configuration
Message.init({
	messageId: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	chatId: {
		type: DataTypes.STRING,
		references: { // reference to the chatId field in Chat model
			model: Chat,
			key: "chatId",
		},
		allowNull: false,
	},
	senderId: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	message: {
		type: DataTypes.STRING,
	},
	imageUrl: {
		type: DataTypes.STRING,
	},
}, {
	sequelize,
	modelName: "message",
});

export { Message };