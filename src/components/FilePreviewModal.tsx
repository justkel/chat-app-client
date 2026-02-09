import { ChangeEvent, useEffect } from "react";
import { CloseOutlined, SendOutlined } from "@ant-design/icons";
import ReactDOM from "react-dom";

type FilePreviewModalProps = {
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  caption: string;
  setCaption: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSend: () => void;
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  selectedFile,
  setSelectedFile,
  caption,
  setCaption,
  onClose,
  onSend,
}) => {
  useEffect(() => {
    if (!selectedFile) {
      onClose();
    }
  }, [selectedFile, onClose]);

  const handleCaptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCaption(e.target.value.slice(0, 100));
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm opacity-70">File Preview</span>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition"
        >
          <CloseOutlined />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4">
        {selectedFile && (
          <div className="w-full max-w-2xl flex flex-col items-center justify-center bg-gray-100 rounded-xl p-6 shadow-lg">
            <div className="flex justify-center items-center text-6xl text-red-600 mb-4">
              <i
                className={`fa ${
                  selectedFile.type.includes("pdf") ? "fa-file-pdf" : "fa-file"
                }`}
              ></i>
            </div>
            <p className="text-lg font-semibold text-black">{selectedFile.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}
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
