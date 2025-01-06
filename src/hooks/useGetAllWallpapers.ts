import { useQuery, gql } from '@apollo/client';

const GET_ALL_WALLPAPERS = gql`
  query GetAllWallpapers {
    getAllWallpapers {
      id
      wallpaper
    }
  }
`;

export const useGetAllWallpapers = () => {
  return useQuery(GET_ALL_WALLPAPERS);
};
