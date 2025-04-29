import React, { createContext, useState, useContext, ReactNode } from 'react';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Define our dark theme that extends the default Paper theme
const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#ffd33d', // Yellow primary color
    accent: '#25292e',  // Dark accent color
    background: '#25292e', // Dark background
    text: '#ffffff',    // White text
    surface: '#333333', // Dark surface
    error: '#ff6b6b',   // Red for errors
    success: '#51cf66', // Green for success
    warning: '#fcc419', // Yellow for warnings
    info: '#339af0',    // Blue for info
    onSurface: '#ffffff', // White text on surface
    placeholder: '#aaaaaa', // Light gray for placeholders
    backdrop: '#1a1a1a', // Darker background for modals
    notification: '#ffd33d', // Notification color
    disabled: '#666666', // Disabled color
    // Custom colors for text inputs in dark mode
    textInputBackground: '#444444', // Lighter background for text inputs
  },
  roundness: 8,
  fonts: {
    ...DefaultTheme.fonts,
  },
};

// Define our light theme
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#ffd33d', // Yellow primary color
    accent: '#ffffff',  // White accent color
    background: '#ffffff', // White background
    text: '#25292e',    // Dark text
    surface: '#f5f5f5', // Light surface
    error: '#ff6b6b',   // Red for errors
    success: '#51cf66', // Green for success
    warning: '#fcc419', // Yellow for warnings
    info: '#339af0',    // Blue for info
  },
  roundness: 8,
  fonts: {
    ...DefaultTheme.fonts,
  },
};

// Create a context for the theme
interface ThemeContextType {
  theme: typeof darkTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDarkMode: true,
  toggleTheme: () => {},
});

// Create a hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Create a provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Use either dark or light theme based on isDarkMode state
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, isDarkMode, toggleTheme }}>
      <PaperProvider theme={currentTheme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
