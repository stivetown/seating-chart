import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#F4F6F0', // Soft cream white for text
      light: '#FFFFFF',
      dark: '#E5E5E5',
    },
    secondary: {
      main: '#0A2A2A', // Deep tropical green
      light: '#1A3A3A',
      dark: '#051A1A',
    },
    background: {
      default: '#0A2A2A', // Deep tropical green background
      paper: '#0F2F2F', // Slightly lighter green for cards
    },
    text: {
      primary: '#F4F6F0', // Soft cream white
      secondary: '#C8CCBF', // Muted cream for secondary text
    },
    divider: 'rgba(244, 246, 240, 0.12)', // Semi-transparent cream
  },
  typography: {
    fontFamily: '"Helvetica Neue", "Inter", Arial, sans-serif',
    h4: {
      fontWeight: 300,
      letterSpacing: '0.02em',
      color: '#F4F6F0',
      textTransform: 'none',
      fontSize: '2.5rem',
    },
    h6: {
      fontWeight: 300,
      letterSpacing: '0.02em',
      color: '#F4F6F0',
      textTransform: 'none',
    },
    subtitle1: {
      fontWeight: 300,
      color: '#C8CCBF',
      letterSpacing: '0.02em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 300,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: '12px 32px',
          fontSize: '0.9rem',
        },
        contained: {
          backgroundColor: '#F4F6F0',
          color: '#0A2A2A',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(244, 246, 240, 0.15)',
          },
        },
        outlined: {
          borderColor: '#F4F6F0',
          color: '#F4F6F0',
          borderWidth: '1px',
          '&:hover': {
            backgroundColor: 'rgba(244, 246, 240, 0.05)',
            borderWidth: '1px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F2F2F',
          backgroundImage: 'none',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(244, 246, 240, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: '#F4F6F0',
            '& fieldset': {
              borderColor: 'rgba(244, 246, 240, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(244, 246, 240, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#F4F6F0',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#C8CCBF',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DndProvider backend={HTML5Backend}>
        <Layout />
      </DndProvider>
    </ThemeProvider>
  );
}

export default App; 