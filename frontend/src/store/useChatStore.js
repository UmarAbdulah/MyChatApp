import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set,get)=>({
    messages : [],
    users : [],
    selectedUser : null,
    isUsersLoading : false,
    isMessagesLoading : false,
    isDeletingMessage : false,
    isEditingMessage : false,
    editMessage : null ,

    setIsEditingMessage :  () => {
        set({isEditingMessage : false})
    },

    getUsers : async () => {
        set({isUsersLoading : true})
        try{
            const res = await axiosInstance.get("/messages/users");
            if (res.status === 200){
                set({users : res.data})
            }
            else{
                throw new Error("Failed to fetch users");
            }
        }
        catch(error){
              toast.error("Something went wrong")

        }
        finally{
            set({isUsersLoading : false})
        }
    },

    getMessages : async (userId) => {
        set({isMessagesLoading : true});
        try{
            const res = await axiosInstance.get(`/messages/${userId}`);
            if (res.status === 200 ){
                set({messages : res.data});
            }
            else {
                throw new Error("Failed to fetch messages");
            }
        }
        catch(error){
            toast.error("Something went wrong")
        }
        finally{
            set({isMessagesLoading : false })
        }

    },

    sendMessage : async(messageData) =>{
        set({isMessagesLoading : true});
        const {selectedUser,messages} = get();
        try{
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`,messageData);
            set({messages : [...messages,res.data]})
        }
        catch(error){
            toast.error(error.response.data.message);
        }
        finally{
            set({isMessagesLoading : false});
        }
    },

    deleteMessage :async (id) => {
        set({isDeletingMessage : true})
        try{
            const response = await axiosInstance.delete(`/messages/delete/${id}`);
            if (response.status === 200){
                toast.success("Message Deleted successfully")   
            }
            else{
                throw new Error("Failed to delete message")
            }
        }
        catch(error){
            console.log(error)
            toast.error("Something went wrong cannot delete message")
        }
        finally{
            set({isDeletingMessage: false})
        }
    },

    findMessage : async (id) => {
        try{
            const response = await axiosInstance.get(`/messages/findMessage/${id}`);
            if (response.status === 200){
                const {editMessage} = get();
                set({editMessage : response.data.text});
                set({isEditingMessage : true})
            }
            else{
                throw new Error("Failed to fetch Message")
            }
        }
        catch(error){
            console.log(error)
            toast.error(error.message);
        }
    },

    setSelectedUser : (selectedUser) => {
        set({selectedUser : selectedUser})
    },



}))