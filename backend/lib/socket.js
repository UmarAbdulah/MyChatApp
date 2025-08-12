import {Server} from "socket.io";
import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config()

const app =  express() ;
const server = http.createServer(app);


const userSocketMap = {}

const io = new Server(server,{
    cors : {
        origin : [process.env.CLIENT_URL],
        credentials: true,

    }
});

export function getReceiverSocketId(userId){
    return userSocketMap[userId];
}

io.on("connection",(socket)=>{
    console.log("User Connected",socket.id)

    const userId = socket.handshake.query.userId

    if(userId){
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("userIsTyping", ({ conversationId, userId,username }) => {
        const userSocketId = getReceiverSocketId(conversationId);
        io.to(userSocketId).emit("typing",username );
    });
    socket.on("userStoppedTyping", ({ conversationId, userId,username }) => {
        const userSocketId = getReceiverSocketId(conversationId);
        io.to(userSocketId).emit("stopTyping");
    });


    socket.on("disconnect",()=>{
        console.log("User disconneted",socket.id)
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

export {io , app , server}
