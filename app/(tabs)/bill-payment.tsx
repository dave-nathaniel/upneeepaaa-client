import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform} from 'react-native';
import {Text, Card, Button, ActivityIndicator, TextInput, Divider, Chip} from 'react-native-paper';
import {useTheme} from '../../src/context/ThemeContext';
import {billAPI, paymentAPI} from '../../src/utils/apiClient';
import {useForm, Controller} from 'react-hook-form';
import Ionicons from '@expo/vector-icons/Ionicons';
import {WebView} from 'react-native-webview';
import {useRouter} from 'expo-router';

// Step 1: Select bill category, biller, and service package
// Step 2: Enter and verify customer details (meter/account number)
// Step 3: Review payment details and complete payment

export default function BillPaymentScreen() {
	const {theme} = useTheme();
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [categories, setCategories] = useState([]);
	const [billers, setBillers] = useState([]);
	const [packages, setPackages] = useState([]);
	const [paymentGateways, setPaymentGateways] = useState([]);

	// Selected values
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [selectedBiller, setSelectedBiller] = useState(null);
	const [selectedPackage, setSelectedPackage] = useState(null);
	const [customerDetails, setCustomerDetails] = useState(null);
	const [paymentGateway, setPaymentGateway] = useState(null);
	const [transactionReference, setTransactionReference] = useState(null);
	const [paymentUrl, setPaymentUrl] = useState(null);

	const {control, handleSubmit, formState: {errors}, reset} = useForm({
		defaultValues: {
			accountNumber: '',
			amount: '',
		}
	});

	// Fetch bill categories on component mount
	useEffect(() => {
		fetchCategories();
		fetchPaymentGateways();
	}, []);

	// Fetch billers when a category is selected
	useEffect(() => {
		if (selectedCategory) {
			fetchBillers(selectedCategory.slug);
		} else {
			setBillers([]);
		}
		setSelectedBiller(null);
		setSelectedPackage(null);
	}, [selectedCategory]);

	// Fetch packages when a biller is selected
	useEffect(() => {
		if (selectedBiller) {
			console.log(selectedBiller);
			fetchPackages(selectedBiller.biller_code);
		} else {
			setPackages([]);
		}
		setSelectedPackage(null);
	}, [selectedBiller]);

	const fetchCategories = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await billAPI.getCategories();
			setCategories(data || []);
		} catch (error) {
			console.error('Error fetching categories:', error);
			setError('Failed to load bill categories. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const fetchBillers = async (categorySlug) => {
		try {
			setLoading(true);
			setError(null);
			const data = await billAPI.getBillers(categorySlug);
			setBillers(data || []);
		} catch (error) {
			console.error('Error fetching billers:', error);
			setError('Failed to load billers. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const fetchPackages = async (billerSlug) => {
		try {
			setLoading(true);
			setError(null);
			const data = await billAPI.getPackages(billerSlug);
			setPackages(data || []);
		} catch (error) {
			console.error('Error fetching packages:', error);
			setError('Failed to load service packages. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const fetchPaymentGateways = async () => {
		try {
			const data = await paymentAPI.getPaymentGateways();
			setPaymentGateways(data || []);
			if (data && data.length > 0) {
				setPaymentGateway(data[0]);
			}
		} catch (error) {
			console.error('Error fetching payment gateways:', error);
		}
	};

	const verifyCustomer = async (data) => {
		try {
			setLoading(true);
			setError(null);

			const verificationData = {
				billerId: selectedBiller.id,
				packageId: selectedPackage.id,
				accountNumber: data.accountNumber
			};

			const response = await billAPI.verifyCustomer(verificationData);
			setCustomerDetails({
				...response,
				accountNumber: data.accountNumber,
				amount: selectedPackage.amount || data.amount
			});

			// Move to next step
			setCurrentStep(3);
		} catch (error) {
			console.error('Error verifying customer:', error);
			setError('Failed to verify customer details. Please check and try again.');
		} finally {
			setLoading(false);
		}
	};

	const processPayment = async () => {
		try {
			setLoading(true);
			setError(null);

			const paymentData = {
				packageId: selectedPackage.id,
				paymentGatewayId: paymentGateway.id,
				details: customerDetails.accountNumber,
				amount: customerDetails.amount
			};

			const response = await paymentAPI.createPayment(paymentData);
			setTransactionReference(response.reference);

			// Check if payment_url is in the response
			if (response.payment_url) {
				setPaymentUrl(response.payment_url);
				// Move to payment webview step
				setCurrentStep(4);
			} else {
				// If no payment_url, move to success step
				setCurrentStep(5);
			}
		} catch (error) {
			console.error('Error processing payment:', error);
			setError('Payment failed. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setCurrentStep(1);
		setSelectedCategory(null);
		setSelectedBiller(null);
		setSelectedPackage(null);
		setCustomerDetails(null);
		setTransactionReference(null);
		setPaymentUrl(null);
		setError(null);
		reset();
	};

	const renderStepIndicator = () => (
		<View style={styles.stepIndicator}>
			{[1, 2, 3].map((step) => (
				<View key={step} style={styles.stepContainer}>
					<View
						style={[
							styles.stepCircle,
							currentStep >= step ?
								{backgroundColor: theme.colors.primary} :
								{backgroundColor: theme.colors.surface}
						]}
					>
						{currentStep > step ? (
							<Ionicons name="checkmark" size={16} color={theme.colors.accent}/>
						) : (
							<Text style={{
								color: currentStep === step ? theme.colors.accent : theme.colors.text
							}}>
								{step}
							</Text>
						)}
					</View>
					{step < 3 && (
						<View
							style={[
								styles.stepLine,
								currentStep > step ?
									{backgroundColor: theme.colors.primary} :
									{backgroundColor: theme.colors.surface}
							]}
						/>
					)}
				</View>
			))}
		</View>
	);

	const renderCategorySelection = () => (
		<View style={styles.selectionContainer}>
			<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Select Category</Text>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
				{categories.map((category) => (
					<TouchableOpacity
						key={category.id}
						style={[
							styles.categoryCard,
							{backgroundColor: theme.colors.surface},
							selectedCategory?.id === category.id && {borderColor: theme.colors.primary, borderWidth: 2}
						]}
						onPress={() => setSelectedCategory(category)}
					>
						<View style={[styles.categoryIcon, {backgroundColor: theme.colors.primary}]}>
							<Ionicons
								name={getCategoryIcon(category.name)}
								size={24}
								color={theme.colors.accent}
							/>
						</View>
						<Text style={{color: theme.colors.text, textAlign: 'center', marginTop: 8}}>
							{category.name}
						</Text>
					</TouchableOpacity>
				))}
			</ScrollView>
		</View>
	);

	const renderBillerSelection = () => (
		<View style={styles.selectionContainer}>
			<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Select Biller</Text>
			{selectedCategory ? (
				<ScrollView style={{maxHeight: 200}}>
					{billers.map((biller) => (
						<TouchableOpacity
							key={biller.id}
							style={[
								styles.billerItem,
								{backgroundColor: theme.colors.surface},
								selectedBiller?.id === biller.id && {borderColor: theme.colors.primary, borderWidth: 2}
							]}
							onPress={() => setSelectedBiller(biller)}
						>
							<Text style={{color: theme.colors.text}}>{biller.name}</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			) : (
				<Text style={{color: theme.colors.text, opacity: 0.7}}>
					Please select a category first
				</Text>
			)}
		</View>
	);

	const renderPackageSelection = () => (
		<View style={styles.selectionContainer}>
			<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Select Package</Text>
			{selectedBiller ? (
				<ScrollView style={{maxHeight: 200}}>
					{packages.map((pkg) => (
						<TouchableOpacity
							key={pkg.id}
							style={[
								styles.packageItem,
								{backgroundColor: theme.colors.surface},
								selectedPackage?.id === pkg.id && {borderColor: theme.colors.primary, borderWidth: 2}
							]}
							onPress={() => setSelectedPackage(pkg)}
						>
							<View>
								<Text style={{color: theme.colors.text, fontWeight: 'bold'}}>{pkg.name}</Text>
								<Text style={{color: theme.colors.text, opacity: 0.7}}>{pkg.description}</Text>
							</View>
							<Text style={{color: theme.colors.primary, fontWeight: 'bold'}}>
								₦{pkg.amount?.toFixed(2) || '0.00'}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			) : (
				<Text style={{color: theme.colors.text, opacity: 0.7}}>
					Please select a biller first
				</Text>
			)}
		</View>
	);

	const renderStep1 = () => (
		<Card style={[styles.card, {backgroundColor: theme.colors.background}]}>
			<Card.Content>
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator color={theme.colors.primary} size="large"/>
					</View>
				) : error ? (
					<Text style={{color: theme.colors.error, marginBottom: 16}}>{error}</Text>
				) : (
					<>
						{renderCategorySelection()}
						{renderBillerSelection()}
						{renderPackageSelection()}
					</>
				)}
			</Card.Content>
			<Card.Actions style={styles.cardActions}>
				<Button
					mode="contained"
					onPress={() => setCurrentStep(2)}
					disabled={!selectedPackage || loading}
					style={[styles.button, {backgroundColor: theme.colors.primary}]}
					labelStyle={{color: theme.colors.accent}}
				>
					Next
				</Button>
			</Card.Actions>
		</Card>
	);

	const renderStep2 = () => (
		<Card style={[styles.card, {backgroundColor: theme.colors.background}]}>
			<Card.Content>
				<Text style={[styles.cardTitle, {color: theme.colors.text}]}>Enter Customer Details</Text>

				<View style={styles.summaryItem}>
					<Text style={{color: theme.colors.text, opacity: 0.7}}>Category:</Text>
					<Text style={{color: theme.colors.text}}>{selectedCategory.name}</Text>
				</View>

				<View style={styles.summaryItem}>
					<Text style={{color: theme.colors.text, opacity: 0.7}}>Biller:</Text>
					<Text style={{color: theme.colors.text}}>{selectedBiller.name}</Text>
				</View>

				<View style={styles.summaryItem}>
					<Text style={{color: theme.colors.text, opacity: 0.7}}>Package:</Text>
					<Text style={{color: theme.colors.text}}>{selectedPackage.name}</Text>
				</View>

				<Divider style={styles.divider}/>

				<Controller
					control={control}
					rules={{required: 'Account/Meter number is required'}}
					render={({field: {onChange, onBlur, value}}) => (
						<TextInput
							label="Account/Meter Number"
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							style={styles.input}
							mode="outlined"
							error={!!errors.accountNumber}
							theme={theme}
						/>
					)}
					name="accountNumber"
				/>
				{errors.accountNumber && (
					<Text style={{color: theme.colors.error, marginBottom: 10}}>
						{errors.accountNumber.message}
					</Text>
				)}

				{!selectedPackage.amount && (
					<>
						<Controller
							control={control}
							rules={{
								required: 'Amount is required',
								validate: value => {
									const num = parseFloat(value);
									return (num > 0) || 'Amount must be greater than 0';
								}
							}}
							render={({field: {onChange, onBlur, value}}) => (
								<TextInput
									label="Amount (₦)"
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									style={styles.input}
									mode="outlined"
									keyboardType="numeric"
									error={!!errors.amount}
									theme={theme}
								/>
							)}
							name="amount"
						/>
						{errors.amount && (
							<Text style={{color: theme.colors.error, marginBottom: 10}}>
								{errors.amount.message}
							</Text>
						)}
					</>
				)}

				{error && <Text style={{color: theme.colors.error, marginTop: 10}}>{error}</Text>}
			</Card.Content>
			<Card.Actions style={styles.cardActions}>
				<Button
					mode="outlined"
					onPress={() => setCurrentStep(1)}
					style={styles.button}
					labelStyle={{color: theme.colors.primary}}
				>
					Back
				</Button>
				<Button
					mode="contained"
					onPress={handleSubmit(verifyCustomer)}
					disabled={loading}
					style={[styles.button, {backgroundColor: theme.colors.primary}]}
					labelStyle={{color: theme.colors.accent}}
				>
					{loading ? (
						<ActivityIndicator color={theme.colors.accent} size="small"/>
					) : (
						'Verify & Continue'
					)}
				</Button>
			</Card.Actions>
		</Card>
	);

	const renderStep3 = () => (
		<Card style={[styles.card, {backgroundColor: theme.colors.background}]}>
			<Card.Content>
				<Text style={[styles.cardTitle, {color: theme.colors.text}]}>Review Payment</Text>

				<View style={styles.summaryContainer}>
					<View style={styles.summaryItem}>
						<Text style={{color: theme.colors.text, opacity: 0.7}}>Biller:</Text>
						<Text style={{color: theme.colors.text}}>{selectedBiller.name}</Text>
					</View>

					<View style={styles.summaryItem}>
						<Text style={{color: theme.colors.text, opacity: 0.7}}>Package:</Text>
						<Text style={{color: theme.colors.text}}>{selectedPackage.name}</Text>
					</View>

					<View style={styles.summaryItem}>
						<Text style={{color: theme.colors.text, opacity: 0.7}}>Account Number:</Text>
						<Text style={{color: theme.colors.text}}>{customerDetails.accountNumber}</Text>
					</View>

					{customerDetails.customer_name && (
						<View style={styles.summaryItem}>
							<Text style={{color: theme.colors.text, opacity: 0.7}}>Customer Name:</Text>
							<Text style={{color: theme.colors.text}}>{customerDetails.customer_name}</Text>
						</View>
					)}

					<Divider style={styles.divider}/>

					<View style={styles.summaryItem}>
						<Text style={{color: theme.colors.text, opacity: 0.7}}>Amount:</Text>
						<Text style={{color: theme.colors.primary, fontWeight: 'bold'}}>
							₦{parseFloat(customerDetails.amount).toFixed(2)}
						</Text>
					</View>

					<View style={styles.summaryItem}>
						<Text style={{color: theme.colors.text, opacity: 0.7}}>Payment Method:</Text>
						<Text style={{color: theme.colors.text}}>{paymentGateway?.name || 'Default'}</Text>
					</View>
				</View>

				{error && <Text style={{color: theme.colors.error, marginTop: 10}}>{error}</Text>}
			</Card.Content>
			<Card.Actions style={styles.cardActions}>
				<Button
					mode="outlined"
					onPress={() => setCurrentStep(2)}
					style={styles.button}
					labelStyle={{color: theme.colors.primary}}
				>
					Back
				</Button>
				<Button
					mode="contained"
					onPress={processPayment}
					disabled={loading}
					style={[styles.button, {backgroundColor: theme.colors.primary}]}
					labelStyle={{color: theme.colors.accent}}
				>
					{loading ? (
						<ActivityIndicator color={theme.colors.accent} size="small"/>
					) : (
						'Complete Payment'
					)}
				</Button>
			</Card.Actions>
		</Card>
	);

	const renderStep4 = () => {
		// Payment webview step
		const handleNavigationStateChange = (navState) => {
			console.log('Navigation state changed:', navState.url);
			// Check if the URL is the redirect URL
			if (navState.url.includes('upneeepaaa.com/transaction-history')) {
				console.log('Redirect URL detected, navigating to transactions');
				// Close webview and navigate to transaction history
				setPaymentUrl(null);
				setCurrentStep(5); // First set to success step
				setTimeout(() => {
					router.push('/(tabs)/transactions');
				}, 500); // Add a small delay to ensure state is updated before navigation
			}
		};

		// Additional handler for iOS
		const onShouldStartLoadWithRequest = (request) => {
			console.log('Should start load with request:', request.url);
			// Check if the URL is the redirect URL
			if (request.url.includes('upneeepaaa.com/transaction-history')) {
				console.log('Redirect URL detected in onShouldStartLoadWithRequest');
				// Close webview and navigate to transaction history
				setPaymentUrl(null);
				setCurrentStep(5); // First set to success step
				setTimeout(() => {
					router.push('/(tabs)/transactions');
				}, 500); // Add a small delay to ensure state is updated before navigation
				return false; // Prevent the WebView from loading this URL
			}
			return true; // Allow the WebView to load other URLs
		};

		const handleCloseWebview = () => {
			setPaymentUrl(null);
			setCurrentStep(3); // Go back to review step
		};

		return (
			<View style={{flex: 1, height: 500}}>
				<View style={styles.webviewHeader}>
					<TouchableOpacity onPress={handleCloseWebview} style={styles.closeButton}>
						<Ionicons name="close" size={24} color={theme.colors.text}/>
					</TouchableOpacity>
					<Text style={{color: theme.colors.text, fontWeight: 'bold'}}>Payment</Text>
					<View style={{width: 24}}/>
				</View>
				<WebView
					source={{uri: paymentUrl}}
					style={{flex: 1}}
					onNavigationStateChange={handleNavigationStateChange}
					onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
					startInLoadingState={true}
					javaScriptEnabled={true}
					domStorageEnabled={true}
					renderLoading={() => (
						<View style={styles.loadingContainer}>
							<ActivityIndicator color={theme.colors.primary} size="large"/>
						</View>
					)}
				/>
			</View>
		);
	};

	const renderStep5 = () => (
		<Card style={[styles.card, {backgroundColor: theme.colors.background}]}>
			<Card.Content style={styles.successContainer}>
				<View style={[styles.successIcon, {backgroundColor: theme.colors.success}]}>
					<Ionicons name="checkmark" size={50} color="#fff"/>
				</View>

				<Text style={[styles.successTitle, {color: theme.colors.text}]}>
					Payment Successful!
				</Text>

				<Text style={{color: theme.colors.text, textAlign: 'center', marginBottom: 20}}>
					Your payment has been processed successfully.
				</Text>

				<View style={styles.referenceContainer}>
					<Text style={{color: theme.colors.text, opacity: 0.7}}>Transaction Reference:</Text>
					<Text style={{color: theme.colors.primary, fontWeight: 'bold'}}>
						{transactionReference}
					</Text>
				</View>

				<Button
					mode="contained"
					onPress={resetForm}
					style={[styles.button, {backgroundColor: theme.colors.primary, marginTop: 20}]}
					labelStyle={{color: theme.colors.accent}}
				>
					Make Another Payment
				</Button>
			</Card.Content>
		</Card>
	);

	// Helper function to get icon name based on category name
	const getCategoryIcon = (categoryName) => {
		const name = categoryName?.toLowerCase() || '';
		if (name.includes('electricity')) return 'flash-outline';
		if (name.includes('water')) return 'water-outline';
		if (name.includes('internet')) return 'wifi-outline';
		if (name.includes('tv') || name.includes('cable')) return 'tv-outline';
		if (name.includes('phone') || name.includes('mobile')) return 'phone-portrait-outline';
		if (name.includes('gas')) return 'flame-outline';
		return 'cash-outline';
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={{flex: 1}}
		>
			{paymentUrl && currentStep === 4 ? (
				// Render the payment webview full screen when we have a payment URL
				renderStep4()
			) : (
				<ScrollView
					style={[styles.container, {backgroundColor: theme.colors.background}]}
					contentContainerStyle={styles.contentContainer}
				>
					<Text style={[styles.title, {color: theme.colors.text}]}>Pay Bills</Text>

					{currentStep < 4 && renderStepIndicator()}

					{currentStep === 1 && renderStep1()}
					{currentStep === 2 && renderStep2()}
					{currentStep === 3 && renderStep3()}
					{currentStep === 5 && renderStep5()}
				</ScrollView>
			)}
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		padding: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	card: {
		marginBottom: 16,
		borderRadius: 8,
		elevation: 4,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	stepIndicator: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	stepContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	stepCircle: {
		width: 30,
		height: 30,
		borderRadius: 15,
		justifyContent: 'center',
		alignItems: 'center',
	},
	stepLine: {
		height: 2,
		width: 50,
	},
	selectionContainer: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	horizontalScroll: {
		flexDirection: 'row',
	},
	categoryCard: {
		width: 100,
		height: 100,
		borderRadius: 8,
		padding: 10,
		marginRight: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	categoryIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	billerItem: {
		padding: 16,
		borderRadius: 8,
		marginBottom: 8,
	},
	packageItem: {
		padding: 16,
		borderRadius: 8,
		marginBottom: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	input: {
		marginBottom: 16,
	},
	cardActions: {
		justifyContent: 'space-between',
		padding: 16,
	},
	button: {
		minWidth: 120,
	},
	loadingContainer: {
		height: 200,
		justifyContent: 'center',
		alignItems: 'center',
	},
	summaryContainer: {
		marginBottom: 20,
	},
	summaryItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	divider: {
		marginVertical: 16,
	},
	successContainer: {
		alignItems: 'center',
		padding: 16,
	},
	successIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	successTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	referenceContainer: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		padding: 16,
		borderRadius: 8,
		width: '100%',
		alignItems: 'center',
	},
	webviewHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0, 0, 0, 0.1)',
	},
	closeButton: {
		padding: 5,
	},
});
