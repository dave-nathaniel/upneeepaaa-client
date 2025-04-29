import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal} from 'react-native';
import {Text, Card, Button, ActivityIndicator, Chip, Searchbar, Divider} from 'react-native-paper';
import {useTheme} from '../../src/context/ThemeContext';
import {paymentAPI} from '../../src/utils/apiClient';
import {format} from 'date-fns';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TransactionsScreen() {
	const {theme} = useTheme();
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [statusFilter, setStatusFilter] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTransaction, setSelectedTransaction] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);

	// Fetch transactions on component mount and when filters change
	useEffect(() => {
		fetchTransactions();
	}, [page, statusFilter]);

	const fetchTransactions = async () => {
		try {
			setLoading(true);
			setError(null);

			const filters = {
				page,
				pageSize: 10,
				status: statusFilter,
				search: searchQuery.trim() || undefined
			};

			const response = await paymentAPI.getTransactionHistory(filters);
			setTransactions(response.transactions || []);
			setTotalPages(response.total_pages || 1);
		} catch (error) {
			console.error('Error fetching transactions:', error);
			setError('Failed to load transactions. Please try again.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = () => {
		setRefreshing(true);
		fetchTransactions();
	};

	const handleSearch = () => {
		setPage(1); // Reset to first page when searching
		fetchTransactions();
	};

	const handleStatusFilter = (status) => {
		setStatusFilter(status === statusFilter ? null : status);
		setPage(1); // Reset to first page when filtering
	};

	const handleViewDetails = (transaction) => {
		setSelectedTransaction(transaction);
		setModalVisible(true);
	};

	// Helper function to get color based on transaction status
	const getStatusColor = (status) => {
		switch (status?.toLowerCase()) {
			case 'completed':
			case 'successful':
				return theme.colors.success;
			case 'pending':
				return theme.colors.warning;
			case 'failed':
				return theme.colors.error;
			default:
				return theme.colors.text;
		}
	};

	// Helper function to get background color based on transaction status
	const getStatusBackgroundColor = (status) => {
		switch (status?.toLowerCase()) {
			case 'completed':
			case 'success':
				return 'rgba(81, 207, 102, 0.2)';
			case 'pending':
				return 'rgba(252, 196, 25, 0.2)';
			case 'failed':
				return 'rgba(255, 107, 107, 0.2)';
			default:
				return 'rgba(255, 255, 255, 0.1)';
		}
	};

	const renderStatusFilters = () => (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			style={styles.filtersContainer}
			contentContainerStyle={styles.filtersContent}
		>
			<Chip
				selected={statusFilter === null}
				onPress={() => handleStatusFilter(null)}
				style={[styles.filterChip, statusFilter === null && {backgroundColor: theme.colors.primary}]}
				textStyle={{color: statusFilter === null ? theme.colors.accent : theme.colors.text}}
			>
				All
			</Chip>
			<Chip
				selected={statusFilter === 'completed'}
				onPress={() => handleStatusFilter('completed')}
				style={[styles.filterChip, statusFilter === 'completed' && {backgroundColor: theme.colors.success}]}
				textStyle={{color: statusFilter === 'completed' ? '#fff' : theme.colors.text}}
			>
				Completed
			</Chip>
			<Chip
				selected={statusFilter === 'pending'}
				onPress={() => handleStatusFilter('pending')}
				style={[styles.filterChip, statusFilter === 'pending' && {backgroundColor: theme.colors.warning}]}
				textStyle={{color: statusFilter === 'pending' ? theme.colors.accent : theme.colors.text}}
			>
				Pending
			</Chip>
			<Chip
				selected={statusFilter === 'failed'}
				onPress={() => handleStatusFilter('failed')}
				style={[styles.filterChip, statusFilter === 'failed' && {backgroundColor: theme.colors.error}]}
				textStyle={{color: statusFilter === 'failed' ? '#fff' : theme.colors.text}}
			>
				Failed
			</Chip>
		</ScrollView>
	);

	const renderTransactionList = () => (
		<View style={styles.transactionListContainer}>
			{transactions.map((transaction, index) => (
				<TouchableOpacity
					key={transaction.id || index}
					style={[styles.transactionItem, {backgroundColor: theme.colors.surface}]}
					onPress={() => handleViewDetails(transaction)}
				>
					<View style={styles.transactionHeader}>
						<Text style={[styles.transactionTitle, {color: theme.colors.text}]}>
							{transaction.biller || 'Payment'}
						</Text>
						<Chip
							style={{
								backgroundColor: getStatusBackgroundColor(transaction.status),
								height: 21,
								paddingTop:  0,
								borderColor: getStatusBackgroundColor(transaction.status),
							}}
						>
							<Text style={{
								color: getStatusColor(transaction.status),
								fontSize: 10,
								marginTop: 0,
							}}>
								{transaction.status || 'Unknown'}
							</Text>
						</Chip>
					</View>

					<View style={styles.transactionDetails}>
						<View style={styles.transactionDetail}>
							<Text style={{color: theme.colors.text, opacity: 0.7}}>Date:</Text>
							<Text style={{color: theme.colors.text}}>
								{transaction.created_at ? format(new Date(transaction.created_at), 'MMM dd, yyyy') : 'N/A'}
							</Text>
						</View>

						<View style={styles.transactionDetail}>
							<Text style={{color: theme.colors.text, opacity: 0.7}}>Amount:</Text>
							<Text style={{color: getStatusColor(transaction.status), fontWeight: 'bold'}}>
								₦{(transaction.amount?.toFixed(2) || 0.00).toLocaleString("en-US")}
							</Text>
						</View>

						{transaction.reference && (
							<View style={styles.transactionDetail}>
								<Text style={{color: theme.colors.text, opacity: 0.7}}>Reference:</Text>
								<Text style={{color: theme.colors.text}}>{transaction.reference}</Text>
							</View>
						)}
					</View>

					<View style={styles.viewDetailsContainer}>
						<Text style={{color: getStatusColor(transaction.status)}}>View Details</Text>
						<Ionicons name="chevron-forward" size={16} color={getStatusColor(transaction.status)}/>
					</View>
				</TouchableOpacity>
			))}
		</View>
	);

	const renderPagination = () => (
		<View style={styles.paginationContainer}>
			<Button
				mode="outlined"
				onPress={() => setPage(Math.max(1, page - 1))}
				disabled={page === 1 || loading}
				style={styles.paginationButton}
				labelStyle={{color: theme.colors.primary}}
			>
				Previous
			</Button>
			<Text style={{color: theme.colors.text}}>
				Page {page} of {totalPages}
			</Text>
			<Button
				mode="outlined"
				onPress={() => setPage(Math.min(totalPages, page + 1))}
				disabled={page === totalPages || loading}
				style={styles.paginationButton}
				labelStyle={{color: theme.colors.primary}}
			>
				Next
			</Button>
		</View>
	);

	const renderTransactionModal = () => (
		<Modal
			visible={modalVisible}
			transparent={true}
			animationType="slide"
			onRequestClose={() => setModalVisible(false)}
		>
			<View style={styles.modalOverlay}>
				<View style={[styles.modalContent, {backgroundColor: theme.colors.background}]}>
					<View style={styles.modalHeader}>
						<Text style={[styles.modalTitle, {color: theme.colors.text}]}>Transaction Details</Text>
						<TouchableOpacity onPress={() => setModalVisible(false)}>
							<Ionicons name="close" size={24} color={theme.colors.text}/>
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.modalBody}>
						{selectedTransaction && (
							<>
								<View
									style={[styles.statusContainer, {backgroundColor: getStatusBackgroundColor(selectedTransaction.status)}]}>
									<Text
										style={[styles.statusText, {color: getStatusColor(selectedTransaction.status)}]}>
										{selectedTransaction.status || 'Unknown'}
									</Text>
								</View>

								<View style={styles.detailSection}>
									<Text style={[styles.detailSectionTitle, {color: theme.colors.text}]}>Payment
										Information</Text>

									<View style={styles.detailItem}>
										<Text style={{color: theme.colors.text, opacity: 0.7}}>Biller:</Text>
										<Text
											style={{color: theme.colors.text}}>{selectedTransaction.biller || 'N/A'}</Text>
									</View>

									<View style={styles.detailItem}>
										<Text style={{color: theme.colors.text, opacity: 0.7}}>Service:</Text>
										<Text
											style={{color: theme.colors.text}}>{selectedTransaction.bill_item || 'N/A'}</Text>
									</View>

									<View style={styles.detailItem}>
										<Text style={{color: theme.colors.text, opacity: 0.7}}>Amount:</Text>
										<Text style={{color: theme.colors.primary, fontWeight: 'bold'}}>
											₦{selectedTransaction.amount?.toFixed(2) || '0.00'}
										</Text>
									</View>

									<View style={styles.detailItem}>
										<Text style={{color: theme.colors.text, opacity: 0.7}}>Date:</Text>
										<Text style={{color: theme.colors.text}}>
											{selectedTransaction.created_at ? format(new Date(selectedTransaction.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
										</Text>
									</View>
								</View>

								<Divider style={styles.divider}/>

								<View style={styles.detailSection}>
									<Text style={[styles.detailSectionTitle, {color: theme.colors.text}]}>Transaction
										Details</Text>

									<View style={styles.detailItem}>
										<Text style={{color: theme.colors.text, opacity: 0.7}}>Reference:</Text>
										<Text
											style={{color: theme.colors.text}}>{selectedTransaction.reference || 'N/A'}</Text>
									</View>

									<View style={styles.detailItem}>
										<Text style={{color: theme.colors.text, opacity: 0.7}}>Payment Method:</Text>
										<Text
											style={{color: theme.colors.text}}>{selectedTransaction.payment_method || 'N/A'}</Text>
									</View>

									{selectedTransaction.customer_id && (
										<View style={styles.detailItem}>
											<Text style={{color: theme.colors.text, opacity: 0.7}}>Customer ID:</Text>
											<Text
												style={{color: theme.colors.text}}>{selectedTransaction.customer_id}</Text>
										</View>
									)}
								</View>

								<Button
									mode="contained"
									onPress={() => {
										// Download receipt functionality would go here
										// For now, just close the modal
										setModalVisible(false);
									}}
									style={[styles.downloadButton, {backgroundColor: theme.colors.primary}]}
									labelStyle={{color: theme.colors.accent}}
									icon="download"
								>
									Download Receipt
								</Button>
							</>
						)}
					</ScrollView>
				</View>
			</View>
		</Modal>
	);

	return (
		<View style={[styles.container, {backgroundColor: theme.colors.background}]}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={[theme.colors.primary]}
						tintColor={theme.colors.primary}
					/>
				}
			>
				<Text style={[styles.title, {color: theme.colors.text}]}>Transaction History</Text>

				<Searchbar
					placeholder="Search transactions..."
					onChangeText={setSearchQuery}
					value={searchQuery}
					onSubmitEditing={handleSearch}
					style={[styles.searchBar, {backgroundColor: theme.colors.surface}]}
					inputStyle={{color: theme.colors.text}}
					iconColor={theme.colors.text}
					placeholderTextColor="rgba(255, 255, 255, 0.5)"
				/>

				{renderStatusFilters()}

				{loading && !refreshing ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator color={theme.colors.primary} size="large"/>
					</View>
				) : error ? (
					<Text style={{color: theme.colors.error, textAlign: 'center', marginTop: 20}}>{error}</Text>
				) : transactions.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Ionicons name="document-text-outline" size={50} color={theme.colors.text}/>
						<Text style={{color: theme.colors.text, textAlign: 'center', marginTop: 10}}>
							No transactions found
						</Text>
					</View>
				) : (
					<>
						{renderTransactionList()}
						{renderPagination()}
					</>
				)}
			</ScrollView>

			{renderTransactionModal()}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		flexGrow: 1,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	searchBar: {
		marginBottom: 16,
		elevation: 2,
	},
	filtersContainer: {
		marginBottom: 16
	},
	filtersContent: {
		paddingRight: 16,
	},
	filterChip: {
		marginRight: 8,
		height: 30
	},
	transactionListContainer: {
		marginBottom: 16,
	},
	transactionItem: {
		borderRadius: 8,
		padding: 16,
		marginBottom: 12,
		elevation: 2,
	},
	transactionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	transactionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	transactionDetails: {
		marginBottom: 12,
	},
	transactionDetail: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 4,
	},
	viewDetailsContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	paginationContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 16,
	},
	paginationButton: {
		minWidth: 100,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 50,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 50,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '90%',
		maxHeight: '80%',
		borderRadius: 12,
		elevation: 5,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	modalBody: {
		padding: 16,
	},
	statusContainer: {
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 16,
	},
	statusText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	detailSection: {
		marginBottom: 16,
	},
	detailSectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	detailItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	divider: {
		marginVertical: 16,
	},
	downloadButton: {
		marginTop: 16,
		marginBottom: 24,
	},
});
