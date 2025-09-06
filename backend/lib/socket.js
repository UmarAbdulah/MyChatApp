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

    socket.on(
    "callToUser",(data)=>{
        const receiver  = Object.keys(userSocketMap).find(key => key === data.calltoUserId);
        if (!receiver){
            socket.emit("offlineUser") 
            return;
        }
        io.to(userSocketMap[receiver]).emit("calltoUser",{
            signal : data.signalData,
            from : data.from,
            name : data.name,
            email: data.email,
            profilePic : data.profilePic
        })
    }
    )

    socket.on("callRejected",(data)=>{
        io.to(data.to).emit("callRejected",{
            name : data.name ,
            email : data.email,
            profilePic : data.profilePic
        })
    })


    socket.on("answeredCall",(data)=>{

        io.to(data.to).emit("callAccepted",{
            signal : data.signal,
            from : data.from,
        })
    })

    socket.on("callEnded",(data)=>{

        io.to(data.to).emit("callEnded",{
            name : data.name
        });
    })

    socket.on("disconnect",()=>{
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

export {io , app , server}
