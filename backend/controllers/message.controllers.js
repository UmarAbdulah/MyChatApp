import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import { getReceiverSocketId } from "../lib/socket.js";

export const getUsersForSideBar =async (req,res) =>{
    try{
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id : {$ne : loggedInUserId}}).select("-password");

        res.status(200).json(filteredUsers);
    }
    catch(error){
        console.error("Error fetching users for sidebar:", error);
        res.status(500).json({ message: "Server side error occurred" });    
    }
}

export const getMessages = async (req, res) => {
    const userId = req.params.id;
    const loggedInUserId = req.user._id;

    try {
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const messages = await Message.find({
            $or: [
                { senderId: loggedInUserId, receiverId: userId },
                { senderId: userId, receiverId: loggedInUserId }
            ]
        });
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Server side error occurred" });
    }
}

export const sendMessage = async(req,res) =>{
    const {text, image} = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;
    let imageUrl;

    if (image) {
        const  uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
    }

    if (!receiverId) {
        return res.status(400).json({ message: "Receiver ID is required" });
    }


    try {
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image : imageUrl
        });

        const receiveSocketId = await getReceiverSocketId(receiverId);
        if(receiveSocketId){
            io.to(receiveSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: "Server side error occurred" });
    }
}

export const deleteMessage = async(req,res) => {
    const messageId = req.params.id;
    const loggedInUserId = req.user._id;
    try{
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        if (message.senderId.toString() !== loggedInUserId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this message" });
        }
        await Message.findByIdAndDelete(messageId);
        const userSocketId = await getReceiverSocketId(message.receiverId);
        if(userSocketId){
            io.to(userSocketId).emit("messageDeleted", messageId);
        }
        res.status(200).json({ message: "Message deleted successfully" });
    }
    catch(error){
        res.status(500).json({message : "Server side error occurred"})
    }

}

export const findMessage = async (req ,res ) => {
    const messageId = req.params.id;
    const loggedInUserId = req.user._id;
    try{
         const message = await Message.findById(messageId);
         if (!message) {
             return res.status(404).json({ message: "Message not found" });
         }
        if (message.senderId.toString() !== loggedInUserId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this message" });
        }
        res.status(200).json(message);
    }
    catch(error){
        res.status(500).json({message : "Server side error occurred"})
    }

}

export const editMessage = async (req,res) => {
    const id = req.params.id;
    const {text} = req.body;
    const loggedInUserId = req.user._id;
    try{
        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        if (message.senderId.toString() !== loggedInUserId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this message" });
        }
        if (message.isEdited === true) {
            return res.status(403).json({ message: "You can't edit this message" });
        }
        const response = await Message.findByIdAndUpdate(id, {text,isEdited : true}, {new : true});
        const userSocketId = await getReceiverSocketId(message.receiverId);
        if(userSocketId){
            io.to(userSocketId).emit("messageEdited", response);
        }
        res.status(200).json(response);
    }
    catch(error){
        throw new Error("Server side error")
    }
}

export const reactToMessage = async(req ,res ) => {
    const messageId = req.params.id;
    const {reaction} = req.body;
    const loggedInUserId = req.user._id;
    try{
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        const response = await Message.findByIdAndUpdate(messageId, { [`reactions.${loggedInUserId}`]: reaction}, {new : true});
        const userSocketId = await getReceiverSocketId(message.receiverId);
        if(userSocketId){
            io.to(userSocketId).emit("messageReacted", response);
        }
        res.status(200).json(response);
    }
    catch(error){
        res.status(500).json({message : "Server side error occurred"})
    }
}
