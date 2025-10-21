import { gql, useMutation } from '@apollo/client';

export const UPDATE_DEFAULT_WALLPAPER = gql`
  mutation UpdateDefaultWallpaper($userId: ID!, $defaultChatWallpaper: String!) {
    updateDefaultWallpaper(
      input: { userId: $userId, defaultChatWallpaper: $defaultChatWallpaper }
    ) {
      id
      defaultChatWallpaper
    }
  }
`;

export const useUpdateDefaultWallpaper = () => {
  const [updateDefaultWallpaperMutation, { data, loading, error }] =
    useMutation(UPDATE_DEFAULT_WALLPAPER);

  const updateWallpaper = (userId: string, defaultChatWallpaper: string) => {
    updateDefaultWallpaperMutation({
      variables: { userId, defaultChatWallpaper },
    });
  };

  return {
    updateWallpaper,
    data,
    loading,
    error,
  };
};
