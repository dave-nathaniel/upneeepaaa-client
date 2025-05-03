// API Service for UpNeeePaaa (React Native version)
// This file contains the base configuration for API calls and utility functions
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://upneeepaaa.com/API/api/v1';
// const API_BASE_URL = 'http://localhost:8000/api/v1';

// Helper function to get the auth token from secure storage
const getAuthToken = async () => {
	return await SecureStore.getItemAsync('authToken');
};

// Helper function to get the refresh token from secure storage
const getRefreshToken = async () => {
	return await SecureStore.getItemAsync('refreshToken');
};

// Helper function to refresh the access token
const refreshAccessToken = async () => {
	try {
		const refreshToken = await getRefreshToken();
		if (!refreshToken) {
			throw new Error('No refresh token available');
		}

		const tokenData = await authAPI.refreshToken(refreshToken);

		// Store the new tokens
		await SecureStore.setItemAsync('authToken', tokenData.token);
		await SecureStore.setItemAsync('refreshToken', tokenData.refreshToken);

		return tokenData.token;
	} catch (error) {
		console.error('Failed to refresh token:', error);
		// Clear auth data on refresh failure
		await SecureStore.deleteItemAsync('authToken');
		await SecureStore.deleteItemAsync('refreshToken');
		await SecureStore.deleteItemAsync('authUser');
		// Redirect to login page
		if (typeof window !== 'undefined') {
			// For web
			window.location.href = '/login';
		} else {
			// For React Native
			const { router } = require('expo-router');
			router.replace('/login');
		}
		throw error;
	}
};

// Helper function to handle API responses
const handleResponse = async (response, retryRequest) => {

	if (!response.ok) {
		// Check specifically for 401 Unauthorized error
		if (response.status === 401 && retryRequest) {
			try {
				// Attempt to refresh the token
				const newToken = await refreshAccessToken();

				// Retry the original request with the new token
				const retryResponse = await retryRequest(newToken);
				return handleResponse(retryResponse, null); // Don't retry again to avoid infinite loops
			} catch (refreshError) {
				// If token refresh fails, throw the original error
				const error = await response.json();
				throw new Error(error.message || 'Authentication failed');
			}
		}

		const error = await response.json();
		throw new Error(error.message || 'Something went wrong');
	}
	const data = await response.json();
	// Return the data property if it exists, otherwise return the entire response
	return data.data !== undefined ? data.data : data;
};

// Authentication API calls
export const authAPI = {
	login: async (credentials) => {
		const response = await fetch(`${API_BASE_URL}/user/authenticate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(credentials),
		});
		const data = await response.json();
		if (data.status !== 'success') {
			throw new Error(data.message || 'Authentication failed');
		}
		return {
			token: data.data.access,
			refreshToken: data.data.refresh,
			user: data.data.user
		};
	},

	googleLogin: async (tokenId) => {
		const response = await fetch(`${API_BASE_URL}/user/google-auth`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({token: tokenId}),
		});
		const data = await response.json();
		if (data.status !== 'success') {
			throw new Error(data.message || 'Google authentication failed');
		}
		return {
			token: data.data.access,
			refreshToken: data.data.refresh,
			user: data.data.user
		};
	},

	signup: async (userData) => {
		// Transform the userData to match the expected format
		const requestData = {
			email: userData.email,
			name: userData.name,
			password: userData.password,
			phone: userData.phone
		};

		const response = await fetch(`${API_BASE_URL}/user/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestData),
		});
		return handleResponse(response);
	},

	refreshToken: async (refreshToken) => {
		const response = await fetch(`${API_BASE_URL}/user/refresh-token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({refresh: refreshToken}),
		});
		const data = await response.json();
		if (data.status !== 'success') {
			throw new Error(data.message || 'Token refresh failed');
		}
		return {
			token: data.data.access,
			refreshToken: data.data.refresh
		};
	},

	resetPassword: async (email) => {
		const response = await fetch(`${API_BASE_URL}/user/reset-password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({email}),
		});
		return handleResponse(response);
	},
};

