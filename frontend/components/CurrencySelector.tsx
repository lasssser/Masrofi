import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { CURRENCIES } from '../utils/storage';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

interface CurrencySelectorProps {
  selected: string;
  onSelect: (currency: string) => void;
  label?: string;
}

export default function CurrencySelector({ selected, onSelect, label }: CurrencySelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CURRENCIES.map(currency => (
          <TouchableOpacity
            key={currency.code}
            style={[
              styles.currencyItem,
              { 
                backgroundColor: selected === currency.code ? colors.primary + '20' : colors.surface,
                borderColor: selected === currency.code ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(currency.code)}
          >
            <Text style={styles.flag}>{currency.flag}</Text>
            <Text 
              style={[
                styles.currencyCode, 
                { color: selected === currency.code ? colors.primary : colors.text }
              ]}
            >
              {currency.symbol}
            </Text>
            <Text 
              style={[
                styles.currencyLabel, 
                { color: selected === currency.code ? colors.primary : colors.textMuted }
              ]}
            >
              {currency.code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  scrollContent: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  currencyItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    minWidth: 70,
  },
  flag: {
    fontSize: 20,
    marginBottom: 4,
  },
  currencyCode: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  currencyLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
});
