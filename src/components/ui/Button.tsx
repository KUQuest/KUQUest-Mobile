import React from 'react';
import { StyleProp, TouchableOpacityProps, ViewStyle } from 'react-native';

import { cn } from '@/tw/cn';
import { Text, TouchableOpacity } from '@/tw';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ variant = 'primary', children, className, style, ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = Boolean(props.disabled);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={cn(
        'w-full min-h-[44px] flex-row items-center justify-center gap-ku-sm rounded-ku-pill px-ku-md py-[14px]',
        isPrimary ? 'bg-ku-primary' : 'border-2 border-ku-primary bg-transparent',
        isDisabled && 'opacity-[0.55]',
        className,
      )}
      style={style}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          className={cn(
            'font-ku-semibold text-ku-body',
            isPrimary ? 'text-ku-white' : 'text-ku-primary',
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
