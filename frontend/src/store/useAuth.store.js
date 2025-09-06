import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {io} from "socket.io-client";

export const useAuthStore = create((set,get) => ({
    authUser : null,
    isCheckingAuth : true,
    isSigningUp : false,
    isLoggingIn : false ,
    isUpdatingProfile : false ,
    logedIn : false,
    onlineUsers : [],
    socket : null ,

    
    checkAuth: async () => {
        set({ isCheckingAuth: true });

        try {

            const res = await axiosInstance.get("/auth/check");

            if (res.status === 200) {
                set({
                    authUser: res.data,
                });
                get().connectSocket();
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
                return {success : true};
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
        const {authUser} = get();
        try{
            const res = await axiosInstance.post("/auth/login",data);
            if (res.status === 200 ){
                set({logedIn : true});
                set({authUser : res.data})
                get().connectSocket();
                toast.success("Logged in successfully")
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
            get().disConnectSocket()
        }
        catch(error){
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
            toast.error("Something went wrong ")
        }
        finally{
            set({isUpdatingProfile : false})
        }
    },

    connectSocket: () => {
        const {authUser} = get();
        if (get().socket){
            return ;
        }
        const socket = io(import.meta.env.VITE_API_BASE,{
              withCredentials: true,
              query:{
                userId : authUser._id
              }
        });
        socket.connect();
        set({ socket : socket});
        socket.on("connect", () => {        
        socket.on("getOnlineUsers",(userIds)=>{
            set({onlineUsers : userIds})
        })
    });
    },

    disConnectSocket: () => {
        const socket = get().socket
        if (socket?.connected) {
            socket.disconnect();
            set({socket:null})
        }
    },
}))