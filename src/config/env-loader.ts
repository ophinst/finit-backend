import * as dotenv from "dotenv";
dotenv.config();

export const EnvironmentsVariables = () => ({
	PORT: +process.env.PORT!,
	DB_HOST: process.env.DB_HOST,
	DB_PORT: +process.env.DB_PORT!,
	DB_USERNAME: process.env.DB_USERNAME,
	DB_PASSWORD: process.env.DB_PASSWORD,
	DB_NAME: process.env.DB_NAME,
	JWT_SECRET: process.env.JWT_SECRET,
	GCP_EMAIL: process.env.GCP_EMAIL,
	GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
	GCP_BUCKET_NAME: process.env.GCP_BUCKET_NAME,
	GCP_KEY: process.env.GCP_KEY,
	NODE_ENV: process.env.NODE_ENV
});

export const Env = EnvironmentsVariables();