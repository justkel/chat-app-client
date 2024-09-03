import { gql, useMutation } from '@apollo/client';
import { useAuth } from '../contexts/AuthContext';

const REGISTER_MUTATION = gql`
  mutation Register($registerInput: RegisterInput!) {
    register(registerInput: $registerInput) {
      accessToken
      userId
      email
    }
  }
`;

export const useRegister = () => {
  const [registerMutation, { data, loading, error }] = useMutation(REGISTER_MUTATION);

  const register = async (email: string, password: string, fullName: string) => {
    const response = await registerMutation({ 
      variables: { registerInput: { email, password, fullName } } 
    });
    return response.data?.register;
  };

  return { register, data, loading, error };
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

  const login = async (email: string, password: string) => {
    try {
      const response = await loginMutation({ 
        variables: { loginInput: { email, password } } 
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
