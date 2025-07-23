import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Image } from "lucide-react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser, isEditingMessage, editMessage } =
    useChatStore();

  useEffect(() => {
    setText("");
  }, [selectedUser._id]);

  useEffect(() => {
    if (editMessage) {
      setText(editMessage);
    }
  }, [isEditingMessage]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file && !file.type.startWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!text.trim() && !imagePreview) return;
    try {
      await sendMessage({ text: text.trim(), image: imagePreview });
    } catch (error) {
      console.log(error);
    } finally {
      setText("");
      setImagePreview(null);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-base-300 flex items-center justify-center cursor-pointer"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}
      {isEditingMessage && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative w-185 h-10 bg-gray-500">
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-base-300 flex items-center justify-center cursor-pointer"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`hidden sm:flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
          >
            <Image size={20} />
          </button>
          <button
            type="submit"
            className="btn btn-circle "
            disabled={!text.trim() && !imagePreview}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
