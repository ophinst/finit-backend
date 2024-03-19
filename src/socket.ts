// socket-io-config.ts
import { Server } from "socket.io";
import * as http from "http";

interface User {
    userId: string;
    socketId: string;
}

export class SocketIOConfig {
	private io: Server;
	private activeUsers: User[] = [];

	constructor (server: http.Server) {
		this.io = new Server(server);

		this.initializeEventHandlers();
	}

	private initializeEventHandlers() {
		this.io.on("connection", (socket) => {
			this.handleNewConnection(socket);
			this.handleDisconnect(socket);
			this.handleSendMessage(socket);
		});
	}

	private handleNewConnection(socket) {
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

	private handleDisconnect(socket) {
		socket.on("disconnect", () => {
			// remove user from active users
			this.activeUsers = this.activeUsers.filter((user) => user.socketId !== socket.id);
			console.log("User Disconnected", this.activeUsers);
			// send all active users to all users
			this.io.emit("get-users", this.activeUsers);
		});
	}

	private handleSendMessage(socket) {
		// send message to a specific user
		socket.on("send-message", (data: { receiverId: string; message: string }) => {
			const { receiverId } = data;
			const user = this.activeUsers.find((user) => user.userId === receiverId);
			console.log("Sending from socket to :", receiverId);
			console.log("Data: ", data);
			if (user) {
				this.io.to(user.socketId).emit("receive-message", data);
			}
		});
	}
}
