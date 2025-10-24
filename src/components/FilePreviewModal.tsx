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
  const handleCaptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCaption(e.target.value.length <= 100 ? e.target.value : e.target.value.slice(0, 100));
  };

  useEffect(() => {
    if (!selectedFile) {
      onClose();
    }
  }, [selectedFile, onClose]);

  return ReactDOM.createPortal (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-80 overflow-y-auto pt-32 pb-10 px-4 flex justify-center">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-1 right-2 text-red-600 text-xl z-10"
        >
          <CloseOutlined />
        </button>

        {/* Main File Display */}
        <div className="relative flex items-center justify-center h-[300px] md:h-[400px] w-full bg-gray-100 rounded-xl overflow-hidden px-2 shadow-lg">
          {selectedFile && (
            <div className="w-full text-center">
              {/* Display file icon based on type */}
              <div className="flex justify-center items-center text-6xl text-red-600 mb-4">
                <i className="fa fa-file-pdf"></i>
              </div>
              <p className="text-lg font-semibold">{selectedFile?.name}</p>
              <p className="text-sm text-gray-600 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>

        <div className="mt-32 mb-6">
          <input
            type="text"
            placeholder="Enter caption (max 100 characters)"
            value={caption}
            onChange={handleCaptionChange}
            className="w-full border p-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              onSend();
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 shadow-lg transition duration-200 ease-in-out"
          >
            <SendOutlined style={{ fontSize: "20px" }} />
            Send
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
