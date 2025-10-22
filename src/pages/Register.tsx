import React, { useState } from 'react';
import { useRegister } from '../hooks/auth';
import { useNavigate } from 'react-router-dom';
import { CameraOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, loading, error } = useRegister();
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await register({
        email,
        password,
        username,
        firstName,
        lastName,
        phoneNumber,
        profilePicture,
      });
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG, PNG, etc.).');
        return;
      }

      setProfilePicture(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-50 p-6 font-montserrat">
      <div
        className="w-full max-w-2xl p-8 rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        }}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
          <p className="text-sm text-gray-500 mt-1">Join us and get started</p>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-xl border border-gray-200 bg-white">
            {profilePicture ? (
              <img
                src={URL.createObjectURL(profilePicture)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                Upload
              </div>
            )}
            <label
              title="Change profile picture"
              className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center cursor-pointer border border-gray-300 shadow"
            >
              <CameraOutlined className="text-gray-700 text-lg" />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none"
          />

          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone Number"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="mt-4 mb-6 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none pr-12"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3.5 cursor-pointer text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </span>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md transition ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          }`}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        {error && (
          <p className="mt-4 text-center text-red-500 animate-pulse">Error: {error.message}</p>
        )}

        <div className="mt-5 text-center text-gray-600">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            Log in
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
