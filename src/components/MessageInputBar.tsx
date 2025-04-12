import React from "react";
import { Input, Modal, Button } from 'antd';

import {
  PlusOutlined,
  PictureOutlined,
  CameraOutlined,
  AudioOutlined,
  FileOutlined,
  CalendarOutlined,
  SendOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

interface MessageInputBarProps {
  newMessage: string;
  setNewMessage: (msg: string) => void;
  handleTyping: () => void;
  selectedImages: File[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isModalVisible: boolean;
  setIsModalVisible: (val: boolean) => void;
  triggerGalleryUpload: () => void;
  setIsEmojiPickerVisible: (val: boolean | ((prev: boolean) => boolean)) => void;
  sendMessage: () => void;
}

const MessageInputBar: React.FC<MessageInputBarProps> = ({
  newMessage,
  setNewMessage,
  handleTyping,
  selectedImages,
  fileInputRef,
  handleImageChange,
  isModalVisible,
  setIsModalVisible,
  triggerGalleryUpload,
  setIsEmojiPickerVisible,
  sendMessage,
}) => {
  return (
    <div className="flex items-center justify-between max-w-4xl mx-auto p-4 space-x-4">
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
        rows={2}
        disabled={selectedImages.length > 0}
      />

      <div className="relative">
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageChange}
        />

        <Button
          shape="circle"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          className="flex items-center justify-center shadow-md"
        />

        <Modal
          title={<span className="text-lg font-semibold">Choose upload method</span>}
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
              <span className="text-sm font-medium">Gallery</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-shadow shadow-sm hover:shadow-md">
              <div className="bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                <CameraOutlined className="text-xl" />
              </div>
              <span className="text-sm font-medium">Camera</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-shadow shadow-sm hover:shadow-md">
              <div className="bg-purple-100 text-purple-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                <AudioOutlined className="text-xl" />
              </div>
              <span className="text-sm font-medium">Audio</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-shadow shadow-sm hover:shadow-md">
              <div className="bg-yellow-100 text-yellow-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                <FileOutlined className="text-xl" />
              </div>
              <span className="text-sm font-medium">File</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-shadow shadow-sm hover:shadow-md col-span-2">
              <div className="bg-red-100 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                <CalendarOutlined className="text-xl" />
              </div>
              <span className="text-sm font-medium">Calendar</span>
            </div>
          </div>
        </Modal>
      </div>

      <button
        onClick={() => setIsEmojiPickerVisible((prev) => !prev)}
        className="flex items-center justify-center bg-gray-200 w-10 h-10 rounded-full hover:bg-gray-300 shadow-lg transition duration-200 ease-in-out"
      >
        <span role="img" aria-label="emoji" className="text-xl">😊</span>
      </button>

      {selectedImages.length === 0 && (
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 shadow-lg transition duration-200 ease-in-out"
          disabled={!newMessage.trim()}
        >
          <SendOutlined style={{ fontSize: '20px' }} />
          Send
        </button>
      )}
    </div>
  );
};

export default MessageInputBar;
