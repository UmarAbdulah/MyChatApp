import express from 'express';
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import {connectDB} from './lib/db.js';
import cors from "cors" ;
import { app,server } from './lib/socket.js';

dotenv.config()

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser())
app.use(cors(
    {
        origin: process.env.CLIENT_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
    }
))


app.use('/api/auth',authRoutes)
app.use('/api/messages',messageRoutes)

server.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${ process.env.PORT}`);
    connectDB()
}
);

