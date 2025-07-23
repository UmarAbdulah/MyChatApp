import express from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import {getUsersForSideBar,getMessages,sendMessage,deleteMessage,findMessage} from '../controllers/message.controllers.js'

const router = express.Router();

router.get('/users',protectRoute,getUsersForSideBar);
router.get("/findMessage/:id", protectRoute, findMessage)
router.get("/:id",protectRoute,getMessages);
router.post("/send/:id",protectRoute,sendMessage)
router.delete("/delete/:id",protectRoute,deleteMessage)

export default router;
