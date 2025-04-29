import React, {useState, useContext} from 'react';
import {View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {Button, Text, ActivityIndicator, TextInput} from 'react-native-paper';
import {Link} from 'expo-router';
import {useForm, Controller} from 'react-hook-form';
import AuthContext from '../src/context/AuthContext';
import {useTheme} from '../src/context/ThemeContext';
import ThemedTextInput from '../src/components/ThemedTextInput';

type FormData = {
	name: string;
	email: string;
	phone: string;
	password: string;
	confirmPassword: string;
};

export default function SignupScreen() {
	const {doSignup, loading} = useContext(AuthContext);
	const {theme} = useTheme();
	const [secureTextEntry, setSecureTextEntry] = useState(true);
	const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);

	const {control, handleSubmit, formState: {errors}, watch} = useForm<FormData>({
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			password: '',
			confirmPassword: '',
		}
	});

	const password = watch('password');

	const onSubmit = async (data: FormData) => {
		// Remove confirmPassword before sending to API
		const {confirmPassword, ...userData} = data;
		await doSignup(userData);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={{flex: 1}}
		>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				<View style={[styles.container, {backgroundColor: theme.colors.background}]}>
					<View style={styles.logoContainer}>
						<Image
							source={require('../assets/images/logo-white.png')}
							style={styles.logo}
							resizeMode="contain"
						/>
						<Text style={[styles.appName, {color: theme.colors.text}]}>Create Account</Text>
					</View>

					<View style={styles.formContainer}>

						<Controller
							control={control}
							rules={{
								required: 'Name is required',
							}}
							render={({field: {onChange, onBlur, value}}) => (
								<TextInput
									label="Full Name"
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									style={styles.input}
									mode="outlined"
									error={!!errors.name}
								/>
							)}
							name="name"
						/>
						{errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

						<Controller
							control={control}
							rules={{
								required: 'Email is required',
								pattern: {
									value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
									message: 'Invalid email address'
								}
							}}
							render={({field: {onChange, onBlur, value}}) => (
								<TextInput
									label="Email"
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									style={styles.input}
									mode="outlined"
									keyboardType="email-address"
									autoCapitalize="none"
									error={!!errors.email}
								/>
							)}
							name="email"
						/>
						{errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

						<Controller
							control={control}
							rules={{
								required: 'Phone number is required',
								pattern: {
									value: /^[0-9+\s-]{10,15}$/,
									message: 'Invalid phone number'
								}
							}}
							render={({field: {onChange, onBlur, value}}) => (
								<TextInput
									label="Phone Number"
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									style={styles.input}
									mode="outlined"
									keyboardType="phone-pad"
									error={!!errors.phone}
								/>
							)}
							name="phone"
						/>
						{errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}

						<Controller
							control={control}
							rules={{
								required: 'Password is required',
								minLength: {
									value: 6,
									message: 'Password must be at least 6 characters'
								}
							}}
							render={({field: {onChange, onBlur, value}}) => (
								<TextInput
									label="Password"
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									style={styles.input}
									mode="outlined"
									secureTextEntry={secureTextEntry}
									error={!!errors.password}
								/>
							)}
							name="password"
						/>
						{errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

						<Controller
							control={control}
							rules={{
								required: 'Please confirm your password',
								validate: value => value === password || 'Passwords do not match'
							}}
							render={({field: {onChange, onBlur, value}}) => (
								<TextInput
									label="Confirm Password"
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									style={styles.input}
									mode="outlined"
									secureTextEntry={secureConfirmTextEntry}
									error={!!errors.confirmPassword}
								/>
							)}
							name="confirmPassword"
						/>
						{errors.confirmPassword &&
							<Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

						<Button
							mode="contained"
							onPress={handleSubmit(onSubmit)}
							style={[styles.button, {backgroundColor: theme.colors.primary}]}
							labelStyle={{color: theme.colors.accent}}
							disabled={loading}
						>
							{loading ? (
								<ActivityIndicator color={theme.colors.accent} size="small"/>
							) : (
								'Sign Up'
							)}
						</Button>

						<View style={styles.loginContainer}>
							<Text style={{color: theme.colors.text}}>Already have an account? </Text>
							<Link href="/login" style={{color: theme.colors.primary}}>
								Login
							</Link>
						</View>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
	},
	container: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
	},
	logoContainer: {
		alignItems: 'center',
		marginBottom: 30,
	},
	logo: {
		width: 60,
		height: 60,
	},
	appName: {
		fontSize: 22,
		fontWeight: 'bold',
		marginTop: 8,
	},
	formContainer: {
		width: '100%',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	input: {
		marginBottom: 10,
	},
	errorText: {
		color: '#ff6b6b',
		marginBottom: 10,
		marginLeft: 5,
	},
	button: {
		marginTop: 10,
		marginBottom: 20,
		paddingVertical: 8,
	},
	loginContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 10,
	},
});
