import React, { useEffect, useRef, useState } from "react";
import { Input, Modal, Button } from 'antd';
import {
    PlusOutlined,
    PictureOutlined,
    CameraOutlined,
    AudioOutlined,
    FileOutlined,
    SendOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

interface MessageInputBarProps {
    newMessage: string;
    setNewMessage: (msg: string) => void;
    handleTyping: () => void;
    selectedImages: File[];
    fileInputRef: React.RefObject<HTMLInputElement>;
    cameraInputRef: React.RefObject<HTMLInputElement>;
    actualFileInputRef: React.RefObject<HTMLInputElement>;
    audioInputRef: React.RefObject<HTMLInputElement>;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAudioChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isModalVisible: boolean;
    isOtherUserBlocked: boolean;
    setIsModalVisible: (val: boolean) => void;
    triggerGalleryUpload: () => void;
    triggerFileUpload: () => void;
    triggerCamera: () => void;
    triggerAudioUpload: () => void;
    setIsEmojiPickerVisible: (val: boolean | ((prev: boolean) => boolean)) => void;
    sendMessage: () => void;
}

const MessageInputBar: React.FC<MessageInputBarProps> = ({
    newMessage,
    setNewMessage,
    handleTyping,
    selectedImages,
    fileInputRef,
    cameraInputRef,
    actualFileInputRef,
    audioInputRef,
    handleImageChange,
    handleFileChange,
    handleAudioChange,
    isModalVisible,
    isOtherUserBlocked,
    setIsModalVisible,
    triggerGalleryUpload,
    triggerFileUpload,
    triggerCamera,
    triggerAudioUpload,
    setIsEmojiPickerVisible,
    sendMessage,
}) => {
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);


    useEffect(() => {
        if (isCameraModalOpen) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((mediaStream) => {
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;

                        // Wait for the video metadata to load before playing
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play().catch((err) => {
                                console.warn('Play was interrupted:', err);
                            });
                        };
                    }
                })
                .catch(console.error);
        }

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCameraModalOpen]);

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

                const fakeEvent = {
                    target: { files: [file] },
                } as unknown as React.ChangeEvent<HTMLInputElement>;

                handleImageChange(fakeEvent);
                setIsCameraModalOpen(false);

                // Stop the camera stream manually
                stream?.getTracks().forEach(track => track.stop());
                setStream(null); // Optional: reset stream state
            }
        }, 'image/jpeg');
    };

    const openCameraModal = () => {
        setIsCameraModalOpen(true);
        setIsModalVisible(false);
    };

    const toggleRecording = async () => {
        if (isRecording) {
            stopRecording();
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                setMediaRecorder(recorder);
                audioChunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    audioChunksRef.current.push(e.data);
                };

                recorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });

                    const fakeEvent = {
                        target: { files: [audioFile] },
                    } as unknown as React.ChangeEvent<HTMLInputElement>;

                    handleAudioChange(fakeEvent);
                };

                recorder.start();
                setIsRecording(true);
            } catch (error) {
                console.error("Failed to start recording:", error);
            }
        }
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setIsRecording(false);
    };


    return (
        <div className="flex items-center justify-between max-w-xl p-4 ml-10 sm:ml-20 lg:ml-0 xl:ml-52 space-x-4">
            {!isOtherUserBlocked && (
                <TextArea
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                    }}
                    placeholder={
                        selectedImages.length > 0
                            ? "Remove image(s) to type a message..."
                            : "Type your message..."
                    }
                    aria-label="Message Input"
                    className="flex-grow resize-none rounded-lg border border-gray-300 bg-white p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-60"
                    rows={1}
                    disabled={selectedImages.length > 0}
                />
            )}

            {!isOtherUserBlocked && (
                <div className="flex items-center gap-2 shrink-0">

                    <Button
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                        className="!flex !items-center !justify-center border-none hover:bg-gray-100"
                    />

                    <button
                        onClick={() => setIsEmojiPickerVisible((prev: boolean) => !prev)}
                        className="text-xl hover:bg-gray-100 p-2 rounded-full transition"
                    >
                        😊
                    </button>

                    <button
                        onClick={toggleRecording}
                        className={`p-2 rounded-full transition lg:text-2xl ${isRecording ? "bg-red-100 text-red-600" : "hover:bg-gray-100"
                            }`}
                    >
                        <AudioOutlined />
                    </button>

                    {selectedImages.length === 0 && (
                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                            className={`flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-full text-sm md:text-base font-medium transition shadow-sm ${newMessage.trim()
                                ? "hover:bg-green-600 active:scale-95"
                                : "opacity-40 cursor-not-allowed"
                                }`}
                        >
                            <SendOutlined />
                            Send
                        </button>
                    )}

                </div>
            )}

            <div className="relative">
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageChange}
                />

                <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    ref={actualFileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                <input
                    type="file"
                    accept="audio/*"
                    style={{ display: 'none' }}
                    ref={audioInputRef}
                    onChange={handleAudioChange}
                />

                <Modal
                    title={<span className="text-lg font-semibold font-montserrat">Choose upload method</span>}
                    open={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}
                    centered
                    width={360}
                    styles={{ body: { padding: '1.5rem' } }}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={triggerGalleryUpload}
                            className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-shadow shadow-sm hover:shadow-md"
                        >
                            <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                                <PictureOutlined className="text-xl" />
                            </div>
                            <span className="text-sm font-medium font-montserrat">Gallery</span>
                        </div>

                        <div onClick={openCameraModal} className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-shadow shadow-sm hover:shadow-md">
                            <div className="bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                                <CameraOutlined className="text-xl" />
                            </div>
                            <span className="text-sm font-medium font-montserrat">Camera</span>
                        </div>

                        <div onClick={triggerAudioUpload} className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-shadow shadow-sm hover:shadow-md">
                            <div className="bg-purple-100 text-purple-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                                <AudioOutlined className="text-xl" />
                            </div>
                            <span className="text-sm font-medium font-montserrat">Audio</span>
                        </div>

                        <div onClick={triggerFileUpload} className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-shadow shadow-sm hover:shadow-md">
                            <div className="bg-yellow-100 text-yellow-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                                <FileOutlined className="text-xl" />
                            </div>
                            <span className="text-sm font-medium font-montserrat">File</span>
                        </div>

                        {/* <div className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-shadow shadow-sm hover:shadow-md col-span-2">
                            <div className="bg-red-100 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                                <CalendarOutlined className="text-xl" />
                            </div>
                            <span className="text-sm font-medium">Calendar</span>
                        </div> */}
                    </div>
                </Modal>

                <Modal
                    open={isCameraModalOpen}
                    onCancel={() => setIsCameraModalOpen(false)}
                    footer={null}
                    centered
                    width={600}
                >
                    <div className="flex flex-col items-center gap-4">
                        <video ref={videoRef} className="rounded-lg w-full max-h-[400px]" />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <Button
                            type="primary"
                            onClick={capturePhoto}
                            className="font-montserrat"
                        >
                            Capture Photo
                        </Button>

                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default MessageInputBar;
