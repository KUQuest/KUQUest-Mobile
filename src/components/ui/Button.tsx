import React from 'react';
import {
  StyleProp,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import styles from './buttonStyles';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = Boolean(props.disabled);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
