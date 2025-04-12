import React from "react";

interface Message {
  id: string;
  content: string;
}

interface Props {
  isEditing: boolean;
  currentSelectedMessage: Message | null;
  editMessage: string | undefined;
  setEditMessage: (value: string) => void;
  setSelectedMessages: (value: string[]) => void;
  setIsEditing: (value: boolean) => void;
  handleEditMessage: () => void;
}

const EditMessageModal: React.FC<Props> = ({
  isEditing,
  currentSelectedMessage,
  editMessage,
  setEditMessage,
  setSelectedMessages,
  setIsEditing,
  handleEditMessage,
}) => {
  if (!isEditing || !currentSelectedMessage) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[95%] max-w-lg">
        <p className="text-gray-500 text-sm mb-3">Editing message...</p>

        <div className="bg-gray-100 p-4 rounded text-gray-700 mb-4 opacity-60 max-h-32 overflow-y-auto">
          {currentSelectedMessage.content.length > 100
            ? `${currentSelectedMessage.content.substring(0, 100)}...`
            : currentSelectedMessage.content}
        </div>

        <textarea
          value={
            editMessage !== undefined
              ? editMessage
              : currentSelectedMessage.content.trim()
          }
          onChange={(e) => setEditMessage(e.target.value)}
          className="w-full h-32 border border-gray-300 p-3 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={() => {
              setSelectedMessages([]);
              setIsEditing(false);
            }}
            className="text-gray-500 hover:text-red-500 text-lg"
          >
            ❌
          </button>

          <button
            className="text-green-500 hover:text-green-600 text-2xl disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={
              editMessage === "" ||
              !currentSelectedMessage.content.trim()
            }
            onClick={handleEditMessage}
          >
            ✔
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMessageModal;
