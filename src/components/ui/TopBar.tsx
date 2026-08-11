import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from './topBarStyles';

interface TopBarProps {
  onBackPress?: () => void;
}

export function TopBar({ onBackPress }: TopBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBackPress}
        style={styles.backButton}
      >
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.logo}>KUQUEST</Text>
      <View style={styles.spacer} />
    </View>
  );
}
