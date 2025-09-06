import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./Skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuth.store";
import dayjs from "dayjs";
import { Trash, Pencil, MessagesSquare, Smile } from "lucide-react";

const ChatContainer = forwardRef((props, refs) => {
  const { connectionRef, remoteVideo, myVideo } = props.refs; // ✅ Destructure refs

  const reactions = ["❤️", "😂", "😮", "😢", "👍"];
  const [openReactionId, setOpenReactionId] = useState(null);

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
    subscribeToMessages,
    unsubscribeToMessages,
    deleteMessageinRealTime,
    editMessageinRealTime,
    reactToMessage,
    reactToMessagesInRealTime,
    listeningToUserTyping,
    listeningToUserStopTyping,
    typingUser,
    caller,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const chatRef = useRef(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
      deleteMessageinRealTime();
      editMessageinRealTime();
      reactToMessagesInRealTime();
      listeningToUserTyping();
      listeningToUserStopTyping();
    }
  }, [
    selectedUser?._id,
    getMessages,
    isDeletingMessage,
    isEditingMessage,
    subscribeToMessages,
    unsubscribeToMessages,
    reactToMessagesInRealTime,
    listeningToUserTyping,
    listeningToUserStopTyping,
  ]);

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

  const toggleReactions = (messageId) => {
    setOpenReactionId(openReactionId === messageId ? null : messageId);
  };

  const handleReaction = (messageId, reaction) => {
    setOpenReactionId(null);
    reactToMessage(messageId, reaction);
  };

  if (isMessageLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader callAccepted={callAccepted} />
        <MessageSkeleton />
        {!props.callAccepted && <MessageInput />}
      </div>
    );
  }

  if (!props.callAccepted) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader
          callAccepted={props.callAccepted}
          setCallAccepted={props.setCallAccepted}
          refs={{ connectionRef, remoteVideo, myVideo }}
        />
        {!caller && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatRef}>
            {messages.length === 0 && (
              <div className="flex flex-col justify-center h-full items-center p-30">
                <MessagesSquare size={100} />
                <p>No messages yet</p>
              </div>
            )}
            {messages.length > 0 &&
              messages.map((message) => {
                const isSender = message.senderId === authUser._id;
                const profilePic = isSender
                  ? authUser.profilePic || "./avatar.png"
                  : selectedUser?.profilePic || "./avatar.png";

                return (
                  <div
                    key={message._id}
                    className={`chat ${
                      isSender ? "chat-end" : "chat-start"
                    } group relative`}
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
                    <div className="relative flex items-center gap-2">
                      <div className="flex flex-col">
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
                                {!message.image && !message.isEdited && (
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
                        {message.reactions && (
                          <div
                            className={` gap-1 mt-2 absolute ${
                              isSender ? "top-17" : "top-8"
                            } `}
                          >
                            {Object.entries(message.reactions).map(
                              ([userId, emoji]) => (
                                <span
                                  key={userId}
                                  className={`bg-gray-100 rounded-full px-2 py-1 text-sm cursor-pointer hover:bg-gray-200 transition-colors
                           `}
                                >
                                  {emoji}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleReactions(message._id)}
                        className={`p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                          isSender ? "order-first" : "order-last"
                        }`}
                      >
                        <Smile size={16} className="text-gray-600" />
                      </button>

                      {openReactionId === message._id && (
                        <div
                          className={`absolute z-1 border border-gray-200 rounded-lg shadow-lg p-1 ${
                            isSender
                              ? "right-full mr-2 top-2"
                              : "left-full ml-2 top--2"
                          }`}
                        >
                          <div className="flex gap-[0.5]">
                            {reactions.map((reaction) => (
                              <button
                                key={reaction}
                                onClick={() =>
                                  handleReaction(message._id, reaction)
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg"
                              >
                                {reaction}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {selectedUser.name === typingUser && (
          <p className="ml-5 text-sm  text-gray-500">
            {typingUser ? `${typingUser}  is typing...` : null}
          </p>
        )}

        {!caller && <MessageInput />}
      </div>
    );
  }
});
export default ChatContainer;
