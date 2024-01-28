import * as cors from "cors";
import * as express from "express";
import * as morgan from "morgan";
import * as cookieParser from "cookie-parser";
import authRouter from "./routes/auth.router";
import userRouter from "./routes/user.router";
import itemRouter from "./routes/item.router";
import { Env } from "./config/env-loader";

const app = express(); 

const globalApiPrefix = "/api";
app.use(globalApiPrefix, express.json());

app.use(cors({
	credentials: true,
	origin: "*",
}));
app.use(morgan("tiny"));
app.use(cookieParser());
app.disable("x-powered-by");

app.use(`${globalApiPrefix}/`, 
	express.Router()
		.use("/auth", authRouter)
		.use(userRouter)
		.use(itemRouter)
);

app.use("/", (req, res) => {
	console.log("Server is listening");
	res.send("It's working bruh!");
});

const port = Env.PORT;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});