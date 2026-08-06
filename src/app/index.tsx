import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import LoginScreen from "../screens/LoginScreen";
import { authService, AuthService } from "../auth/AuthService";
import { RoutingDestination } from "../auth/types";

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const handleNavigate = (dest: RoutingDestination) => {
    // Note: Actual route paths pending full integration and page creation
    if (dest.type === 'HOME') {
      router.replace("/(tabs)" as any);
    } else {
      router.replace(`/onboarding?step=${dest.step}` as any);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const session = await authService.getSession();
        if (session && mounted) {
          handleNavigate(AuthService.getRoutingDestination(session));
          return; // Skip setting isReady so it doesn't briefly flash LoginScreen before routing
        }
      } catch {
        // Ignore error and fall through to show login
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#014925" />
      </View>
    );
  }

  return <LoginScreen onNavigate={handleNavigate} />;
}
