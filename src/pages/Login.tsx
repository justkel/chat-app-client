import React, { useState } from 'react';
import { useLogin } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useLogin();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userData = await login(email, password);
      console.log('Logged in:', userData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 to-red-700 p-6">
      <motion.div
        className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-bold text-red-600 text-center mb-8">
          Welcome Back!
        </h1>
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 text-lg border-b-2 border-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300"
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 text-lg border-b-2 border-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: '#f56565' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-3 text-lg font-semibold text-white bg-red-600 rounded-lg transition-all duration-300 ${
            loading ? 'bg-opacity-70 cursor-not-allowed' : 'hover:bg-red-700'
          }`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </motion.button>
        {error && (
          <p className="mt-4 text-center text-red-500 font-semibold">
            Error: {error.message}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
