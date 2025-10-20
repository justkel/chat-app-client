import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './index.css';
import App from './App';
import client from './apolloClient';

const theme = createTheme({
  typography: {
    fontFamily: 'Montserrat, sans-serif',
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'Montserrat, sans-serif',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <ApolloProvider client={client}>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </ApolloProvider>
);
