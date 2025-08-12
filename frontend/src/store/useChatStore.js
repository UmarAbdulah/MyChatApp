import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuth.store";

export const useChatStore = create((set,get)=>({
    messages : [],
    users : [],
    selectedUser : null,
    isUsersLoading : false,
    isMessagesLoading : false,
    isDeletingMessage : false,
    isEditingMessage : false,
    editMessage : null ,
    editMessageId : null ,
    typingUser : null,

    setIsEditingMessage :  () => {
        set({isEditingMessage : false})
    },

    setEditMessage :  (value) => {
        set({editMessageId : value})
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

    editMessageHandler : async (text) => {
        const {editMessageId} = get();
        try{
            const response = await axiosInstance.put(`/messages/message/edit/${editMessageId}`,{text:text})
            if (response.status === 200){
                toast.success("Message Edited Successfully")
            }
            else {
                throw new Error("Failed to edit message")
            }
        }
        catch(error){
            toast.error("Failed to edit Message")
        }
        finally{
            set({isEditingMessage : false})
        }

    },

    setSelectedUser : (selectedUser) => {
        set({selectedUser : selectedUser})
    },

    subscribeToMessages : () => {
        const {selectedUser} = get();
        if (!selectedUser){
            return ;
        }
        
        const socket = useAuthStore.getState().socket;
        socket.on("newMessage",(newMessage)=>{
                if (newMessage.senderId !== selectedUser._id){
                    return;
                }
                set({messages : [...get().messages, newMessage]})
            
        })
    },

    unsubscribeToMessages : () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    deleteMessageinRealTime : () => {
        const socket = useAuthStore.getState().socket;
        socket.on("messageDeleted",(messageId)=>{
            set((state) => ({
                messages: state.messages.filter((message) => message._id !== messageId),
            }));
        })
    },

    editMessageinRealTime : () => {
        const socket = useAuthStore.getState().socket;
        socket.on("messageEdited",(editedMessage)=>{
            set((state) => ({
                messages: state.messages.map((message) =>
                    message._id === editedMessage._id ? editedMessage : message
                ),
            }));
        })
    },
    
    reactToMessage : async (messageId, reaction) => {
        try{
            const response = await axiosInstance.put(`/messages/message/react/${messageId}`, {reaction});
            if (response.status !== 200){
                throw new Error("Failed to react to message")
            }
        }
        catch(error){
            toast.error("Failed to react to message")
        }
    },

    reactToMessagesInRealTime: () => {
        const socket = useAuthStore.getState().socket;
        socket.on("messageReacted", (updatedMessage) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === updatedMessage._id ? updatedMessage : msg
                )
            }));
        });
    },

    userisTyping : () => {
        const socket = useAuthStore.getState().socket;
        const user = useAuthStore.getState().authUser;
        const {selectedUser} = get();
        socket.emit("userIsTyping", { conversationId: selectedUser._id, userId : user._id,username : user.name});
    },

    userStopTyping : (userId) => {
        const socket = useAuthStore.getState().socket;
        const user = useAuthStore.getState().authUser;

        const {selectedUser} = get();
        socket.emit("userStoppedTyping", {
                  conversationId: selectedUser._id,
                  userId: user._id,
                  username : user.name
                });
    },

    listeningToUserTyping : () => { 
        const socket = useAuthStore.getState().socket;
        const {selectedUser} = get();
        socket.on("typing",(username)=>{
            if (selectedUser.name === username ){
                set({ typingUser: username })
            }
        })
    },

    listeningToUserStopTyping  : () => {
        const socket = useAuthStore.getState().socket;
        socket.on("stopTyping",()=>{
            set({ typingUser: null })
        })
    }

}))