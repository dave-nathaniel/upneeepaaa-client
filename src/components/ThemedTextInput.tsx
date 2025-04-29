import React from 'react';
import { TextInput, TextInputProps } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { StyleSheet } from 'react-native';

interface ThemedTextInputProps extends TextInputProps {
  // Add any additional props specific to ThemedTextInput
}

const ThemedTextInput: React.FC<ThemedTextInputProps> = (props) => {
  const { theme, isDarkMode } = useTheme();

  // Create a style object with the appropriate background color for dark mode
  const textInputStyle = {
    backgroundColor: isDarkMode ? theme.colors.textInputBackground : undefined,
  };

  return (
    <TextInput
      {...props}
      style={[props.style, textInputStyle]}
      theme={{
        ...theme,
        colors: {
          ...theme.colors,
          background: isDarkMode ? theme.colors.textInputBackground : theme.colors.background,
        },
      }}
    />
  );
};

// Add the Icon property from TextInput to ThemedTextInput
ThemedTextInput.Icon = TextInput.Icon;

export default ThemedTextInput;
