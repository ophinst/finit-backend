import { Sequelize } from "sequelize"; //import sequelize library
import { Env } from "./env-loader"; //import env variable

// create new connection configuration to database
export const sequelize = new Sequelize({
	dialect: "postgres",
	host: Env.DB_HOST,
	port: Env.DB_PORT,
	username: Env.DB_USERNAME,
	password: Env.DB_PASSWORD,
	database: Env.DB_NAME,
});

try {
	sequelize.authenticate(); //authenticate using database connection configuration
	if (Env.NODE_ENV === "development") { // sync the table in database with the one in model files
		sequelize.sync().then(() => console.log("Database & tables created!"));
	}
} catch (err) {
	console.error(err);
}