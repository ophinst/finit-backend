import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";
import { Chat } from "./chat.model";

class Message extends Model {
	public messageId!: string;
	public chatId!: string;
	public senderId!: string;
	public message!: string;
	public imageUrl?: string;
}

Message.init({
	messageId: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	chatId: {
		type: DataTypes.STRING,
		references: {
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