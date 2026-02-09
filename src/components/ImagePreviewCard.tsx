import React from "react";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

interface ImagePreviewModalProps {
  selectedImageIndex: number | null;
  imageMessages: { content?: string; caption?: string }[];
  goPrev: () => void;
  goNext: () => void;
  closeImage: () => void;
}

const ImagePreviewCard: React.FC<ImagePreviewModalProps> = ({
  selectedImageIndex,
  imageMessages,
  goPrev,
  goNext,
  closeImage,
}) => {
  if (selectedImageIndex === null) return null;

  const currentImage = imageMessages[selectedImageIndex]?.content;
  const caption = imageMessages[selectedImageIndex]?.caption;

  if (!currentImage) return null;

  const imageUrl = `http://localhost:5002${currentImage}`;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <button
        onClick={closeImage}
        className="
          absolute top-[86px] right-4 z-[10000]
          w-9 h-9 rounded-full
          bg-red-600 hover:bg-red-700
          text-white text-2xl
          shadow-2xl ring-2 ring-white/50
          flex items-center justify-center
          transition-transform hover:scale-110
        "
        aria-label="Close preview"
      >
        <CloseOutlined />
      </button>

      {selectedImageIndex !== null && selectedImageIndex > 0 && (
        <button
          onClick={goPrev}
          className="
            absolute left-4 md:left-8 z-[10000]
            p-4 rounded-full
            bg-black/60 hover:bg-black/80
            text-white text-3xl
            shadow-lg
            transition
            flex items-center justify-center
          "
        >
          <LeftOutlined />
        </button>
      )}

      <div
        className="
          w-[90vw] max-w-[720px]
          h-[60vh] max-h-[480px]
          bg-black/20
          rounded-2xl
          flex items-center justify-center
          overflow-hidden
          shadow-2xl
        "
      >
        <img
          src={imageUrl}
          alt="preview"
          className="w-full h-full object-contain select-none"
        />
      </div>

      {selectedImageIndex !== null &&
        selectedImageIndex < imageMessages.length - 1 && (
          <button
            onClick={goNext}
            className="
              absolute right-4 md:right-8 z-[10000]
              p-4 rounded-full
              bg-black/60 hover:bg-black/80
              text-white text-3xl
              shadow-lg
              transition
              flex items-center justify-center
            "
          >
            <RightOutlined />
          </button>
        )}

      {caption && (
        <div className="absolute bottom-4 left-4 right-4 z-[10000] bg-black/70 px-4 py-2 rounded-lg">
          <p className="text-white text-center text-sm md:text-base max-w-3xl mx-auto truncate">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewCard;
