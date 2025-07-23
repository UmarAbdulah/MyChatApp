import express from 'express';
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import {connectDB} from './lib/db.js';
import cors from "cors" ;


dotenv.config()

const app = express();
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

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${ process.env.PORT}`);
    connectDB()
}
);

