import * as cors from "cors";
import * as express from "express";
import * as morgan from "morgan";
import * as cookieParser from "cookie-parser";
import { Env } from "./config/env-loader";
import * as http from "http";
import { SocketIOConfig } from "./socket";
import AuthRouter from "./routes/auth.router";
import UserRouter from "./routes/user.router";
import ItemRouter from "./routes/item.router";
import ChatRouter from "./routes/chat.router";
import MessageRouter from "./routes/message.router";
import RewardRouter from "./routes/reward.router";

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
		.use("/auth", AuthRouter)
		.use(UserRouter)
		.use(ItemRouter)
		.use(ChatRouter)
		.use(MessageRouter)
		.use(RewardRouter)
);

app.use("/", (req, res) => {
	return res.status(200).json({
		message: "Data retrieved successfully",
		data: {
			name: "Maulana Luthfi Nasution",
			studentId: "001202100065",
			major: "Informatics",
			graduate: true,
			cumlaude: true
		}
	});
});

const server = http.createServer(app);

// Initialize SocketIOConfig after the HTTP server is created
new SocketIOConfig (server);

const port = Env.PORT;
server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});