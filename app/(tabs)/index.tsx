import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { dashboardAPI, paymentAPI } from '../../src/utils/apiClient';
import AuthContext from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { format } from 'date-fns';
import Ionicons from '@expo/vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { authUser } = useContext(AuthContext);
  const [usageData, setUsageData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch usage data
      const usageResponse = {};//await dashboardAPI.getUsageData(timeRange);
      setUsageData(usageResponse);
      
      // Fetch recent transactions
      const transactionsResponse = await dashboardAPI.getTransactions();
      setTransactions(transactionsResponse.transactions?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Helper function to get color based on transaction status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
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

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 211, 61, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  // Mock data for the chart if real data is not available
  const mockChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43, 50],
        color: (opacity = 1) => `rgba(255, 211, 61, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Format the chart data from the API response
  const formatChartData = () => {
    if (!usageData || !usageData.data || !usageData.labels) {
      return mockChartData;
    }

    return {
      labels: usageData.labels,
      datasets: [
        {
          data: usageData.data,
          color: (opacity = 1) => `rgba(255, 211, 61, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <Chip
        selected={timeRange === 'day'}
        onPress={() => setTimeRange('day')}
        style={[styles.chip, timeRange === 'day' && { backgroundColor: theme.colors.primary }]}
        textStyle={{ color: timeRange === 'day' ? theme.colors.accent : theme.colors.text }}
      >
        Day
      </Chip>
      <Chip
        selected={timeRange === 'week'}
        onPress={() => setTimeRange('week')}
        style={[styles.chip, timeRange === 'week' && { backgroundColor: theme.colors.primary }]}
        textStyle={{ color: timeRange === 'week' ? theme.colors.accent : theme.colors.text }}
      >
        Week
      </Chip>
      <Chip
        selected={timeRange === 'month'}
        onPress={() => setTimeRange('month')}
        style={[styles.chip, timeRange === 'month' && { backgroundColor: theme.colors.primary }]}
        textStyle={{ color: timeRange === 'month' ? theme.colors.accent : theme.colors.text }}
      >
        Month
      </Chip>
    </View>
  );

  const renderUsageChart = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Title title="Power Usage" titleStyle={{ color: theme.colors.text }} />
      <Card.Content>
        {renderTimeRangeSelector()}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : error ? (
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        ) : (
          <LineChart
            data={formatChartData()}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        )}
      </Card.Content>
    </Card>
  );

  const renderQuickActions = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Title title="Quick Actions" titleStyle={{ color: theme.colors.text }} />
      <Card.Content>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/bill-payment')}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="cash-outline" size={24} color={theme.colors.accent} />
            </View>
            <Text style={{ color: theme.colors.text }}>Pay Bill</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/schedule')}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="calendar-outline" size={24} color={theme.colors.accent} />
            </View>
            <Text style={{ color: theme.colors.text }}>Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/transactions')}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="list-outline" size={24} color={theme.colors.accent} />
            </View>
            <Text style={{ color: theme.colors.text }}>History</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderTransactions = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Title 
        title="Recent Transactions" 
        titleStyle={{ color: theme.colors.text }}
        right={(props) => (
          <Button 
            onPress={() => router.push('/(tabs)/transactions')}
            labelStyle={{ color: theme.colors.primary }}
          >
            View All
          </Button>
        )}
      />
      <Card.Content>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : error ? (
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        ) : transactions.length === 0 ? (
          <Text style={{ color: theme.colors.text, textAlign: 'center', marginVertical: 20 }}>
            No recent transactions
          </Text>
        ) : (
          transactions.map((transaction, index) => (
            <View key={transaction.id || index} style={styles.transactionItem}>
              <View style={styles.transactionDetails}>
                <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                  {transaction.biller_name || 'Payment'}
                </Text>
                <Text style={{ color: theme.colors.text, opacity: 0.7 }}>
                  {transaction.date ? format(new Date(transaction.date), 'MMM dd, yyyy') : 'N/A'}
                </Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text 
                  style={{ 
                    color: getStatusColor(transaction.status),
                    fontWeight: 'bold'
                  }}
                >
                  ₦{transaction.amount?.toFixed(2) || '0.00'}
                </Text>
                <Chip 
                  style={{ 
                    backgroundColor: getStatusBackgroundColor(transaction.status),
                    height: 24
                  }}
                >
                  <Text style={{ color: getStatusColor(transaction.status), fontSize: 10 }}>
                    {transaction.status || 'Unknown'}
                  </Text>
                </Chip>
              </View>
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        {authUser && (
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            Hello, {authUser.name?.split(' ')[0] || 'User'}
          </Text>
        )}
        
        {renderQuickActions()}
        {/*{renderUsageChart()}*/}
        {renderTransactions()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  chip: {
    marginHorizontal: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  quickAction: {
    alignItems: 'center',
    width: 80,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
});