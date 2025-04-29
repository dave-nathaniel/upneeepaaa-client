import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../utils/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  authUser: User | null;
  authToken: string | null;
  loading: boolean;
  error: string | null;
  doLogin: (credentials: { username: string; password: string }) => Promise<void>;
  doSignup: (userData: { name: string; email: string; password: string; phone: string }) => Promise<void>;
  doResetPassword: (email: string) => Promise<void>;
  doGoogleLogin: (tokenId: string) => Promise<void>;
  doLogout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  authUser: null,
  authToken: null,
  loading: false,
  error: null,
  doLogin: async () => {},
  doSignup: async () => {},
  doResetPassword: async () => {},
  doGoogleLogin: async () => {},
  doLogout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Persist token and user data on app start
  useEffect(() => {
	const loadAuthData = async () => {
	  try {
		const token = await SecureStore.getItemAsync('authToken');
		const user = await SecureStore.getItemAsync('authUser');

		if (token) {
		  setAuthToken(token);
		  if (user) {
			try {
			  setAuthUser(JSON.parse(user));
			} catch (e) {
			  console.error('Error parsing user data:', e);
			  await SecureStore.deleteItemAsync('authUser');
			}
		  }
		}
	  } catch (e) {
		console.error('Error loading auth data:', e);
	  } finally {
		setLoading(false);
	  }
	};

	loadAuthData();
  }, []);

  const doLogin = async (credentials: { username: string; password: string }) => {
	try {

	  console.log(credentials);
	  setLoading(true);
	  setError(null);
	  const data = await authAPI.login(credentials);
	  // Store tokens and user data
	  await SecureStore.setItemAsync('authToken', data.token);
	  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
	  await SecureStore.setItemAsync('authUser', JSON.stringify(data.user));

	  setAuthToken(data.token);
	  setAuthUser(data.user);

	  Alert.alert('Login Successful', 'Welcome back!');
	  router.replace('/(tabs)');
	} catch (error: any) {
	  console.error('Login error:', error);
	  setError(error.message);
	  Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
	} finally {
	  setLoading(false);
	}
  };

  const doSignup = async (userData: { name: string; email: string; password: string; phone: string }) => {
	try {
	  setLoading(true);
	  setError(null);
	  await authAPI.signup(userData);
	  Alert.alert('Registration Successful', 'Your account has been created. Please login.');
	  router.replace('/login');
	} catch (error: any) {
	  console.error('Signup error:', error);
	  setError(error.message);
	  Alert.alert('Registration Failed', error.message || 'Could not create account. Please try again.');
	} finally {
	  setLoading(false);
	}
  };

  const doResetPassword = async (email: string) => {
	try {
	  setLoading(true);
	  setError(null);
	  await authAPI.resetPassword(email);
	  Alert.alert('Password Reset Email Sent', 'Please check your email for instructions to reset your password.');
	} catch (error: any) {
	  console.error('Password reset error:', error);
	  setError(error.message);
	  Alert.alert('Password Reset Failed', error.message || 'Could not send reset email. Please try again.');
	} finally {
	  setLoading(false);
	}
  };

  const doGoogleLogin = async (tokenId: string) => {
	try {
	  setLoading(true);
	  setError(null);

	  const data = await authAPI.googleLogin(tokenId);

	  // Store tokens and user data
	  await SecureStore.setItemAsync('authToken', data.token);
	  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
	  await SecureStore.setItemAsync('authUser', JSON.stringify(data.user));

	  setAuthToken(data.token);
	  setAuthUser(data.user);

	  Alert.alert('Login Successful', 'Welcome!');
	  router.replace('/(tabs)');
	} catch (error: any) {
	  console.error('Google login error:', error);
	  setError(error.message);
	  Alert.alert('Google Login Failed', error.message || 'Could not authenticate with Google. Please try again.');
	} finally {
	  setLoading(false);
	}
  };

  const doLogout = async () => {
	setAuthToken(null);
	setAuthUser(null);
	await SecureStore.deleteItemAsync('authToken');
	await SecureStore.deleteItemAsync('refreshToken');
	await SecureStore.deleteItemAsync('authUser');
	Alert.alert('Logged Out', 'You have been successfully logged out.');
	router.replace('/login');
  };

  return (
	<AuthContext.Provider value={{
	  authUser,
	  authToken,
	  loading,
	  error,
	  doLogin,
	  doSignup,
	  doResetPassword,
	  doGoogleLogin,
	  doLogout
	}}>
	  {children}
	</AuthContext.Provider>
  );
};

export default AuthContext;