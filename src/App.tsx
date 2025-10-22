import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Dashboard';
import Members from './pages/Members';
import ChatRequests from './pages/ChatRequests';
// import ChatPage from './pages/AllChats';
// import InteractPage from './pages/Interact';
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';
import ViewContactPage from './pages/ViewContactPage';
import EditContactPage from './pages/EditContactPage';
import ViewWallPaper from './pages/ViewWallpaper';
import ChatLayout from './pages/ChatLayout';
import SettingsPage from './pages/Settings';
import MediaPage from './pages/MediaPage';
import StarredMessagesPage from './components/settings/StarredMessagesPage';
import DefaultWallPaper from './pages/DefaultWallpaper';
import ProfilePage from './pages/Profile';
import Contacts from './pages/Contacts';

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
            {/* <Route path="/chats" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><InteractPage /></ProtectedRoute>} /> */}
            <Route path="/chats" element={<ProtectedRoute><ChatLayout /></ProtectedRoute>} />
            <Route path="/view-contact/:userId/:otherUserId" element={<ProtectedRoute><ViewContactPage /></ProtectedRoute>} />
            <Route path="/edit-contact/:userId/:otherUserId" element={<ProtectedRoute><EditContactPage /></ProtectedRoute>} />
            <Route path="/media/:userId/:otherUserId" element={<ProtectedRoute><MediaPage /></ProtectedRoute>} />
            <Route path="/view-wallpaper/:userId/:otherUserId" element={<ProtectedRoute><ViewWallPaper /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><StarredMessagesPage /></ProtectedRoute>} />
            <Route path="/wallpapers" element={<ProtectedRoute><DefaultWallPaper /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ApolloProvider>
  );
};

export default App;
