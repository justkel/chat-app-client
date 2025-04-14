import React from "react";

interface DeleteMessageModalProps {
  show: boolean;
  selectedCount: number;
  canDeleteForEveryone: boolean;
  onClose: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
}

const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  show,
  selectedCount,
  canDeleteForEveryone,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-1/3 rounded-lg shadow-lg p-6 relative">
        <h4 className="text-lg font-bold">
          Delete {selectedCount} Message{selectedCount > 1 ? "s" : ""}
        </h4>

        <div className="mt-6 text-right">
          <button
            className="block w-full text-left text-red-500 py-2 px-4 hover:bg-gray-100 rounded"
            onClick={onDeleteForMe}
          >
            Delete for me
          </button>

          {canDeleteForEveryone && (
            <button
              className="block w-full text-left text-red-500 py-2 px-4 hover:bg-gray-100 rounded"
              onClick={onDeleteForEveryone}
            >
              Delete for everyone
            </button>
          )}

          <button
            className="block w-full text-left text-gray-600 py-2 px-4 hover:bg-gray-100 rounded mt-4"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
