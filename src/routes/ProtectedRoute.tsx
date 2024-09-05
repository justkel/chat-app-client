import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotAuthenticatedPage } from '../components/UnAuth';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <NotAuthenticatedPage />;
  }

  if (user && user.token) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoute;
