import React, { useState } from 'react';
import { useRegister } from '../hooks/auth';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { register, loading, error } = useRegister();
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const userData = await register(email, password, fullName);
      console.log('Registered:', userData);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-600 to-blue-500 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg transform transition-all hover:scale-105">
        <h2 className="text-3xl font-bold text-center text-purple-800 mb-6">Create Your Account</h2>
        <div className="mb-4">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
          />
        </div>
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
          />
        </div>
        <button
          onClick={handleRegister}
          disabled={loading}
          className={`w-full py-2 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition duration-200 ${
            loading ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        {error && (
          <p className="mt-4 text-center text-red-500 animate-pulse">Error: {error.message}</p>
        )}
        <div className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-purple-600 hover:underline cursor-pointer transition duration-200"
          >
            Log in
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
