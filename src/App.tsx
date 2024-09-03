// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../src/components/Login';
import Register from '../src/components/Register';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}> 
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ApolloProvider>
  );
};

export default App;
