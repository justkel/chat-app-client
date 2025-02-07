import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, MoreOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { useChatSettings } from '../hooks/useGetOtherUserContactDetails';
import { Button } from "antd";
import { PhoneOutlined, CloseOutlined } from "@ant-design/icons";

interface HeaderWithInlineCardProps {
  otherUserData: any;
  userId: string | null;
  otherUserId: string | null | undefined;
  socket: any;
}

const HeaderWithInlineCard: React.FC<HeaderWithInlineCardProps> = ({ otherUserData, userId, otherUserId, socket }) => {
  const [showCard, setShowCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: chatSettings } = useChatSettings(userId!, otherUserId!);
  const navigate = useNavigate();

  const toggleCard = () => setShowCard((prev) => !prev);

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleViewContact = () => {
    if (userId && otherUserId) {
      navigate(`/view-contact/${userId}/${otherUserId}`);
    }
  };

  const handleViewWallPaper = () => {
    if (userId && otherUserId) {
      navigate(`/view-wallpaper/${userId}/${otherUserId}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowCard(false);
      }
    };

    if (showCard) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCard]);

  const [calling, setCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Listening for incoming call
    socket.on("incomingCall", (data: { callerId: string | null }) => {
      if (data.callerId !== userId) {
        console.log("📞 Incoming call from:", data.callerId);
        setIncomingCall(true);
        setRemoteUserId(data.callerId);
      }
    });

    socket.on('offer', async (data: { callerId: string | null; offer: RTCSessionDescriptionInit; }) => {
      if (data.callerId !== userId) {
        const pc = createPeerConnection();
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          // const answer = await pc.createAnswer();
          // await pc.setLocalDescription(answer);
          // Emit the answer to the remote peer
          setPeerConnection(pc);
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      }
    });


    // Listening for the call acceptance (answer)
    socket.on("callAccepted", async (data: { answer: RTCSessionDescriptionInit; callerId: string | null }) => {
      if (userId === data.callerId) {
        if (peerConnection) {
          try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          } catch (err) {
            console.error("❌ Error setting remote description:", err);
          }
        }
      }

    });

    // Handling ICE candidates
    socket.on("receiveIceCandidate", async (data: { candidate: RTCIceCandidateInit | undefined }) => {
      if (peerConnection && data.candidate) {
        try {
          console.log('PCPC', peerConnection);
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    // Handling call termination
    socket.on("terminateCall", () => {
      if (peerConnection) peerConnection.close();
      setCalling(false);
      setIncomingCall(false);
      setRemoteUserId(null);
    });

    return () => {
      socket.off("incomingCall");
      socket.off("offer");
      socket.off("callAccepted");
      socket.off("receiveIceCandidate");
      socket.off("terminateCall");
    };
  }, [userId, peerConnection]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && otherUserId) {
        socket.emit("sendIceCandidate", { candidate: event.candidate, receiverId: otherUserId, userId });
      }
    };

    pc.ontrack = (event) => {
      console.log(`📡 Received track: Kind = ${event.track.kind}, ReadyState = ${event.track.readyState}`);

      if (event.streams.length > 0) {
        console.log('📡 Remote event: ', event);

        if (event.track.kind === 'video') {
          console.log('📡 VIDEO: ', event.track);
          if (remoteVideoRef.current) {
            console.log('📡 RVR: ', remoteVideoRef);
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      } else {
        console.warn("⚠️ No stream received with the track");
      }
    };


    return pc;
  };

  const startCall = async () => {
    setCalling(true);
    setRemoteUserId(otherUserId!);

    const pc = createPeerConnection();
    localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    console.log("✅ Stream acquired:", localStream.current);

    // Log available tracks before adding them
    localStream.current.getTracks().forEach((track) => {
      console.log(`🎧 Adding track to peer connection: Kind = ${track.kind}`);
      pc.addTrack(track, localStream.current!);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("📡 Offer created and set as local description:", offer);

    socket.emit("initiateCall", { callerId: userId, receiverId: otherUserId, offer });
    console.log("📡 Call initiation event sent!");

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
  };

  const acceptCall = async () => {
    setIncomingCall(false);

    if (!peerConnection) {
      console.log("❌ No peer connection available!");
      return;
    }

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("✅ Video stream acquired!:", localStream.current);

      // Log available tracks before adding them
      localStream.current.getTracks().forEach((track) => {
        console.log(`📷 Adding track to peer connection: Kind = ${track.kind}`);
        peerConnection.addTrack(track, localStream.current!);
      });

      // Log current signaling state
      const signalingState = peerConnection.signalingState;

      if (signalingState === "have-remote-offer" || signalingState === "have-local-pranswer") {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log("✅ Answer created and set as local description:", answer);

        socket.emit("answerCall", { callerId: remoteUserId, answer, userId });
        console.log("📡 Answer sent to caller!");

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }

      } else {
        console.error(
          "❌ The peer connection is not in the correct state to create an answer. Signaling state:",
          signalingState
        );
      }
    } catch (error) {
      console.error("❌ Error accepting call:", error);
    }
  };


  const endCall = () => {
    if (peerConnection) peerConnection.close();
    socket.emit("terminateCall", { receiverId: remoteUserId });
    setCalling(false);
    setIncomingCall(false);
    setRemoteUserId(null);
  };


  return (
    <div>
      <div className="flex flex-col items-center">
        <div className="flex">
          <video ref={localVideoRef} autoPlay playsInline className="w-1/2 border" />
          <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 border" />
        </div>
        {!calling && !incomingCall && <button onClick={startCall} className="mt-4 bg-blue-500 text-white px-4 py-2">Start Call</button>}
        {incomingCall && <button onClick={acceptCall} className="mt-4 bg-green-500 text-white px-4 py-2">Accept Call</button>}
        {calling && <button onClick={endCall} className="mt-4 bg-red-500 text-white px-4 py-2">End Call</button>}
      </div>
      {/* <div className="bg-white p-4 shadow-md flex items-center justify-between fixed top-0 left-0 z-10 w-full overflow-hidden">
        <div className="flex items-center space-x-4">
          <ArrowLeftOutlined onClick={handleBackNavigation} className="text-xl cursor-pointer" />
          <Avatar src={`http://localhost:5002${otherUserData?.getOtherUserById?.profilePicture}`} />
          <div className="flex flex-col">
            <span className="font-semibold">{chatSettings?.customUsername || otherUserData?.getOtherUserById?.username}</span>
            <span className={`text-sm ${otherUserData?.getOtherUserById?.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
              {otherUserData?.getOtherUserById?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div>
          <MoreOutlined className="text-3xl cursor-pointer" onClick={toggleCard} />
        </div>
      </div> */}

      {showCard && (
        <div
          ref={cardRef}
          className="absolute top-44 right-4 bg-white shadow-md rounded-lg p-4 z-20 w-48"
        >
          <ul className="space-y-8">
            <li className="cursor-pointer hover:text-blue-500" onClick={handleViewContact}>
              View Contact
            </li>
            <li className="cursor-pointer hover:text-blue-500">Search</li>
            <li className="cursor-pointer hover:text-blue-500">Media</li>
            <li className="cursor-pointer hover:text-blue-500" onClick={handleViewWallPaper}>
              Wallpaper
            </li>
            <li className="cursor-pointer hover:text-blue-500">Block</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default HeaderWithInlineCard;
