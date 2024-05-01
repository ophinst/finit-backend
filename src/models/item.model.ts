// import sequelize library and database configuration
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";
// import user model to define foreign key constraints
import { User } from "./user.model";

// define found item properties to indicate to Typescript that they are part of Found Item model
class FoundItem extends Model {
	public foundId!: string;
	public uid!: string;
	public itemName!: string;
	public itemDescription?: string;
	public foundDate!: Date;
	public foundTime!: Date;
	public category!: string;
	public latitude!: number;
	public longitude!: number;
	public locationDetail?: string;
	public completionStatus!: boolean;
	public lostUserStatus!: boolean;
	public foundUserStatus!: boolean;
	public foundOwner!: User;
	public createdAt!: Date;
}

// define lost item properties to indicate to Typescript that they are part of Lost Item model
class LostItem extends Model {
	public lostId!: string;
	public uid!: string;
	public itemName!: string;
	public itemImage!: string;
	public itemDescription?: string;
	public lostDate!: Date;
	public lostTime!: Date;
	public category!: string;
	public latitude!: number;
	public longitude!: number;
	public completionStatus!: boolean;
	public lostUserStatus!: boolean;
	public foundUserStatus!: boolean;
	public lostOwner!: User;
	public foundUserId: string;
	public createdAt: Date;
}

// initialize found and lost item model configuration
FoundItem.init({
	foundId: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	uid: {
		type: DataTypes.STRING,
		references: { // reference to the uid field in User model
			model: User,
			key: "uid",
		},
		allowNull: false,
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
		type: DataTypes.DOUBLE,
		allowNull: false
	},
	longitude: {
		type: DataTypes.DOUBLE,
		allowNull: false
	},
	locationDetail: {
		type: DataTypes.STRING,
	},
	completionStatus: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	},
	lostUserStatus: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	foundUserStatus: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	}
}, {
	sequelize,
	modelName: "foundItem",
});

LostItem.init({
	lostId: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	uid: {
		type: DataTypes.STRING,
		references: { // reference to the uid field in User model
			model: User,
			key: "uid",
		},
		allowNull: false,
	},
	itemName: {
		type: DataTypes.STRING,
		allowNull: false        
	},
	itemImage: {
		type: DataTypes.STRING,
		allowNull: false
	},
	itemDescription: {
		type: DataTypes.STRING,
		allowNull: true
	},
	lostDate: {
		type: DataTypes.DATEONLY,
		allowNull: false
	},
	lostTime: {
		type: DataTypes.TIME,
		allowNull: false
	},
	category: {
		type: DataTypes.STRING,
		allowNull: false
	},
	latitude: {
		type: DataTypes.DOUBLE,
		allowNull: false
	},
	longitude: {
		type: DataTypes.DOUBLE,
		allowNull: false
	},
	locationDetail: {
		type: DataTypes.STRING,
	},
	completionStatus: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	},
	foundUserStatus: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	lostUserStatus: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	foundUserId: {
		type: DataTypes.STRING,
		allowNull: true,
	}
}, {
	sequelize,
	modelName: "lostItem",
});

export { FoundItem, LostItem };
