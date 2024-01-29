import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";
import User from "./user.model";

class FoundItem extends Model {
	public foundId!: number;
	public uid!: string;
	public itemName!: string;
	public itemDescription!: string;
	public foundDate!: Date;
	public foundTime!: Date;
	public category!: string;
	public latitude?: string;
	public longitude?: string;
	public locationDetail?: string;
	public status!: boolean;
}

FoundItem.init({
	foundId: {
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
	itemName: {
		type: DataTypes.STRING,
		allowNull: false        
	},
	itemDescription: {
		type: DataTypes.STRING,
		allowNull: false
	},
	foundDate: {
		type: DataTypes.DATEONLY,
		allowNull: false
	},
	foundTime: {
		type: DataTypes.TIME,
		allowNull: false
	},
	category: {
		type: DataTypes.STRING,
		allowNull: false
	},
	latitude: {
		type: DataTypes.STRING,
	},
	longitude: {
		type: DataTypes.STRING,
	},
	locationDetail: {
		type: DataTypes.STRING,
	},
	status: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	},
}, {
	sequelize,
	modelName: "foundItem",
});

export { FoundItem };
