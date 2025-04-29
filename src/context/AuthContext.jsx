import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [authToken, setAuthToken] = useState(null);
	const [authUser, setAuthUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	// Persist token and user data on page refresh
	useEffect(() => {
		const token = localStorage.getItem('authToken');
		const user = localStorage.getItem('authUser');
		if (token) {
			setAuthToken(token);
			if (user) {
				try {
					setAuthUser(JSON.parse(user));
				} catch (e) {
					console.error('Error parsing user data:', e);
					localStorage.removeItem('authUser');
				}
			}
		}
		setLoading(false);
	}, []);

	const doLogin = async (formData) => {
		try {
			setLoading(true);
			setError(null);
			const data = await authAPI.login(formData);

			// Store tokens and user data
			localStorage.setItem('authToken', data.token);
			localStorage.setItem('refreshToken', data.refreshToken);
			localStorage.setItem('authUser', JSON.stringify(data.user));

			setAuthToken(data.token);
			setAuthUser(data.user);

			Swal.fire({
				icon: 'success',
				title: 'Login Successful',
				text: 'Welcome back!',
				timer: 1500,
				showConfirmButton: false
			});
			navigate('/dashboard');
		} catch (error) {
			console.error('Login error:', error);
			setError(error.message);
			Swal.fire({
				icon: 'error',
				title: 'Login Failed',
				text: error.message || 'Invalid credentials. Please try again.',
			});
		} finally {
			setLoading(false);
		}
	};

	const doSignup = async (userData) => {
		try {
			setLoading(true);
			setError(null);
			const data = await authAPI.signup(userData);
			Swal.fire({
				icon: 'success',
				title: 'Registration Successful',
				text: 'Your account has been created. Please login.',
				timer: 2000,
				showConfirmButton: false
			});
			navigate('/login');
		} catch (error) {
			console.error('Signup error:', error);
			setError(error.message);
			Swal.fire({
				icon: 'error',
				title: 'Registration Failed',
				text: error.message || 'Could not create account. Please try again.',
			});
		} finally {
			setLoading(false);
		}
	};

	const doResetPassword = async (email) => {
		try {
			setLoading(true);
			setError(null);
			await authAPI.resetPassword(email);
			Swal.fire({
				icon: 'success',
				title: 'Password Reset Email Sent',
				text: 'Please check your email for instructions to reset your password.',
			});
		} catch (error) {
			console.error('Password reset error:', error);
			setError(error.message);
			Swal.fire({
				icon: 'error',
				title: 'Password Reset Failed',
				text: error.message || 'Could not send reset email. Please try again.',
			});
		} finally {
			setLoading(false);
		}
	};

	const doGoogleLogin = async (credentialResponse) => {
		try {
			setLoading(true);
			setError(null);

			// Get the token from the credential response
			const tokenId = credentialResponse.credential;

			// Send the token to the backend for verification
			const data = await authAPI.googleLogin(tokenId);

			// Store tokens and user data
			localStorage.setItem('authToken', data.token);
			localStorage.setItem('refreshToken', data.refreshToken);
			localStorage.setItem('authUser', JSON.stringify(data.user));

			setAuthToken(data.token);
			setAuthUser(data.user);

			Swal.fire({
				icon: 'success',
				title: 'Login Successful',
				text: 'Welcome!',
				timer: 1500,
				showConfirmButton: false
			});
			navigate('/dashboard');
		} catch (error) {
			console.error('Google login error:', error);
			setError(error.message);
			Swal.fire({
				icon: 'error',
				title: 'Google Login Failed',
				text: error.message || 'Could not authenticate with Google. Please try again.',
			});
		} finally {
			setLoading(false);
		}
	};

	const doLogout = () => {
		setAuthToken(null);
		setAuthUser(null);
		localStorage.removeItem('authToken');
		localStorage.removeItem('authUser');
		Swal.fire({
			icon: 'success',
			title: 'Logged Out',
			text: 'You have been successfully logged out.',
			timer: 1500,
			showConfirmButton: false
		});
		navigate('/login');
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
