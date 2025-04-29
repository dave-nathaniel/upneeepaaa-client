import React, {useContext} from 'react';
import {View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {TextInput, Button, Text, ActivityIndicator} from 'react-native-paper';
import {Link} from 'expo-router';
import {useForm, Controller} from 'react-hook-form';
import AuthContext from '../src/context/AuthContext';
import {useTheme} from '../src/context/ThemeContext';

type FormData = {
	email: string;
};

export default function PasswordResetScreen() {
	const {doResetPassword, loading} = useContext(AuthContext);
	const {theme} = useTheme();

	const {control, handleSubmit, formState: {errors}} = useForm<FormData>({
		defaultValues: {
			email: '',
		}
	});

	const onSubmit = async (data: FormData) => {
		await doResetPassword(data.email);
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
						<Text style={[styles.appName, {color: theme.colors.primary}]}>Reset Password</Text>
					</View>

					<View style={styles.formContainer}>
						<Text style={[styles.subtitle, {color: theme.colors.text}]}>
							We'll email you instructions to reset your password.
						</Text>

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
									theme={theme}
								/>
							)}
							name="email"
						/>
						{errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

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
								'Send Reset Instructions'
							)}
						</Button>

						<View style={styles.loginContainer}>
							<Text style={{color: theme.colors.text}}>Remember your password? </Text>
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
		marginBottom: 40,
	},
	logo: {
		width: 60,
		height: 60,
	},
	appName: {
		fontSize: 24,
		fontWeight: 'bold',
		marginTop: 10,
	},
	formContainer: {
		width: '100%',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 20,
		opacity: 0.8,
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
		marginTop: 20,
	},
});