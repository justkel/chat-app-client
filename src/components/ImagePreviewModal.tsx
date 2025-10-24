import { ChangeEvent, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { CloseOutlined, LeftOutlined, RightOutlined, SendOutlined } from "@ant-design/icons";

type ImagePreviewModalProps = {
    selectedImages: File[];
    setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
    captions: string[];
    setCaptions: React.Dispatch<React.SetStateAction<string[]>>;
    onClose: () => void;
    onSend: () => void;
};

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    selectedImages,
    setSelectedImages,
    captions,
    setCaptions,
    onClose,
    onSend,
}) => {
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const removeImage = (index: number) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        const newCaptions = captions.filter((_, i) => i !== index);

        setSelectedImages(newImages);
        setCaptions(newCaptions);

        // Adjust active index if needed
        if (activeIndex >= newImages.length) {
            setActiveIndex(Math.max(0, newImages.length - 1));
        }
    };

    useEffect(() => {
        if (selectedImages.length === 0) {
            onClose();
        }
    }, [selectedImages, onClose]);

    const handleCaptionChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const newCaptions = [...captions];
        const caption = e.target.value;
        newCaptions[index] = caption.length <= 100 ? caption : caption.slice(0, 100);
        setCaptions(newCaptions);
    };

    const handleArrow = (dir: "left" | "right") => {
        setActiveIndex((prev) =>
            dir === "left"
                ? (prev - 1 + selectedImages.length) % selectedImages.length
                : (prev + 1) % selectedImages.length
        );
    };

    return ReactDOM.createPortal (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-80 overflow-y-auto pt-32 pb-10 px-4 flex justify-center">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-xl relative">

                <button
                    onClick={onClose}
                    className="absolute top-1 right-2 text-red-600 text-xl z-10"
                >
                    <CloseOutlined />
                </button>

                {/* Main Image Display */}
                <div className="relative flex items-center justify-center h-[300px] md:h-[400px] w-full bg-gray-100 rounded-xl overflow-hidden px-2">
                    {selectedImages.length > 0 && (
                        <img
                            src={URL.createObjectURL(selectedImages[activeIndex])}
                            alt={`preview-${activeIndex}`}
                            className="max-h-full max-w-full object-contain"
                        />
                    )}
                    {selectedImages.length > 1 && (
                        <>
                            <button
                                onClick={() => handleArrow("left")}
                                className="absolute left-2 p-2 bg-white bg-opacity-80 rounded-full"
                            >
                                <LeftOutlined />
                            </button>
                            <button
                                onClick={() => handleArrow("right")}
                                className="absolute right-2 p-2 bg-white bg-opacity-80 rounded-full"
                            >
                                <RightOutlined />
                            </button>
                        </>
                    )}
                </div>

                {/* Thumbnail Preview */}
                <div className="flex flex-wrap items-center gap-4 mt-20 overflow-x-auto px-1">
                    {selectedImages.map((image, index) => (
                        <div
                            key={index}
                            className="relative w-20 h-20 flex-shrink-0 border rounded-md overflow-hidden"
                        >
                            <img
                                src={URL.createObjectURL(image)}
                                alt={`preview-${index}`}
                                onClick={() => setActiveIndex(index)}
                                className={`w-full h-full object-cover cursor-pointer ${index === activeIndex ? "ring-2 ring-blue-500" : ""
                                    }`}
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-0 right-0 bg-white bg-opacity-90 p-1 rounded-bl"
                            >
                                <CloseOutlined className="text-xs text-red-600" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 mb-6">
                    <input
                        type="text"
                        placeholder="Enter caption (max 100 characters)"
                        value={captions[activeIndex] || ""}
                        onChange={(e) => handleCaptionChange(e, activeIndex)}
                        className="w-full border p-3 rounded-md"
                        maxLength={100}
                    />
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onSend();
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 shadow-lg transition duration-200 ease-in-out"
                    >
                        <SendOutlined style={{ fontSize: '20px' }} />
                        Send
                    </button>
                </div>

            </div>
        </div>, 
        document.body
    );
};
