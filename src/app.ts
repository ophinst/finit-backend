import * as cors from "cors";
import * as express from "express";
import * as morgan from "morgan";
import * as cookieParser from "cookie-parser";
import AuthRouter from "./routes/auth.router";
import UserRouter from "./routes/user.router";
import ItemRouter from "./routes/item.router";
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
app.use(express.json()); 

app.use(`${globalApiPrefix}/`, 
	express.Router()
		.use("/auth", AuthRouter)
		.use(UserRouter)
		.use(ItemRouter)
);

app.use("/", (req, res) => {
	console.log("Server is listening");
	res.send("It's working bruh, but you will find nothing here!");
});

const port = Env.PORT;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});