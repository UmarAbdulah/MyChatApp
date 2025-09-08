import { X, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuth.store";
import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";
import Peer from "simple-peer";
import {
  FaPhoneAlt,
  FaPhoneSlash,
  FaBars,
  FaMicrophone,
  FaVideo,
} from "react-icons/fa";

const ChatHeader = (props) => {
  const { connectionRef, remoteVideo, myVideo } = props.refs;

  const {
    selectedUser,
    setSelectedUser,
    videoCallService,
    offlineUser,
    callRejectToUser,
    showCallRejectedPopUp,
    callrejectedUser,
    callAcceptedByUser,
    stream,
    caller,
    endCall,
    endCallByUser,
    callEnded,
    callEndedByUser,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [displayVideo, setDisplayVideo] = useState(false);
  const [isMicOn] = useState(true);
  const [isCamOn] = useState(true);

  // Attach local stream to my video for caller UI
  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;
      myVideo.current.muted = true;
      myVideo.current.onloadedmetadata = () => {
        myVideo.current
          ?.play()
          .catch((err) => console.error("Play error:", err));
      };
    }
  }, [stream]);

  useEffect(() => {
    const cleanupReject = callRejectToUser();
    endCallByUser();

    return () => cleanupReject?.();
  }, [callRejectToUser, endCallByUser]);

  const stopMediaDevices = (s) => {
    if (!s) return;
    s.getTracks().forEach((t) => t.stop());
  };

  const startCall = async () => {
    try {
      useChatStore.setState({ showCallRejectedPopUp: false });

      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      useChatStore.setState({ stream: currentStream });
      setDisplayVideo(true);

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
      });

      connectionRef.current = peer;

      // Send OFFER to callee
      peer.on("signal", (data) => {
        videoCallService(data);
      });

      // When callee ANSWERS, feed their answer into our peer
      const cleanupAccepted = callAcceptedByUser((data) => {
        // data: { signal, from }
        connectionRef.current?.signal(data.signal);
      });

      // Render remote when it arrives
      peer.on("stream", (remoteStream) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = remoteStream;
          remoteVideo.current.muted = false;
          remoteVideo.current.volume = 1.0;
          remoteVideo.current.onloadedmetadata = () => {
            remoteVideo.current?.play().catch(console.error);
          };
        }
      });

      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
      });

      // If user goes offline between offer and answer
      offlineUser();

      // Cleanup event listener if this component unmounts / call ends
      // (We also clean it in the HomePage effect)
      return () => cleanupAccepted?.();
    } catch (error) {
      console.error("Error starting call:", error);
      alert(
        "Failed to start call. Please check camera/microphone permissions."
      );
    }
  };
  const endCallCleanUP = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }
    if (myVideo.current) {
      myVideo.current.srcObject = null;
    }
    connectionRef.current?.destroy();
    useChatStore.setState({ stream: null });
    useChatStore.setState({ recievingCall: null });
    setDisplayVideo(false);
    props.setCallAccepted(false);
    useChatStore.setState({ caller: null });
  };
  const handelendCall = () => {
    endCall();
    endCallCleanUP();
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  useEffect(() => {
    endCallByUser(
      remoteVideo,
      myVideo,
      connectionRef,
      setDisplayVideo,
      props.setCallAccepted
    );
  }, [callEnded]);

  useEffect(() => {
    endCall();
    endCallCleanUP();
  }, [callEndedByUser]);

  return (
    <>
      {showCallRejectedPopUp && (
        <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex flex-col items-center">
              <p className="font-bold text-xl mb-2 text-black">
                Call Rejected From...
              </p>
              <img
                src={callrejectedUser.profilePic || "/avatar.png"}
                alt="Caller"
                className="w-20 h-20 rounded-full border-4 border-green-500"
              />
              <h3 className="text-lg font-bold mt-3 text-black">
                {callrejectedUser.name}
              </h3>
              <p className="text-sm text-gray-500">{callrejectedUser?.email}</p>

              <div className="flex gap-4 mt-5">
                <button
                  type="button"
                  onClick={startCall}
                  className="bg-green-500 text-white px-4 py-1 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Call Again <FaPhoneAlt />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopMediaDevices(stream);
                    setDisplayVideo(false);
                    useChatStore.setState({ showCallRejectedPopUp: false });
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Back <FaPhoneSlash />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {displayVideo && !props.callAccepted && (
        <>
          {!caller && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="text-white text-2xl font-bold">Connecting...</div>
            </div>
          )}
          {caller && (
            <div className="absolute top-0 left-0 w-full h-screen bg-black items-center justify-center">
              <video
                autoPlay
                playsInline
                ref={remoteVideo}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
              />
              <div className="absolute top-4 left-4 text-white text-lg font-bold flex gap-2 items-center">
                <button
                  type="button"
                  className="md:hidden text-2xl text-white cursor-pointer"
                >
                  <FaBars />
                </button>
                {caller.name || "Caller"}
              </div>
              {/* Call Controls */}
              <div className="absolute bottom-4 w-full flex justify-center">
                <button
                  type="button"
                  className="bg-red-600 p-4 rounded-full text-white shadow-lg cursor-pointer"
                  onClick={handelendCall}
                >
                  <FaPhoneSlash size={24} />
                </button>
                {/* 🎤 Toggle Mic */}
                <button
                  type="button"
                  // onClick={toggleMic}
                  className={`p-4 rounded-full text-white shadow-lg cursor-pointer transition-colors ${
                    isMicOn ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {isMicOn ? (
                    <FaMicrophone size={24} />
                  ) : (
                    <FaMicrophoneSlash size={24} />
                  )}
                </button>

                {/* 📹 Toggle Video */}
                <button
                  type="button"
                  // onClick={toggleCam}
                  className={`p-4 rounded-full text-white shadow-lg cursor-pointer transition-colors ${
                    isCamOn ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {isCamOn ? <FaVideo size={24} /> : <FaVideoSlash size={24} />}
                </button>
              </div>
              )
            </div>
          )}

          <div className="absolute bottom-[75px] md:bottom-0 right-1 bg-gray-900 rounded-lg overflow-hidden shadow-lg ">
            <video
              ref={myVideo}
              autoPlay
              playsInline
              className="w-32 h-40 md:w-56 md:h-52 object-cover rounded-lg "
            />
          </div>
        </>
      )}
      {!displayVideo && !props.callAccepted && (
        <div className="p-2.5 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="size-10 rounded-full relative">
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt={selectedUser.name}
                  />
                </div>
              </div>
              <div>
                <h3 className="font-medium">{selectedUser.name}</h3>
                <p className="text-sm text-base-content/70">
                  {onlineUsers.includes(selectedUser._id)
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </div>
            <div>
              <button className="cursor-pointer mr-5" onClick={startCall}>
                <Video />
              </button>
              <button
                className="cursor-pointer"
                onClick={() => setSelectedUser(null)}
              >
                <X />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ChatHeader;
