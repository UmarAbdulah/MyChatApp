import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuth.store";
import { data } from "react-router-dom";

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
    userIsOffline : true, 
    recievingCall : false,
    caller : null,
    callerSignal : null,
    showCallRejectedPopUp : false ,
    callrejectedUser : null,
    stream : null,
    callEnded : null ,
    callEndedByUser : null,


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
    },

    videoCallService : (data) =>{
        const socket = useAuthStore.getState().socket;
        const {selectedUser} = get();
        socket.emit("callToUser",{
            calltoUserId : selectedUser._id,
            signalData : data,
            from : socket.id,
            name : useAuthStore.getState().authUser.name,
            email: useAuthStore.getState().authUser.email,
            profilePic : useAuthStore.getState().authUser.profilePic
        })
    },

    offlineUser : () => {
        const socket = useAuthStore.getState().socket;
        const {userIsOffline} = get();

        socket.on("offlineUser",()=>{
            toast.error("User is offline")
            set({ userIsOffline: true })
        })
    },

    callrecive: () => {
    const socket = useAuthStore.getState().socket;

    const handleCall = (data) => {
      set({ userIsOffline: false });
      set({ caller: data });
      set({ callerSignal: data.signal });
      set({ recivingCall: true });
    };

    socket.on("calltoUser", handleCall);
    return () => socket.off("calltoUser", handleCall);
  },    

    callRejected: () => {
        const socket = useAuthStore.getState().socket;
        socket.emit("callRejected", {
        to: get().caller.from,
        name: useAuthStore.getState().authUser.name,
        email: useAuthStore.getState().authUser.email,
        profilePic: useAuthStore.getState().authUser.profilePic,
        });
    },

  callRejectToUser: () => {
    const socket = useAuthStore.getState().socket;
    const handle = (data) => {
      set({ showCallRejectedPopUp: true });
      set({ callrejectedUser: data });
    };
    socket.on("callRejected", handle);
    return () => socket.off("callRejected", handle);
  },

    answertheCall: (data) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("answeredCall", {
      signal: data,
      from: socket.id,
      to: get().caller.from,
    });
  },

  // Accepts a callback to deliver the answer (for the caller to signal into peer)
  callAcceptedByUser: (onAnswer) => {
    const socket = useAuthStore.getState().socket;
    const handler = (data) => {
      // data: { signal, from }
      set({ showCallRejectedPopUp: false });
      set({ caller: data.from });
      if (typeof onAnswer === "function") onAnswer(data);
    };
    socket.on("callAccepted", handler);
    return () => socket.off("callAccepted", handler);
  },

  endCall: () => {
    const socket = useAuthStore.getState().socket;
    socket.emit("callEnded" , {
        to  : get().caller,
        name: useAuthStore.getState().authUser.name,
    })
    set({recivingCall:false})
    
  },

  endCallByUser: (remoteVideo,myVideo,connectionRef,setDisplayVideo,setCallAccepted) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    set({callEnded : true})
    socket.on("callEnded", () => {
      set({
        caller: null,
        callerSignal: null,
        stream: null,
      });
      set({recivingCall : false})
    if (get().stream) {
      get().stream.getTracks().forEach((track) => track.stop());
    }
    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }
    if (myVideo.current) {
      myVideo.current.srcObject = null;
    }
    connectionRef.current?.destroy();
    if(setDisplayVideo){
        setDisplayVideo(false);
    }
    setCallAccepted(false);
    
    });
    
  },

//   endCallOnBothSides: (remoteVideo,myVideo)=>{
//     if (get().stream) {
//       get().stream.getTracks().forEach((track) => track.stop());
//     }
//     if (remoteVideo.current) {
//       remoteVideo.current.srcObject = null;
//     }
//     if (myVideo.current) {
//       myVideo.current.srcObject = null;
//     }
//     connectionRef.current?.destroy();
//     useChatStore.setState({ stream: null });
//     useChatStore.setState({ recievingCall: null });
//     setCallAccepted(false);
//   }


}))