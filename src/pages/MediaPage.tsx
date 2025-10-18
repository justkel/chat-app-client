'use client';
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Spin, Tooltip, Modal, message, Tag } from 'antd';
import {
  DownloadOutlined,
  FileOutlined,
  PlayCircleFilled,
  PauseCircleFilled,
  MessageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileZipOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useGetMediaBetweenUsers } from '../hooks/useGetMediaBetweenUsers';
import {
  CHAT_UPLOAD_AUDIO_PREFIX,
  CHAT_UPLOAD_FILE_PREFIX,
  CHAT_UPLOAD_PREFIX,
} from '../utilss/types';
import '../index.css';

const getFileIcon = (fileName: string) => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return <FilePdfOutlined className="text-red-500 text-3xl" />;
  if (['doc', 'docx'].includes(ext)) return <FileWordOutlined className="text-blue-500 text-3xl" />;
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return <FileExcelOutlined className="text-green-500 text-3xl" />;
  if (['zip', 'rar'].includes(ext)) return <FileZipOutlined className="text-yellow-500 text-3xl" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext))
    return <FileImageOutlined className="text-purple-500 text-3xl" />;
  return <FileOutlined className="text-gray-500 text-3xl" />;
};

const MediaPage: React.FC = () => {
  const { userId, otherUserId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useGetMediaBetweenUsers(userId!, otherUserId!);
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string } | null>(
    null
  );
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  if (loading)
    return (
      <div className="flex justify-center mt-20 font-montserrat">
        <Spin size="default" />
      </div>
    );

  if (error) {
    console.error(error);
    return (
      <div className="text-center mt-10 text-red-500 font-semibold font-montserrat">
        Failed to load media.
      </div>
    );
  }

  const handleGoToMessage = (messageId: string) => {
    navigate(`/chats`, {
      state: { scrollToMessageId: messageId },
    });
  };

  const allMessages = data?.getMediaBetweenUsers || [];
  const sortByTimestampAsc = (a: any, b: any) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();

  const images = allMessages
    .filter((msg: any) => msg.content?.startsWith(CHAT_UPLOAD_PREFIX))
    .sort(sortByTimestampAsc);
  const audios = allMessages
    .filter((msg: any) => msg.content?.startsWith(CHAT_UPLOAD_AUDIO_PREFIX))
    .sort(sortByTimestampAsc);
  const files = allMessages
    .filter((msg: any) => msg.content?.startsWith(CHAT_UPLOAD_FILE_PREFIX))
    .sort(sortByTimestampAsc);

  const handleDownload = (fileUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = `http://localhost:5002${fileUrl}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success({
        content: 'Download started',
        className: 'font-montserrat',
      });
    } catch (err) {
      message.error({
        content: 'Download failed',
        className: 'font-montserrat',
      });
      console.error(err);
    }
  };

  const truncate = (text: string, maxLength = 10) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '…' : text;
  };

  // Audio Controls
  const togglePlay = (id: string) => {
    const currentRef = audioRefs.current[id];

    if (currentAudio && currentAudio !== id && audioRefs.current[currentAudio]) {
      audioRefs.current[currentAudio]?.pause();
      audioRefs.current[currentAudio]!.currentTime = 0;
      setProgress((prev) => ({ ...prev, [currentAudio]: 0 }));
    }

    if (currentRef?.paused) {
      currentRef?.play();
      setCurrentAudio(id);
    } else {
      currentRef?.pause();
      setCurrentAudio(null);
    }
  };

  const handleTimeUpdate = (id: string) => {
    const audio = audioRefs.current[id];
    if (audio) {
      const percent = (audio.currentTime / audio.duration) * 100;
      setProgress((prev) => ({ ...prev, [id]: percent }));
    }
  };

  const getFileTag = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toUpperCase();
    return <Tag color="blue">{ext}</Tag>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8 font-montserrat">
      <div className="flex items-center mb-8">
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 text-blue-600 font-semibold text-lg hover:text-blue-700 transition-all"
        >
          <ArrowLeftOutlined className="text-2xl" />
          <span className="hidden sm:inline">Back</span>
        </motion.button>
        <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-600 flex-1">
          Shared Media
        </h1>
      </div>

      <div className="bg-white shadow-lg rounded-2xl p-4 md:p-6 border border-gray-200">
        <Tabs
          defaultActiveKey="1"
          centered
          className="text-lg font-semibold font-montserrat"
          items={[
            {
              key: '1',
              label: 'Images',
              children: (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500">No images found</p>
                  ) : (
                    images.map((msg: any) => (
                      <motion.div
                        key={msg.id}
                        whileHover={{ scale: 1.05 }}
                        className="relative group cursor-pointer transition-all duration-200"
                      >
                        <img
                          src={`http://localhost:5002${msg.content}`}
                          alt={msg.caption || 'Shared Image'}
                          className="rounded-xl w-full h-40 object-cover shadow-md hover:shadow-lg"
                          onClick={() =>
                            setSelectedImage({
                              url: `http://localhost:5002${msg.content}`,
                              caption: msg.caption,
                            })
                          }
                        />
                        {msg.caption && (
                          <p className="absolute bottom-1 left-2 text-white text-xs bg-black/60 px-2 py-0.5 rounded-full truncate">
                            {truncate(msg.caption)}
                          </p>
                        )}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Tooltip title="Go to message" className="font-montserrat">
                            <MessageOutlined
                              className="text-white bg-green-600 p-1.5 rounded-full cursor-pointer hover:scale-110 transition-transform duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGoToMessage(msg.id);
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="Download">
                            <DownloadOutlined
                              className="text-white bg-blue-600 p-1.5 rounded-full cursor-pointer hover:scale-110 transition-transform duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(msg.content, msg.fileOriginalName || 'image.jpg');
                              }}
                            />
                          </Tooltip>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              ),
            },
            {
              key: '2',
              label: 'Audios',
              children: (
                <div className="flex flex-col gap-4">
                  {audios.length === 0 ? (
                    <p className="text-center text-gray-500">No audios found</p>
                  ) : (
                    audios.map((msg: any) => (
                      <motion.div
                        key={msg.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => togglePlay(msg.id)}
                              className="focus:outline-none"
                            >
                              {currentAudio === msg.id && !audioRefs.current[msg.id]?.paused ? (
                                <PauseCircleFilled className="text-blue-600 text-4xl hover:text-blue-700 transition-all duration-200" />
                              ) : (
                                <PlayCircleFilled className="text-blue-600 text-4xl hover:text-blue-700 transition-all duration-200" />
                              )}
                            </button>
                            <div>
                              <p className="text-sm sm:text-base font-medium text-gray-700">
                                {msg.fileOriginalName || 'Audio message'}
                              </p>
                              <div className="w-48 sm:w-64 md:w-80 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-200"
                                  style={{ width: `${progress[msg.id] || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Tooltip title="Go to message">
                              <MessageOutlined
                                className="text-green-600 text-xl cursor-pointer hover:scale-110 transition-transform duration-200"
                                onClick={() => handleGoToMessage(msg.id)}
                              />
                            </Tooltip>
                            <Tooltip title="Download">
                              <DownloadOutlined
                                className="text-blue-600 text-xl cursor-pointer hover:scale-110 transition-transform duration-200"
                                onClick={() =>
                                  handleDownload(msg.content, msg.fileOriginalName || 'audio.mp3')
                                }
                              />
                            </Tooltip>
                          </div>
                        </div>
                        <audio
                          ref={(el) => (audioRefs.current[msg.id] = el)}
                          src={`http://localhost:5002${msg.content}`}
                          onTimeUpdate={() => handleTimeUpdate(msg.id)}
                          onEnded={() => {
                            setCurrentAudio(null);
                            setProgress((prev) => ({ ...prev, [msg.id]: 0 }));
                          }}
                          className="hidden"
                        />
                      </motion.div>
                    ))
                  )}
                </div>
              ),
            },
            {
              key: '3',
              label: 'Files',
              children: (
                <div className="grid gap-4 md:grid-cols-2">
                  {files.length === 0 ? (
                    <p className="text-center text-gray-500">No files found</p>
                  ) : (
                    files.map((msg: any) => {
                      const fileName = msg.fileOriginalName || 'File';
                      return (
                        <motion.div
                          key={msg.id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-4">
                            {getFileIcon(fileName)}
                            <div className="flex flex-col">
                              <span className="text-gray-800 font-semibold truncate max-w-[150px] sm:max-w-[250px]">
                                {truncate(fileName, 25)}
                              </span>
                              {getFileTag(fileName)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Tooltip title="Preview">
                              <FileOutlined
                                className="text-indigo-600 text-xl cursor-pointer hover:scale-110 transition-transform duration-200"
                                onClick={() =>
                                  setPreviewFile({
                                    url: `http://localhost:5002${msg.content}`,
                                    name: fileName,
                                  })
                                }
                              />
                            </Tooltip>
                            <Tooltip title="Go to message">
                              <MessageOutlined
                                className="text-green-600 text-xl cursor-pointer hover:scale-110 transition-transform duration-200"
                                onClick={() => handleGoToMessage(msg.id)}
                              />
                            </Tooltip>
                            <Tooltip title="Download">
                              <DownloadOutlined
                                className="text-blue-600 text-xl cursor-pointer hover:scale-110 transition-transform duration-200"
                                onClick={() =>
                                  handleDownload(msg.content, msg.fileOriginalName || 'file')
                                }
                              />
                            </Tooltip>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal open={!!selectedImage} onCancel={() => setSelectedImage(null)} footer={null} centered>
        {selectedImage && (
          <div className="flex flex-col items-center">
            <img
              src={selectedImage.url}
              alt="Preview"
              className="w-full max-h-[75vh] object-contain rounded-lg mb-3"
            />
            {selectedImage.caption && (
              <p className="text-center text-gray-700 text-sm break-words max-h-20 overflow-y-auto">
                {selectedImage.caption}
              </p>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!previewFile}
        onCancel={() => setPreviewFile(null)}
        footer={null}
        centered
        width="80%"
      >
        {previewFile && (
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">{previewFile.name}</h2>
            <iframe
              src={previewFile.url}
              title={previewFile.name}
              className="w-full h-[70vh] border rounded-lg shadow-inner"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MediaPage;
