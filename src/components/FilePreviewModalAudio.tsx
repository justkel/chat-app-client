import { CloseOutlined, SendOutlined } from "@ant-design/icons";
import ReactDOM from "react-dom";

type FilePreviewModalAudioProps = {
  selectedFile: File | null;
  onClose: () => void;
  onSend: () => void;
};

export const FilePreviewModalAudio: React.FC<FilePreviewModalAudioProps> = ({
  selectedFile,
  onClose,
  onSend,
}) => {
    if (!selectedFile) return null;
  return ReactDOM.createPortal (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-80 overflow-y-auto pt-32 pb-10 px-4 flex justify-center">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-1 right-2 text-red-600 text-xl z-10"
        >
          <CloseOutlined />
        </button>

        {/* Audio Preview Container */}
        <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 rounded-xl p-8 shadow-lg">
          <div className="w-full flex justify-center items-center mb-6">
            <div className="bg-white rounded-full shadow p-4">
              <i className="fa fa-music text-4xl text-purple-600"></i>
            </div>
          </div>

          <audio
            controls
            className="w-full rounded-md shadow-inner focus:outline-none"
            style={{ outline: "none" }}
          >
            <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
            Your browser does not support the audio element.
          </audio>

          <div className="mt-6 text-center">
            <p className="text-lg font-semibold">{selectedFile.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={(e) => {
              e.preventDefault();
              onSend();
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-blue-700 shadow-lg transition duration-200 ease-in-out"
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
