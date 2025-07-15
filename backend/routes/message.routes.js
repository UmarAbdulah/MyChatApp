import express from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import {getUsersForSideBar} from '../controllers/message.controllers.js'
import { getMessages } from '../controllers/message.controllers.js';
const router = express.Router();

router.get('/users',protectRoute,getUsersForSideBar);
router.get("/:id",protectRoute,getMessages)

export default router;
