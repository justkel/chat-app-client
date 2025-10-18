'use client';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Spin, Tooltip, Modal, message } from 'antd';
import { DownloadOutlined, FileOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useGetMediaBetweenUsers } from '../hooks/useGetMediaBetweenUsers';
import {
  CHAT_UPLOAD_AUDIO_PREFIX,
  CHAT_UPLOAD_FILE_PREFIX,
  CHAT_UPLOAD_PREFIX,
} from '../utilss/types';
import '../index.css';
const MediaPage: React.FC = () => {
  const { userId, otherUserId } = useParams();
  const { data, loading, error } = useGetMediaBetweenUsers(userId!, otherUserId!);
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string } | null>(null);

  if (loading)
    return (
      <div className="flex justify-center mt-20 font-montserrat">
        <Spin size="large" />
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8 font-montserrat">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-600 mb-8">
        Shared Media
      </h1>

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
                    <p className="col-span-full text-center text-gray-500">
                      No images found
                    </p>
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
                        <Tooltip className='font-montserrat' title="Download">
                          <DownloadOutlined
                            className="absolute top-2 right-2 text-white bg-blue-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(msg.content, msg.fileOriginalName || 'image.jpg');
                            }}
                          />
                        </Tooltip>
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
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <PlayCircleOutlined className="text-blue-600 text-2xl" />
                          <audio
                            controls
                            src={`http://localhost:5002${msg.content}`}
                            className="w-40 sm:w-60"
                          />
                        </div>
                        <Tooltip className='font-montserrat' title="Download">
                          <DownloadOutlined
                            className="text-blue-600 text-xl cursor-pointer"
                            onClick={() =>
                              handleDownload(msg.content, msg.fileOriginalName || 'audio.mp3')
                            }
                          />
                        </Tooltip>
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
                <div className="flex flex-col gap-4">
                  {files.length === 0 ? (
                    <p className="text-center text-gray-500">No files found</p>
                  ) : (
                    files.map((msg: any) => (
                      <motion.div
                        key={msg.id}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <FileOutlined className="text-gray-700 text-2xl" />
                          <a
                            href={`http://localhost:5002${msg.content}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate max-w-[150px] sm:max-w-[250px]"
                          >
                            {truncate(msg.fileOriginalName || 'View File', 25)}
                          </a>
                        </div>
                        <Tooltip className='font-montserrat' title="Download">
                          <DownloadOutlined
                            className="text-blue-600 text-xl cursor-pointer"
                            onClick={() =>
                              handleDownload(msg.content, msg.fileOriginalName || 'file')
                            }
                          />
                        </Tooltip>
                      </motion.div>
                    ))
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={!!selectedImage}
        onCancel={() => setSelectedImage(null)}
        footer={null}
        centered
      >
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
    </div>
  );
};

export default MediaPage;
