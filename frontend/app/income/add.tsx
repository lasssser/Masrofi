import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { incomeStorage, settingsStorage, Settings } from '../../utils/storage';
import { generateId, formatDate } from '../../utils/helpers';
import Input from '../../components/Input';
import Button from '../../components/Button';

const INCOME_SOURCES = [
  { id: 'salary', label: 'راتب', icon: 'briefcase' },
  { id: 'freelance', label: 'عمل حر', icon: 'laptop' },
  { id: 'business', label: 'تجارة', icon: 'storefront' },
  { id: 'investment', label: 'استثمار', icon: 'trending-up' },
  { id: 'gift', label: 'هدية', icon: 'gift' },
  { id: 'other', label: 'أخرى', icon: 'cash' },
];

export default function AddIncomeScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('salary');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'biweekly'>('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settingsData = await settingsStorage.get();
    setSettings(settingsData);
  };

  const handleSave = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال وصف الدخل');
      return;
    }

    setLoading(true);
    try {
      await incomeStorage.add({
        id: generateId(),
        title: title.trim(),
        amount: parseFloat(amount),
        date: date.toISOString(),
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert('خطأ', 'فشل حفظ الدخل');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Card */}
          <LinearGradient
            colors={COLORS.gradients.success}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.amountCard}
          >
            <Text style={styles.amountLabel}>المبلغ</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>
                {settings.currency === 'TRY' ? '₺' : settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : 'ل.س'}
              </Text>
              <Input
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                containerStyle={styles.amountInputWrapper}
                style={styles.amountInput}
              />
            </View>
          </LinearGradient>

          {/* Title */}
          <Input
            label="الوصف"
            placeholder="مثل: راتب شهر يونيو..."
            value={title}
            onChangeText={setTitle}
          />

          {/* Source */}
          <View style={styles.sourceSection}>
            <Text style={styles.label}>المصدر</Text>
            <View style={styles.sourceGrid}>
              {INCOME_SOURCES.map(src => (
                <TouchableOpacity
                  key={src.id}
                  style={[
                    styles.sourceItem,
                    source === src.id && styles.sourceItemActive,
                  ]}
                  onPress={() => setSource(src.id)}
                >
                  <View
                    style={[
                      styles.sourceIcon,
                      {
                        backgroundColor:
                          source === src.id ? COLORS.secondary : COLORS.surface,
                      },
                    ]}
                  >
                    <Ionicons
                      name={src.icon as any}
                      size={20}
                      color={source === src.id ? COLORS.white : COLORS.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.sourceLabel,
                      source === src.id && styles.sourceLabelActive,
                    ]}
                  >
                    {src.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={styles.dateSection}>
            <Text style={styles.label}>التاريخ</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={COLORS.secondary} />
              <Text style={styles.dateText}>{formatDate(date.toISOString())}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Recurring Toggle */}
          <View style={styles.toggleSection}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsRecurring(!isRecurring)}
            >
              <View style={styles.toggleInfo}>
                <Ionicons 
                  name="repeat" 
                  size={22} 
                  color={isRecurring ? COLORS.secondary : COLORS.textMuted} 
                />
                <View>
                  <Text style={styles.toggleLabel}>دخل متكرر</Text>
                  <Text style={styles.toggleSubtitle}>يتكرر تلقائياً</Text>
                </View>
              </View>
              <View style={[styles.toggle, isRecurring && styles.toggleActive]}>
                <View style={[styles.toggleCircle, isRecurring && styles.toggleCircleActive]} />
              </View>
            </TouchableOpacity>

            {isRecurring && (
              <View style={styles.frequencyOptions}>
                <TouchableOpacity
                  style={[styles.frequencyOption, frequency === 'weekly' && styles.frequencyOptionActive]}
                  onPress={() => setFrequency('weekly')}
                >
                  <Text style={[styles.frequencyText, frequency === 'weekly' && styles.frequencyTextActive]}>
                    أسبوعي
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.frequencyOption, frequency === 'biweekly' && styles.frequencyOptionActive]}
                  onPress={() => setFrequency('biweekly')}
                >
                  <Text style={[styles.frequencyText, frequency === 'biweekly' && styles.frequencyTextActive]}>
                    كل أسبوعين
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.frequencyOption, frequency === 'monthly' && styles.frequencyOptionActive]}
                  onPress={() => setFrequency('monthly')}
                >
                  <Text style={[styles.frequencyText, frequency === 'monthly' && styles.frequencyTextActive]}>
                    شهري
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Notes */}
          <Input
            label="ملاحظات (اختياري)"
            placeholder="أضف ملاحظات إضافية..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          {/* Save Button */}
          <Button
            title="حفظ الدخل"
            onPress={handleSave}
            loading={loading}
            variant="secondary"
            size="large"
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  amountCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: FONT_SIZES.xxxl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  amountInputWrapper: {
    marginBottom: 0,
  },
  amountInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    fontSize: FONT_SIZES.hero,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'center',
    minWidth: 150,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  sourceSection: {
    marginBottom: SPACING.md,
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sourceItem: {
    width: '30%',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundLight,
  },
  sourceItemActive: {
    backgroundColor: COLORS.secondary + '20',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  sourceLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sourceLabelActive: {
    color: COLORS.secondary,
    fontFamily: FONTS.semiBold,
  },
  dateSection: {
    marginBottom: SPACING.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  toggleSection: {
    marginBottom: SPACING.md,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  toggleLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  toggleSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundLight,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.secondary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textMuted,
  },
  toggleCircleActive: {
    backgroundColor: COLORS.white,
    marginLeft: 'auto',
  },
  frequencyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frequencyOptionActive: {
    backgroundColor: COLORS.secondary + '20',
    borderColor: COLORS.secondary,
  },
  frequencyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  frequencyTextActive: {
    color: COLORS.secondary,
  },
  saveButton: {
    marginTop: SPACING.lg,
  },
});
