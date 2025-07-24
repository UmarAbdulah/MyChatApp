import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./Skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuth.store";
import dayjs from "dayjs";
import { Trash, Pencil } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessageLoading,
    selectedUser,
    deleteMessage,
    isDeletingMessage,
    findMessage,
    setEditMessage,
    isEditingMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const chatRef = useRef(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser?._id, getMessages, isDeletingMessage, isEditingMessage]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const deleteMessageHandler = async (id) => {
    await deleteMessage(id);
  };

  const editMessageHandler = async (id) => {
    await findMessage(id);
    setEditMessage(id);
  };

  if (isMessageLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatRef}>
        {messages.map((message) => {
          const isSender = message.senderId === authUser._id;
          const profilePic = isSender
            ? authUser.profilePic || "./avatar.png"
            : selectedUser?.profilePic || "./avatar.png";

          return (
            <div
              key={message._id}
              className={`chat ${isSender ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img src={profilePic} alt="profile pic" />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {dayjs(message.createdAt).format("HH:mm")}
                </time>
              </div>
              <div className="chat-bubble flex flex-col gap-2">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                <div className="flex flex-col items-end">
                  {message.text && <span>{message.text}</span>}
                  {message.senderId === authUser._id && (
                    <div className="flex mt-3">
                      <Trash
                        size={25}
                        className="p-1 cursor-pointer hover:opacity-50"
                        onClick={() => {
                          deleteMessageHandler(message._id);
                        }}
                      />
                      {!message.image && (
                        <Pencil
                          size={25}
                          className="p-1 cursor-pointer hover:opacity-50"
                          onClick={() => {
                            editMessageHandler(message._id);
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
