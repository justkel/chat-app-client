import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { CloseOutlined, SendOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { useChatSettings } from "../hooks/useGetOtherUserContactDetails";
import ReactDOM from "react-dom";

type FilePreviewModalProps = {
  otherUserData: any;
  userId: string | null;
  otherUserId: string | null | undefined;
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  caption: string;
  setCaption: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSend: () => void;
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  otherUserData,
  userId,
  otherUserId,
  selectedFile,
  setSelectedFile,
  caption,
  setCaption,
  onClose,
  onSend,
}) => {
  const [textPreview, setTextPreview] = useState<string>("");

  useEffect(() => {
    if (!selectedFile) onClose();
  }, [selectedFile, onClose]);

  const handleCaptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCaption(e.target.value.slice(0, 100));
  };

  const { data: chatSettings } = useChatSettings(userId!, otherUserId!);

  const fileUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedFile) return;

    if (selectedFile.type.startsWith("text/")) {
      const reader = new FileReader();
      reader.onload = () => setTextPreview(reader.result as string);
      reader.readAsText(selectedFile);
    }

    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [selectedFile, fileUrl]);

  const renderPreview = () => {
    if (!selectedFile || !fileUrl) return null;

    if (selectedFile.type === "application/pdf") {
      return (
        <iframe
          src={fileUrl}
          title="PDF Preview"
          className="w-full h-[70vh] rounded-lg bg-white"
        />
      );
    }

    if (selectedFile.type.startsWith("text/")) {
      return (
        <pre className="w-full max-h-[70vh] overflow-auto bg-white text-black p-4 rounded-lg text-sm">
          {textPreview}
        </pre>
      );
    }

    return (
      <div className="text-center text-gray-600">
        <p className="font-semibold">{selectedFile.name}</p>
        <p className="text-sm mt-1">
          {(selectedFile.size / 1024).toFixed(2)} KB
        </p>
        <p className="text-xs mt-2 opacity-70">
          Preview not available for this file type
        </p>
      </div>
    );
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
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

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition"
        >
          <CloseOutlined />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <div className="w-full max-w-3xl bg-gray-100 rounded-xl p-4 shadow-lg flex justify-center">
          {renderPreview()}
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-4 bg-black/60">
        <input
          type="text"
          placeholder="Add a caption…"
          value={caption}
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
