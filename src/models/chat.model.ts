import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";

class Chat extends Model {
	public chatId!: string;
	public members!: [string];
}

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