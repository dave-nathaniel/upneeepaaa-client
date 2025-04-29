import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Divider, Chip, Dialog, Portal, Paragraph } from 'react-native-paper';
import { useTheme } from '../../src/context/ThemeContext';
import { paymentAPI } from '../../src/utils/apiClient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentAPI.getUserSubscriptions();
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Failed to load subscriptions. Please try again.');
      setSubscriptions([]); // Ensure subscriptions is always an array even on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions();
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      setCancelLoading(true);
      await paymentAPI.cancelSubscription(selectedSubscription.id);

      // Update the subscription status in the local state
      if (subscriptions && Array.isArray(subscriptions)) {
        setSubscriptions(subscriptions.map(sub => 
          sub.id === selectedSubscription.id 
            ? { ...sub, status: 'cancelled' } 
            : sub
        ));
      }

      setCancelDialogVisible(false);
      setSelectedSubscription(null);

      Alert.alert(
        "Subscription Cancelled",
        "Your subscription has been successfully cancelled."
      );
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      Alert.alert(
        "Error",
        "Failed to cancel subscription. Please try again."
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4caf50'; // Green
      case 'pending':
        return '#ff9800'; // Orange
      case 'cancelled':
        return '#f44336'; // Red
      case 'expired':
        return '#9e9e9e'; // Grey
      default:
        return theme.colors.text;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="calendar-outline" size={80} color={theme.colors.text} style={{ opacity: 0.5 }} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
        No Active Subscriptions
      </Text>
      <Text style={[styles.emptyStateDescription, { color: theme.colors.text, opacity: 0.7 }]}>
        You don't have any active subscriptions yet.
      </Text>
      <Button
        mode="contained"
        onPress={() => router.push('/bill-payment')}
        style={[styles.button, { backgroundColor: theme.colors.primary, marginTop: 20 }]}
        labelStyle={{ color: theme.colors.accent }}
      >
        Pay Bills
      </Button>
    </View>
  );

  const renderSubscriptionCard = (subscription) => (
    <Card 
      key={subscription.id} 
      style={[styles.card, { backgroundColor: theme.colors.background }]}
    >
      <Card.Content>
        <View style={styles.subscriptionHeader}>
          <View>
            <Text style={[styles.subscriptionTitle, { color: theme.colors.text }]}>
              {subscription.service_name}
            </Text>
            <Text style={{ color: theme.colors.text, opacity: 0.7 }}>
              {subscription.package_name}
            </Text>
          </View>
          <Chip 
            style={{ backgroundColor: 'transparent', borderColor: getStatusColor(subscription.status) }}
            textStyle={{ color: getStatusColor(subscription.status) }}
          >
            {subscription.status}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={{ color: theme.colors.text, opacity: 0.7 }}>Subscription ID:</Text>
            <Text style={{ color: theme.colors.text }}>{subscription.reference}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={{ color: theme.colors.text, opacity: 0.7 }}>Amount:</Text>
            <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
              ₦{parseFloat(subscription.amount).toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={{ color: theme.colors.text, opacity: 0.7 }}>Billing Cycle:</Text>
            <Text style={{ color: theme.colors.text }}>{subscription.billing_cycle || 'Monthly'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={{ color: theme.colors.text, opacity: 0.7 }}>Next Payment:</Text>
            <Text style={{ color: theme.colors.text }}>{formatDate(subscription.next_payment_date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={{ color: theme.colors.text, opacity: 0.7 }}>Start Date:</Text>
            <Text style={{ color: theme.colors.text }}>{formatDate(subscription.start_date)}</Text>
          </View>
        </View>
      </Card.Content>

      {subscription.status.toLowerCase() === 'active' && (
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setSelectedSubscription(subscription);
              setCancelDialogVisible(true);
            }}
            style={[styles.button, { borderColor: theme.colors.error }]}
            labelStyle={{ color: theme.colors.error }}
          >
            Cancel Subscription
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/bill-payment')}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ color: theme.colors.accent }}
          >
            Renew
          </Button>
        </Card.Actions>
      )}
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>My Subscriptions</Text>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={{ color: theme.colors.error, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
            <Button
              mode="contained"
              onPress={fetchSubscriptions}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              labelStyle={{ color: theme.colors.accent }}
            >
              Retry
            </Button>
          </View>
        ) : !subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0 ? (
          renderEmptyState()
        ) : (
          subscriptions.map(renderSubscriptionCard)
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={cancelDialogVisible}
          onDismiss={() => setCancelDialogVisible(false)}
          style={{ backgroundColor: theme.colors.background }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>Cancel Subscription</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.text }}>
              Are you sure you want to cancel your subscription to {selectedSubscription?.service_name}? 
              This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setCancelDialogVisible(false)}
              disabled={cancelLoading}
            >
              No, Keep It
            </Button>
            <Button 
              onPress={handleCancelSubscription}
              loading={cancelLoading}
              color={theme.colors.error}
            >
              Yes, Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardActions: {
    justifyContent: 'space-between',
    padding: 16,
  },
  button: {
    minWidth: 120,
  },
});
