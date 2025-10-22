import React, { useState } from 'react';
import { useLogin } from '../hooks/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loading, error } = useLogin();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userData = await login(email, password, keepMeLoggedIn);
      console.log('Logged in:', userData);
      navigate('/chats');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 via-gray-50 to-white px-6 font-montserrat">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 8px 36px rgba(0,0,0,0.08)',
        }}
      >
        <h2 className="text-2xl font-semibold text-gray-900 text-center">Welcome back</h2>
        <p className="text-gray-500 text-center text-sm mt-1">Login to continue</p>

        <div className="mt-8">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="mt-4 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none"
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3 cursor-pointer text-gray-500 text-lg"
          >
            {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </span>
        </div>

        <label className="flex items-center space-x-2 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={keepMeLoggedIn}
            onChange={() => setKeepMeLoggedIn(!keepMeLoggedIn)}
            className="h-4 w-4"
          />
          <span className="text-gray-700 text-sm">Keep me logged in</span>
        </label>

        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          onClick={handleLogin}
          disabled={loading}
          className={`w-full mt-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md transition ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          }`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </motion.button>

        {error && (
          <p className="mt-4 text-center text-red-500 font-medium animate-pulse">Error: {error.message}</p>
        )}

        <div className="mt-6 text-center text-gray-600 text-sm">
          Don't have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            Register
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