// Bill Payment API calls
export const billAPI = {
	getCategories: async () => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/bills/bill-categories`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});

		// Create a retry function that will be called if we get a 401
		const retryFn = (newToken) => {
			return fetch(`${API_BASE_URL}/bills/bill-categories`, {
				headers: {
					'Authorization': `Bearer ${newToken}`,
				},
			});
		};

		return handleResponse(response, retryFn);
	},

	getBillers: async (categorySlug) => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/bills/billers?category=${categorySlug}`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});

		// Create a retry function that will be called if we get a 401
		const retryFn = (newToken) => {
			return fetch(`${API_BASE_URL}/bills/billers?category=${categorySlug}`, {
				headers: {
					'Authorization': `Bearer ${newToken}`,
				},
			});
		};

		return handleResponse(response, retryFn);
	},

	getPackages: async (billerSlug) => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/bills/bill-items/${billerSlug}`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});

		// Create a retry function that will be called if we get a 401
		const retryFn = (newToken) => {
			return fetch(`${API_BASE_URL}/bills/bill-items/${billerSlug}`, {
				headers: {
					'Authorization': `Bearer ${newToken}`,
				},
			});
		};

		return handleResponse(response, retryFn);
	},

	verifyCustomer: async (data) => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/bills/validate-customer`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify({
				biller_id: data.billerId,
				item_id: data.packageId,
				customer_id: data.accountNumber
			}),
		});

		// Create a retry function that will be called if we get a 401
		const retryFn = (newToken) => {
			return fetch(`${API_BASE_URL}/bills/validate-customer`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${newToken}`,
				},
				body: JSON.stringify({
					biller_id: data.billerId,
					item_id: data.packageId,
					customer_id: data.accountNumber
				}),
			});
		};

		return handleResponse(response, retryFn);
	},
};

// Payment API calls
export const paymentAPI = {
	getPaymentGateways: async () => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/payments/payment-gateways`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});
		return handleResponse(response);
	},

	createPayment: async (paymentData) => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/payments/create-payment`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify({
				item_id: paymentData.packageId,
				payment_gateway_id: paymentData.paymentGatewayId || 1, // Default to first gateway if not specified
				customer_id: paymentData.details,
				amount: parseFloat(paymentData.amount)
			}),
		});
		return handleResponse(response);
	},

	getTransactionHistory: async (filters = {}) => {
		const {status, page = 1, pageSize = 10} = filters;
		const token = await getAuthToken();
		let url = `${API_BASE_URL}/payments/transaction-history?page=${page}&page_size=${pageSize}`;
		if (status) {
			url += `&status_filter=${status}`;
		}
		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});
		return handleResponse(response);
	},

	// Subscription management
	getSubscriptionPlans: async () => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/payments/subscription-plans`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});
		return handleResponse(response);
	},

	createSubscription: async (subscriptionData) => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/payments/create-subscription`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify({
				bill_item_id: subscriptionData.billItemId,
				plan_id: subscriptionData.planId
			}),
		});
		return handleResponse(response);
	},

	getUserSubscriptions: async () => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/payments/user-subscriptions`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});
		return handleResponse(response);
	},

	cancelSubscription: async (subscriptionId) => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/payments/cancel-subscription/${subscriptionId}`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});
		return handleResponse(response);
	},

	reactivateSubscription: async (subscriptionId) => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/payments/reactivate-subscription/${subscriptionId}`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});
		return handleResponse(response);
	},
};

// User data API calls
export const userAPI = {
	getProfile: async () => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/user/profile`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});
		return handleResponse(response);
	},

	updateProfile: async (profileData) => {
		const token = await getAuthToken();
		// Transform the profileData to match the expected format
		const requestData = {
			firstname: profileData.name ? profileData.name.split(' ')[0] : profileData.firstname,
			lastname: profileData.name ? profileData.name.split(' ').slice(1).join(' ') : profileData.lastname,
			phone: profileData.phone,
			date_of_birth: profileData.dateOfBirth || profileData.date_of_birth,
			address: profileData.address
		};

		const response = await fetch(`${API_BASE_URL}/user/update`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(requestData),
		});
		return handleResponse(response);
	},

	changePassword: async (passwordData) => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/user/change-password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify({
				current_password: passwordData.currentPassword,
				new_password: passwordData.newPassword
			}),
		});
		return handleResponse(response);
	},
};

// Dashboard data API calls
export const dashboardAPI = {
	getUsageData: async (timeRange) => {
		const token = await getAuthToken();
		const response = await fetch(`${API_BASE_URL}/dashboard/usage?timeRange=${timeRange}`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});
		return handleResponse(response);
	},

	getTransactions: async () => {
		// Use the paymentAPI.getTransactionHistory function with default parameters
		return paymentAPI.getTransactionHistory();
	},
};

export default {
	auth: authAPI,
	bill: billAPI,
	user: userAPI,
	dashboard: dashboardAPI,
	payment: paymentAPI,
};
