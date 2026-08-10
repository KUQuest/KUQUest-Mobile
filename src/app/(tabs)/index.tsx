import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@expo/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../auth/AuthService';

export default function HomepageStub() {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Homepage (Stub)</Text>
        <Text style={styles.subtitle}>Welcome to KUQuest!</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            variant="outlined" 
            label="Logout" 
            onPress={handleLogout} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'NotoSansThai',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#014925',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'NotoSansThai',
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 200,
  }
});
