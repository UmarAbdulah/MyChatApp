import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
    authUser : null,
    isCheckingAuth : true,
    isSigningUp : false,
    isLoggingIn : false ,
    isUpdatingProfile : false ,
    logedIn : false,
    onlineUsers : [],

    
    checkAuth: async () => {
        set({ isCheckingAuth: true });

        try {
            const res = await axiosInstance.get("/auth/check");

            if (res.status === 200) {
            set({
                authUser: res.data,
            });
            } else {
            throw new Error("User not authenticated");
            }
        } catch (error) {
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
},

    signup : async (data) =>{
        try{
            set({isSigningUp:true})
            const res = await axiosInstance.post("/auth/signup",data);
            if (res.status === 201){
                set({
                    isSigningUp:false
                })
                toast.success("Account Created Successfully");
                return {success : true}
            }
            else {
                throw new Error("Failed to create account");
            }
        }
        catch(error){
            toast.error(error?.response?.data?.message || "Signup failed");
            return {success : false }
        }
        finally{
            set({isSigningUp : false})
        }
    },

    login : async (data) =>{
        set({isLoggingIn : true})
        try{
            const res = await axiosInstance.post("/auth/login",data);
            if (res.status === 200 ){
                set({logedIn : true});
                toast.success("Logged in successfully")
                set({authUser : res.data})
                return {success : true}
            }
            else{
                throw new Error("Failed to login");
            }
        }
        catch(error){
            toast.error(error?.response?.data?.message || "Login failed");
            return {success : false }
        }
        finally{
            set({isLoggingIn : false})
        }
    },

    logout : async() =>{
        try{
            await axiosInstance.post("/auth/logout");
            set({authUser:null,logedIn : false});
            toast.success("Logged Out Successfully")
        }
        catch(error){
            console.log("error in logout",error);
            toast.error("Error logging out");
        }
    },

    updateProfile : async(data) =>{
        set({isUpdatingProfile : true});
        try{
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({authUser : res.data.updatedUser})
            toast.success("Profile Updated Successfully")
        }
        catch(error){
            console.log(error)
            toast.error("Something went wrong ")
        }
        finally{
            set({isUpdatingProfile : false})
        }
    }
}))