import { gql, useMutation } from '@apollo/client';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const register = async (input: {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    profilePicture?: File | null;
  }) => {
    setLoading(true);
    setError(null);
  
    try {
      const formData = new FormData();
  
      // Check if profilePicture is not null or undefined before appending
      if (input.profilePicture) {
        formData.append('profilePicture', input.profilePicture);
      }
  
      Object.entries(input).forEach(([key, value]) => {
        if (value && key !== 'profilePicture') {
          formData.append(key, value as string | Blob);
        }
      });
  
      const response = await fetch('http://localhost:5002/auth/register', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Registration failed');
      }
  
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      setError(err as Error);
      throw err;
    }
  };  

  return { register, loading, error };
};


const LOGIN_MUTATION = gql`
  mutation Login($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      accessToken
      userId
      email
    }
  }
`;

export const useLogin = () => {
  const [loginMutation, { data, loading, error }] = useMutation(LOGIN_MUTATION);
  const { login: signin } = useAuth();

  const login = async (email: string, password: string, keepMeLoggedIn: boolean) => {
    try {
      const response = await loginMutation({
        variables: {
          loginInput: { email, password, keepMeLoggedIn },
        },
      });

      const { accessToken: token } = response.data.login;

      signin(token);

      return response.data?.login;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Login failed", err.message);
        throw err;
      }
    }
  };

  return { login, data, loading, error };
};
