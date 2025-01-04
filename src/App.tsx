// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Dashboard';
import Members from './pages/Members';
import ChatRequests from './pages/ChatRequests';
import ChatPage from './pages/AllChats';
import InteractPage from './pages/Interact';
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';
import ViewContactPage from './pages/ViewContactPage';

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}> 
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/all-users" element={<ProtectedRoute><Members /></ProtectedRoute>} />
            <Route path="/pending-requests" element={<ProtectedRoute><ChatRequests /></ProtectedRoute>} />
            <Route path="/chats" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><InteractPage /></ProtectedRoute>} />
            <Route path="/view-contact/:userId/:otherUserId" element={<ProtectedRoute><ViewContactPage /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ApolloProvider>
  );
};

export default App;
