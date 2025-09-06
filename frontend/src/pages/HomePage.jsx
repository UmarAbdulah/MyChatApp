import React, { useEffect, useState, useRef } from "react";
import SideBar from "../components/SideBar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { useChatStore } from "../store/useChatStore";
import {
  FaPhoneAlt,
  FaPhoneSlash,
  FaBars,
  FaMicrophone,
  FaVideo,
} from "react-icons/fa";
import Peer from "simple-peer";

const HomePage = () => {
  const {
    selectedUser,
    callrecive,
    caller,
    recivingCall,
    callRejected,
    stream,
    callerSignal,
    answertheCall,
    callRejectToUser,
    callAcceptedByUser,
    endCallByUser,
    endCall,
    endCallOnBothSides,
    callEnded,
  } = useChatStore();

  // Refs
  const connectionRef = useRef(null); // simple-peer instance
  const remoteVideo = useRef(null); // remote video element
  const myVideo = useRef(null); // local video element

  const [callAccepted, setCallAccepted] = useState(false);
  const [isMicOn, setisMicOn] = useState(true);
  const [isCamOn, setisCamOn] = useState(true);

  // Attach local stream to myVideo whenever stream changes
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
    endCallByUser(remoteVideo, myVideo, connectionRef, null, setCallAccepted);
  }, [callEnded]);

  // Set up socket listeners once (and cleanup)
  useEffect(() => {
    const cleanupIncoming = callrecive(); // returns a cleanup
    const cleanupReject = callRejectToUser(); // now returns a cleanup

    // IMPORTANT: when we are the caller, and the callee accepts,
    // we must feed the callee's answer signal into our peer:
    // const cleanupAccepted = callAcceptedByUser((data) => {
    //   // data: { signal, from }
    //   if (connectionRef.current) {
    //     connectionRef.current.signal(data.signal);
    //   }
    // });

    return () => {
      cleanupIncoming?.();
      cleanupReject?.();
    };
  }, [callrecive, callRejectToUser]);

  // useEffect(() => {

  // }, [endCallByUser]);

  const handelrejectCall = () => {
    setCallAccepted(false);
    callRejected();
    // Optionally: stop local tracks if any
    if (stream) stream.getTracks().forEach((t) => t.stop());
    connectionRef.current?.destroy?.();
    connectionRef.current = null;
  };

  const handleAcceptCall = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Store + local preview
      useChatStore.setState({ stream: currentStream });
      setCallAccepted(true);
      useChatStore.setState({ recievingCall: false }); // keep your existing spelling

      // Create answering peer
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
      });

      connectionRef.current = peer;

      peer.on("signal", (data) => {
        // Send our ANSWER back to the caller
        answertheCall(data);
      });

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
        console.error("Peer error:", err);
      });

      // Feed the caller's OFFER into our peer to generate an ANSWER
      if (callerSignal) {
        peer.signal(callerSignal);
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      alert("Failed to access camera/microphone. Please check permissions.");
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
    setCallAccepted(false);
  };
  const handelendCall = () => {
    endCall();
    endCallCleanUP();
  };

  return (
    <>
      {callAccepted && (
        <>
          <div className="relative w-full h-screen bg-black items-center justify-center">
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
                onClick={() => setIsSidebarOpen(true)}
              >
                <FaBars />
              </button>
            </div>
            {/* Call Controls */}
            <div className="absolute bottom-4 w-full flex justify-center gap-4">
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
          <div className="absolute bottom-[75px] md:bottom-0 right-1 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={myVideo}
              autoPlay
              playsInline
              className="w-32 h-40 md:w-56 md:h-52 object-cover rounded-lg"
            />
          </div>
        </>
      )}

      {recivingCall && !callAccepted && (
        <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl mb-2">Call From...</p>
              <img
                src={caller?.profilePic || "/avatar.png"}
                alt="Caller"
                className="w-20 h-20 rounded-full border-4 border-green-500"
              />
              <h3 className="text-lg font-bold mt-3">{caller?.name}</h3>
              <p className="text-sm text-gray-500">{caller?.email}</p>
              <div className="flex gap-4 mt-5">
                <button
                  type="button"
                  onClick={handleAcceptCall}
                  className="bg-green-500 text-white px-4 py-1 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Accept <FaPhoneAlt />
                </button>
                <button
                  type="button"
                  onClick={handelrejectCall}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Reject <FaPhoneSlash />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {!callAccepted && (
        <div className="h-screen bg-base-200">
          <div className="flex items-center justify-center pt-20 px-4">
            <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-6xl h-[calc(100vh-8rem)]">
              <div className="flex h-full rounded-lg overflow-hidden">
                <SideBar />
                {!selectedUser ? (
                  <NoChatSelected />
                ) : (
                  <ChatContainer
                    callAccepted={callAccepted}
                    setCallAccepted={setCallAccepted}
                    onAcceptCall={handleAcceptCall}
                    refs={{ connectionRef, remoteVideo, myVideo }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomePage;
