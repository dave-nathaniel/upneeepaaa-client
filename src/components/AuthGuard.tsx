import React, { useContext, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AuthContext from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { authUser, authToken, loading } = useContext(AuthContext);
  const { theme } = useTheme();

  useEffect(() => {
    // If not loading and no auth token, redirect to login
    if (!loading && !authToken) {
      router.replace('/login');
    }
  }, [authToken, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // If we have an auth token, render the children
  if (authToken) {
    return <>{children}</>;
  }

  // This should not be visible as we redirect in the useEffect
  return null;
};

export default AuthGuard;