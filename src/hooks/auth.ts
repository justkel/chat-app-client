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

  const register = async (input: {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    profilePicture?: File | null;
  }) => {
    const { profilePicture, ...registerInput } = input;

    let profilePictureUrl: string | undefined;

    if (profilePicture) {
      const formData = new FormData();
      formData.append('file', profilePicture);

      const uploadResponse = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      profilePictureUrl = uploadResult.url; // Extract the URL from the response
    }

    const response = await registerMutation({
      variables: {
        registerInput: {
          ...registerInput,
          profilePicture: profilePictureUrl,
        },
      },
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
