import React, { useState } from 'react';
import {Stack} from 'expo-router';
import {AuthProvider} from '../src/context/AuthContext';
import {ThemeProvider} from '../src/context/ThemeContext';
import SplashScreen from '../src/components/SplashScreen';

export default function RootLayout() {
	const [showSplash, setShowSplash] = useState(true);

	const handleSplashFinish = () => {
		setShowSplash(false);
	};

	return (
		<AuthProvider>
			<ThemeProvider>
				{showSplash && <SplashScreen onFinish={handleSplashFinish} />}
				<Stack>
					<Stack.Screen name="(tabs)" options={{headerShown: false}}/>
					<Stack.Screen name="+not-found"/>
					<Stack.Screen name="login" options={{headerShown: false}}/>
					<Stack.Screen name="signup" options={{headerShown: false}}/>
					<Stack.Screen name="password-reset" options={{headerShown: false}}/>
				</Stack>
			</ThemeProvider>
		</AuthProvider>
	);
}
