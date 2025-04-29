import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../src/context/ThemeContext';
import AuthGuard from '../../src/components/AuthGuard';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: theme.colors.text,
          tabBarStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="bill-payment"
          options={{
            title: 'Pay Bills',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'cash' : 'cash-outline'} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="subscription"
          options={{
            title: 'Subscriptions',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'list' : 'list-outline'} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
            ),
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
