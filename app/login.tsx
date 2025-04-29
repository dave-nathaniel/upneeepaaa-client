import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import AuthContext from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import ThemedTextInput from '../src/components/ThemedTextInput';

type FormData = {
  username: string;
  password: string;
};

export default function LoginScreen() {
  const { doLogin, loading } = useContext(AuthContext);
  const { theme } = useTheme();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      username: '',
      password: '',
    }
  });

  const onSubmit = async (data: FormData) => {
    await doLogin(data);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: theme.colors.primary }]}>UpNeeePaaa</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Login</Text>

            <Controller
              control={control}
              rules={{
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedTextInput
                  label="Username"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                  autoCapitalize="none"
                  error={!!errors.username}
                />
              )}
              name="username"
            />
            {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}

            <Controller
              control={control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ThemedTextInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry={secureTextEntry}
                  right={
                    <ThemedTextInput.Icon
                      icon={secureTextEntry ? 'eye' : 'eye-off'}
                      onPress={() => setSecureTextEntry(!secureTextEntry)}
                    />
                  }
                  error={!!errors.password}
                />
              )}
              name="password"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

            <TouchableOpacity style={styles.forgotPassword}>
              <Link href="/password-reset" style={{ color: theme.colors.primary }}>
                Forgot Password?
              </Link>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              labelStyle={{ color: theme.colors.accent }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.accent} size="small" />
              ) : (
                'Login'
              )}
            </Button>

            <View style={styles.signupContainer}>
              <Text style={{ color: theme.colors.text }}>Don't have an account? </Text>
              <Link href="/signup" style={{ color: theme.colors.primary }}>
                Sign Up
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
    width: 100,
    height: 100,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  button: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});
