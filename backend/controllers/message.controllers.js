import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";

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
    const {text, img} = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;
    let imageUrl;
    if (img) {
        const  uploadResponse = await cloudinary.uploader.upload(img);
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

        //todo

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Server side error occurred" });
    }
}