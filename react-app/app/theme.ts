import { createTheme } from '@mui/material/styles';
import { cyan, yellow, red } from '@mui/material/colors';
import { alpha, keyframes } from '@mui/material/styles'; // Import alpha for color manipulation

// Keyframes for infinite scroll
export const marqueeKeyframes = keyframes`
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); } /* Move half the width of the duplicated content */
`;

// A custom theme for this app
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: cyan[400], // "Electric Blue" for glows and borders
    },
    secondary: {
      main: yellow[400], // "Warning Yellow" for primary CTA buttons
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#0f172a', // Deep charcoal/black base (slate-900)
      paper: 'rgba(30, 30, 30, 0.8)', // Dark, semi-transparent for glassmorphism
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5', // A softer grey for secondary text
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Russo One", "Montserrat", "Roboto", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Russo One", "Montserrat", "Roboto", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Russo One", "Montserrat", "Roboto", sans-serif',
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          // Add a subtle border to make cards pop
          border: '1px solid rgba(255, 255, 255, 0.12)',
          // Add the neon glow effect globally to cards
          boxShadow: `0 0 15px ${cyan[400]}`,
          // Ensure the background color is set for the glass effect
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Slightly more rounded buttons
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: cyan[400],
          },
          '&.Mui-focused': {
            boxShadow: `0 0 15px ${cyan[400]}`,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: cyan[400],
            },
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        columnHeaders: ({ theme }) => ({
          backgroundColor: theme.palette.background.default, // bg-slate-900
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar + 1, // Ensure it stays on top when scrolling, above other content
          color: theme.palette.primary.main, // text-cyan-400
        }),
        columnHeader: ({ theme }) => ({
          color: theme.palette.primary.main, // text-cyan-400
        }),
        row: ({ theme }) => ({
          '&:nth-of-type(even)': {
            backgroundColor: alpha(theme.palette.background.default, 0.5), // bg-slate-900/50
          },
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.2), // hover:bg-cyan-900/20
          },
        }),
      },
    },
  },
});

export default theme;