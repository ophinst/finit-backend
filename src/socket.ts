import { Server, Socket } from "socket.io";
import * as http from "http";

interface User {
    userId: string;
    socketId: string;
}

export class SocketIOConfig {
	private io: Server;
	private activeUsers: User[] = [];

	constructor(server: http.Server) {
		this.io = new Server(server, {
			cors: {
				origin: "*", // Update with your frontend URL
				credentials: true // Set to true if your requests include credentials
			}
		});
		

		this.initializeEventHandlers();
	}

	private initializeEventHandlers() {
		this.io.on("connection", (socket: Socket) => { // Change here to specify Socket type
			this.handleNewConnection(socket);
			this.handleDisconnect(socket);
			this.handleSendMessage(socket);
		});
	}

	private handleNewConnection(socket: Socket) { // Change here to specify Socket type
		// add new User
		socket.on("new-user-add", (newUserId: string) => {
			// if user is not added previously
			if (!this.activeUsers.some((user) => user.userId === newUserId)) {
				this.activeUsers.push({ userId: newUserId, socketId: socket.id });
				console.log("New User Connected", this.activeUsers);
			}
			// send all active users to new user
			this.io.emit("get-users", this.activeUsers);
		});
	}

	private handleDisconnect(socket: Socket) { // Change here to specify Socket type
		socket.on("disconnect", () => {
			// remove user from active users
			this.activeUsers = this.activeUsers.filter((user) => user.socketId !== socket.id);
			console.log("User Disconnected", this.activeUsers);
			// send all active users to all users
			this.io.emit("get-users", this.activeUsers);
		});
	}

	private handleSendMessage(socket: Socket) { // Change here to specify Socket type
		// send message to a specific user
		socket.on("send-message", (data: { senderId: string, receiverId: string; message: string, imageUrl: string, latitude: string, longitude: string }) => {
			const { senderId, receiverId } = data;
			const user = this.activeUsers.find((user) => user.userId === receiverId);

			if (!senderId || !receiverId ) {
				console.error("Invalid sender or receiver id:", data);
				return;
			}

			console.log("Sending from socket to :", receiverId);
			console.log("Data: ", data);
			if (user) {
				this.io.to(user.socketId).emit("receive-message", data);
			}
		});
	}
}
