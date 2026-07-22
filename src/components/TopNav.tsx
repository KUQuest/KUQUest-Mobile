import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TopNav() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KUQUEST</Text>
      <MaterialCommunityIcons name="shield-check" size={28} color="#01531D" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#01531D',
    letterSpacing: -1,
  },
});
