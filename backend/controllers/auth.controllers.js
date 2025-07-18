import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const {name , email , password }= req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please fill all the fields" });
    }
    if (!email.includes("@")) {
        return res.status(400).json({ message: "Please enter a valid email address" });
    }
    try{
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const user = await User.findOne({email})

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        if (newUser){
            generateToken(newUser._id , res);
            await newUser.save();
            res.status(201).json({
                _id : newUser._id,
                name: newUser.name,
                email: newUser.email,
                profilePic: user.profilePic,

            })
        }
        else{
            return res.status(500).json({ message: "User creation failed" });
        }

    }
    catch(error){
        console.log("Error" , error);
        res.status(500).json("Server side error occurred");
    }
}

export const login = async (req, res) => {

    console.log(req.body)
    const {email , password} = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Please fill all the fields" });
    }
    if (!email.includes("@")) {
        return res.status(400).json({ message: "Please enter a valid email address" });
    }

    try{
        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        generateToken(user._id, res);
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
        });
    }
    catch(error){
        console.log("Error", error);
        res.status(500).json("Server side error occurred");
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json("User logged out successfully");
    }
    catch(error){
        console.log("Error", error);
        res.status(500).json("Server side error occurred");
    }

}

export const updateProfile = async (req, res) => {
    try {
        const {profilePic} = req.body ;
        const userId = req.user._id;
        if (!profilePic) {
            return res.status(400).json({ message: "Please provide a profile picture URL" });
        }
        const response = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: response.secure_url },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            updatedUser
        });
    }
    catch(error){
        console.log("Error", error);
        res.status(500).json("Server side error occurred");
    }
}

export const checkAuth = (req, res) => {
    try{
        res.status(200).json(req.user);
    }catch(error){
        console.log("Error in checkAuth Controller", error);
        res.status(500).json("Server side error occurred");
    }
}
