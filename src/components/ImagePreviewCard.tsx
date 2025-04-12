import React from "react";

interface ImagePreviewModalProps {
  selectedImageIndex: number | null;
  selectedImage: string | undefined;
  imageMessages: { caption?: string }[];
  goPrev: () => void;
  goNext: () => void;
  closeImage: () => void;
}

const ImagePreviewCard: React.FC<ImagePreviewModalProps> = ({
  selectedImageIndex,
  selectedImage,
  imageMessages,
  goPrev,
  goNext,
  closeImage,
}) => {
  if (selectedImageIndex === null) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="relative flex flex-col items-center space-y-4">
        <div className="relative flex items-center">
          {selectedImageIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-4 text-white text-4xl hover:scale-110 transition-transform"
            >
              ❮
            </button>
          )}

          <img
            src={selectedImage}
            alt="preview"
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
          />

          {selectedImageIndex < imageMessages.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-4 text-white text-4xl hover:scale-110 transition-transform"
            >
              ❯
            </button>
          )}

          <button
            onClick={closeImage}
            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200 transition"
          >
            ❌
          </button>
        </div>

        {imageMessages[selectedImageIndex]?.caption && (
          <p className="text-white text-center max-w-[90vw] px-4 text-lg">
            {imageMessages[selectedImageIndex].caption}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImagePreviewCard;
