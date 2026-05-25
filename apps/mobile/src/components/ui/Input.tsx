import { useState } from 'react';
import {
  TextInput,
  type TextInputProps,
  View,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radii, fontFamily } from '@/lib/theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  multiline?: boolean;
}

export function Input({
  label,
  helper,
  error,
  multiline = false,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="caption" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...props}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor="rgba(42, 51, 40, 0.35)"
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          error && styles.error,
          style,
        ]}
      />
      {error ? (
        <Text variant="muted" color="#B85450" style={styles.helper}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="muted" style={styles.helper}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing[1],
  },
  label: {
    marginLeft: spacing[1],
    color: '#5C6B5A',
  },
  input: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
    backgroundColor: colors.bone,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 59, 46, 0.10)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    minHeight: 48,
  },
  multiline: {
    minHeight: 120,
    paddingTop: spacing[3],
    textAlignVertical: 'top',
  },
  focused: {
    borderColor: colors.noemaSage,
  },
  error: {
    borderColor: '#B85450',
  },
  helper: {
    marginLeft: spacing[1],
    marginTop: spacing[1],
  },
});
