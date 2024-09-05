import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotAuthenticatedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="h-screen bg-gradient-to-b from-blue-100 via-white to-indigo-50 flex flex-col justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg p-8 md:p-16 max-w-3xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-indigo-600 mb-6">
          You're Not Signed In
        </h1>
        <p className="text-gray-700 text-lg md:text-xl mb-10">
          It looks like you are currently not logged in. Your space is still waiting for you—warm, secure, and reserved, just for you.
        </p>
        <button
          onClick={handleLogin}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300">
          Return Home
        </button>
      </div>
    </div>
  );
};
