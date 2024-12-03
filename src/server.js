const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.json());
app.use(cors());

require("dotenv").config();

// body-parser
app.use(express.json());

const PORT = process.env.PORT || 3000;

const groups = [
    { id: 1, name: "Group 1", description: "Group 1 description" },
    { id: 2, name: "Group 2", description: "Group 2 description" },
    { id: 3, name: "Group 3", description: "Group 3 description" },
];

const messages = {
    1: [
        { id: 1, text: "Hello", username: "John Doe" },
        { id: 2, text: "Hi", username: "Jane Doe" },
    ],
    2: [
        { id: 1, text: "Ahmad", username: "John Doe" },
        { id: 2, text: "Hi", username: "Jane Doe" },
    ],
    3: [
        { id: 1, text: "Ali", username: "John Doe" },
        { id: 2, text: "Hi", username: "Jane Doe" },
    ],
};

app.get("/groups", (req, res) => {
    res.json(groups);
});

let usersInRoom = {};

io.on("connection", (socket) => {
    let { groupId, username } = socket.handshake.query;

    socket.on("joined", (roomId) => {
        socket.join(roomId);

        if (!messages[roomId]) {
            messages[roomId] = 0;
        } else {
            messages[roomId]++;
        }

        socket.emit("previousMessages", JSON.stringify(messages[roomId]));
        socket
            .to(groupId)
            .emit(
                "user connected",
                username === undefined ? "unknown" : username
            );
        io.to(groupId).emit("usersInRoom", usersInRoom[groupId]);
    });

    socket.on("message", (message) => {
        console.log("message", message);
        messages[parseInt(groupId)].push(message);
        io.to(groupId).emit("message", message);
    });

    socket.on("disconnect", () => {
        socket
            .to(groupId)
            .emit(
                "user disconnected",
                username === undefined ? "unknown" : username
            );
        socket.leave(groupId);
        if (usersInRoom[groupId] === 1) {
            delete usersInRoom[groupId];
        } else {
            usersInRoom[groupId]--;
        }
        io.to(groupId).emit("usersInRoom", usersInRoom[groupId]);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
