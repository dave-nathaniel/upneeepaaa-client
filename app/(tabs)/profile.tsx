import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ActivityIndicator, TextInput, Switch, Divider, Avatar } from 'react-native-paper';
import { useTheme } from '../../src/context/ThemeContext';
import { userAPI } from '../../src/utils/apiClient';
import { useForm, Controller } from 'react-hook-form';
import AuthContext from '../../src/context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ProfileScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { authUser, doLogout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState(null);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);

  // Password visibility
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Forms
  const { control: personalControl, handleSubmit: handlePersonalSubmit, formState: { errors: personalErrors }, setValue: setPersonalValue } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
    }
  });

  const { control: passwordControl, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, watch: passwordWatch, reset: resetPassword } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const newPassword = passwordWatch('newPassword');

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      setPersonalValue('name', profileData.name || '');
      setPersonalValue('phone', profileData.phone || '');
      setPersonalValue('address', profileData.address || '');
      setEmailNotifications(profileData.email_notifications !== false);
      setSmsNotifications(profileData.sms_notifications !== false);
    }
  }, [profileData]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userAPI.getProfile();
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await userAPI.updateProfile({
        ...data,
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications
      });

      setSuccess('Profile updated successfully');
      fetchProfileData(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await userAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      setSuccess('Password changed successfully');
      resetPassword(); // Clear password form
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password. Please check your current password and try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await userAPI.updateProfile({
        ...profileData,
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications
      });

      setSuccess('Notification preferences updated successfully');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setError('Failed to update notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInfoTab = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.background }]}>
      <Card.Content>
        <Controller
          control={personalControl}
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Full Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              mode="outlined"
              error={!!personalErrors.name}
              theme={theme}
            />
          )}
          name="name"
        />
        {personalErrors.name && <Text style={styles.errorText}>{personalErrors.name.message}</Text>}

        <Controller
          control={personalControl}
          rules={{
            pattern: {
              value: /^[0-9+\s-]{10,15}$/,
              message: 'Invalid phone number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Phone Number"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              error={!!personalErrors.phone}
              theme={theme}
            />
          )}
          name="phone"
        />
        {personalErrors.phone && <Text style={styles.errorText}>{personalErrors.phone.message}</Text>}

        <Controller
          control={personalControl}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              theme={theme}
            />
          )}
          name="address"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>{success}</Text>}
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="contained"
          onPress={handlePersonalSubmit(updateProfile)}
          disabled={loading}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          labelStyle={{ color: theme.colors.accent }}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.accent} size="small" />
          ) : (
            'Save Changes'
          )}
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderPasswordTab = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.background }]}>
      <Card.Content>
        <Controller
          control={passwordControl}
          rules={{ required: 'Current password is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Current Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!currentPasswordVisible}
              right={
                <TextInput.Icon
                  icon={currentPasswordVisible ? 'eye-off' : 'eye'}
                  onPress={() => setCurrentPasswordVisible(!currentPasswordVisible)}
                />
              }
              error={!!passwordErrors.currentPassword}
              theme={theme}
            />
          )}
          name="currentPassword"
        />
        {passwordErrors.currentPassword && <Text style={styles.errorText}>{passwordErrors.currentPassword.message}</Text>}

        <Controller
          control={passwordControl}
          rules={{
            required: 'New password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="New Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!newPasswordVisible}
              right={
                <TextInput.Icon
                  icon={newPasswordVisible ? 'eye-off' : 'eye'}
                  onPress={() => setNewPasswordVisible(!newPasswordVisible)}
                />
              }
              error={!!passwordErrors.newPassword}
              theme={theme}
            />
          )}
          name="newPassword"
        />
        {passwordErrors.newPassword && <Text style={styles.errorText}>{passwordErrors.newPassword.message}</Text>}

        <Controller
          control={passwordControl}
          rules={{
            required: 'Please confirm your new password',
            validate: value => value === newPassword || 'Passwords do not match'
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Confirm New Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!confirmPasswordVisible}
              right={
                <TextInput.Icon
                  icon={confirmPasswordVisible ? 'eye-off' : 'eye'}
                  onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                />
              }
              error={!!passwordErrors.confirmPassword}
              theme={theme}
            />
          )}
          name="confirmPassword"
        />
        {passwordErrors.confirmPassword && <Text style={styles.errorText}>{passwordErrors.confirmPassword.message}</Text>}

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>{success}</Text>}
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="contained"
          onPress={handlePasswordSubmit(updatePassword)}
          disabled={loading}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          labelStyle={{ color: theme.colors.accent }}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.accent} size="small" />
          ) : (
            'Change Password'
          )}
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderNotificationsTab = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.background }]}>
      <Card.Content>
        <View style={styles.notificationItem}>
          <Text style={{ color: theme.colors.text }}>Email Notifications</Text>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.notificationItem}>
          <Text style={{ color: theme.colors.text }}>SMS Notifications</Text>
          <Switch
            value={smsNotifications}
            onValueChange={setSmsNotifications}
            color={theme.colors.primary}
          />
        </View>

        <Divider style={{ marginVertical: 16 }} />

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>

        <View style={styles.notificationItem}>
          <Text style={{ color: theme.colors.text }}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            color={theme.colors.primary}
          />
        </View>

        <Text style={[styles.notificationDescription, { color: theme.colors.text, opacity: 0.7 }]}>
          You will receive notifications about payments, subscriptions, and account updates.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>{success}</Text>}
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="contained"
          onPress={updateNotificationPreferences}
          disabled={loading}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          labelStyle={{ color: theme.colors.accent }}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.accent} size="small" />
          ) : (
            'Save Preferences'
          )}
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={80} 
            label={authUser?.name?.split(' ').map(n => n[0]).join('') || 'U'} 
            style={{ backgroundColor: theme.colors.primary }}
            labelStyle={{ color: theme.colors.accent }}
          />
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {authUser?.name || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.text, opacity: 0.7 }]}>
            {authUser?.email || 'user@example.com'}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'personal' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab('personal')}
          >
            <Text style={{ 
              color: activeTab === 'personal' ? theme.colors.primary : theme.colors.text,
              fontWeight: activeTab === 'personal' ? 'bold' : 'normal'
            }}>
              Personal Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'password' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab('password')}
          >
            <Text style={{ 
              color: activeTab === 'password' ? theme.colors.primary : theme.colors.text,
              fontWeight: activeTab === 'password' ? 'bold' : 'normal'
            }}>
              Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'notifications' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={{ 
              color: activeTab === 'notifications' ? theme.colors.primary : theme.colors.text,
              fontWeight: activeTab === 'notifications' ? 'bold' : 'normal'
            }}>
              Notifications
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !profileData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <>
            {activeTab === 'personal' && renderPersonalInfoTab()}
            {activeTab === 'password' && renderPasswordTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
          </>
        )}

        <Button
          mode="outlined"
          onPress={doLogout}
          style={styles.logoutButton}
          labelStyle={{ color: theme.colors.error }}
          icon="logout"
        >
          Logout
        </Button>
      </ScrollView>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  cardActions: {
    justifyContent: 'flex-end',
    padding: 16,
  },
  button: {
    minWidth: 120,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
  },
  successText: {
    color: '#51cf66',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationDescription: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 16,
    marginBottom: 24,
    borderColor: '#ff6b6b',
  },
});
