import { useState } from 'react';

export const useUpdateProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProfile = async (input: {
    userId: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: File | null;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      formData.append('userId', input.userId);

      if (input.firstName) formData.append('firstName', input.firstName);
      if (input.lastName) formData.append('lastName', input.lastName);

      if (input.profilePicture) {
        formData.append('profilePicture', input.profilePicture);
      }

      const resp = await fetch('http://localhost:5002/auth/update-profile', {
        method: 'PATCH',
        body: formData,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => null);
        throw new Error(text || 'Update failed');
      }

      const data = await resp.json();
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      setError(err as Error);
      throw err;
    }
  };

  return { updateProfile, loading, error };
};
