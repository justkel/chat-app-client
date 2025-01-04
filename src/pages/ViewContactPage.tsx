import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';

const ViewContactPage: React.FC = () => {
  const { userId, otherUserId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      try {
        const decodedToken: any = jwtDecode(user.token);
        console.log(userId);
        console.log('decodedToken.sub', decodedToken?.sub)

        if (decodedToken.sub !== Number(userId)) {
          console.warn('User ID does not match the decoded token. Redirecting...');
          navigate('/chats');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        navigate('/login');
      }
    }
  }, [user, userId, navigate]);

  return (
    <div className="p-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-xl font-semibold">View Contact</h1>
        <p>
          <span className="font-semibold">User ID:</span> {userId}
        </p>
        <p>
          <span className="font-semibold">Other User ID:</span> {otherUserId}
        </p>
      </div>
    </div>
  );
};

export default ViewContactPage;
