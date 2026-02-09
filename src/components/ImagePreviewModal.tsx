/* eslint-disable jsx-a11y/alt-text */
import { ChangeEvent, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Avatar } from "antd";
import { useChatSettings } from "../hooks/useGetOtherUserContactDetails";

type ImagePreviewModalProps = {
  otherUserData: any;
  userId: string | null;
  otherUserId: string | null | undefined;
  selectedImages: File[];
  setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
  captions: string[];
  setCaptions: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  onSend: () => void;
};

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  otherUserData,
  userId,
  otherUserId,
  selectedImages,
  setSelectedImages,
  captions,
  setCaptions,
  onClose,
  onSend,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageURLs, setImageURLs] = useState<string[]>([]);

  useEffect(() => {
    const urls = selectedImages.map((img) => URL.createObjectURL(img));
    setImageURLs(urls);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedImages]);

  useEffect(() => {
    if (selectedImages.length === 0) {
      onClose();
    } else if (activeIndex >= selectedImages.length) {
      setActiveIndex(selectedImages.length - 1);
    }
  }, [selectedImages, onClose, activeIndex]);

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setCaptions((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((i) => Math.max(0, i - (i === index ? 1 : 0)));
  };

  const handleCaptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = [...captions];
    next[activeIndex] = e.target.value.slice(0, 100);
    setCaptions(next);
  };

  const navigate = (dir: "prev" | "next") => {
    setActiveIndex((i) =>
      dir === "prev"
        ? Math.max(0, i - 1)
        : Math.min(selectedImages.length - 1, i + 1)
    );
  };

  const { data: chatSettings } = useChatSettings(userId!, otherUserId!);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col">
      <div className="flex items-center gap-3">
        <Avatar
          src={`http://localhost:5002${otherUserData?.getOtherUserById?.profilePicture}`}
        />
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm">
            {chatSettings?.customUsername ||
              otherUserData?.getOtherUserById?.username}
          </span>
          <span className="text-xs opacity-60">File Preview</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm opacity-70">
          {selectedImages.length > 0 ? activeIndex + 1 : 0} /{" "}
          {selectedImages.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition"
        >
          <CloseOutlined />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {selectedImages.length > 1 && (
          <>
            <button
              onClick={() => navigate("prev")}
              disabled={activeIndex === 0}
              className="absolute left-3 md:left-6 p-3 rounded-full bg-black/40 hover:bg-black/70 disabled:opacity-30 transition"
            >
              <LeftOutlined />
            </button>
            <button
              onClick={() => navigate("next")}
              disabled={activeIndex === selectedImages.length - 1}
              className="absolute right-3 md:right-6 p-3 rounded-full bg-black/40 hover:bg-black/70 disabled:opacity-30 transition"
            >
              <RightOutlined />
            </button>
          </>
        )}

        {imageURLs[activeIndex] && (
          <img
            src={imageURLs[activeIndex]}
            alt="preview"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      <div className="flex gap-3 px-4 py-3 overflow-x-auto bg-black/40">
        {imageURLs.map((url, index) => (
          <div
            key={index}
            className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 cursor-pointer ${
              index === activeIndex ? "ring-2 ring-white" : "opacity-70"
            }`}
            onClick={() => setActiveIndex(index)}
          >
            {url && <img src={url} className="w-full h-full object-cover" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeImage(index);
              }}
              className="absolute top-0 right-0 bg-black/70 p-1 rounded-bl"
            >
              <CloseOutlined className="text-xs" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 px-4 py-4 bg-black/60">
        <input
          type="text"
          placeholder="Add a caption…"
          value={captions[activeIndex] || ""}
          onChange={handleCaptionChange}
          className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-white/30"
        />
        <button
          onClick={onSend}
          className="bg-blue-600 hover:bg-blue-700 transition rounded-full px-4 py-3 flex items-center gap-2"
        >
          <SendOutlined />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>,
    document.body
  );
};
