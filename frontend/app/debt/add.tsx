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
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { debtStorage, settingsStorage, Settings, getCurrencySymbol } from '../../utils/storage';
import { generateId, formatDate } from '../../utils/helpers';
import { scheduleDebtReminder, requestNotificationPermissions } from '../../utils/notifications';
import Input from '../../components/Input';
import Button from '../../components/Button';
import CurrencySelector from '../../components/CurrencySelector';

export default function AddDebtScreen() {
  const router = useRouter();
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<'لنا' | 'علينا'>('لنا');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [dueDate, setDueDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settingsData = await settingsStorage.get();
    setSettings(settingsData);
    setCurrency(settingsData.currency); // Set default currency from settings
  };

  const handleSave = async () => {
    // Validation
    if (!personName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الشخص');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    setLoading(true);
    try {
      const newDebt = {
        id: generateId(),
        personName: personName.trim(),
        type,
        totalAmount: parseFloat(amount),
        currency: currency as any, // إضافة العملة
        dueDate: dueDate.toISOString(),
        status: 'نشط' as const,
        notes: notes.trim() || undefined,
      };

      await debtStorage.add(newDebt);

      // Schedule notifications if enabled
      if (settings.notificationsEnabled) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await scheduleDebtReminder(newDebt);
        }
      }

      router.back();
    } catch (error) {
      Alert.alert('خطأ', 'فشل حفظ الدين');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Person Name */}
          <Input
            label="اسم الشخص"
            placeholder="أدخل اسم الشخص"
            value={personName}
            onChangeText={setPersonName}
          />

          {/* Type Selection */}
          <View style={styles.typeSection}>
            <Text style={styles.label}>النوع</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'لنا' && styles.typeButtonActiveGreen,
                ]}
                onPress={() => setType('لنا')}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={24}
                  color={type === 'لنا' ? COLORS.white : COLORS.secondary}
                />
                <Text
                  style={[
                    styles.typeText,
                    type === 'لنا' && styles.typeTextActive,
                  ]}
                >
                  لنا (مستحق)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'علينا' && styles.typeButtonActiveRed,
                ]}
                onPress={() => setType('علينا')}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={24}
                  color={type === 'علينا' ? COLORS.white : COLORS.danger}
                />
                <Text
                  style={[
                    styles.typeText,
                    type === 'علينا' && styles.typeTextActive,
                  ]}
                >
                  علينا (مطلوب)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount */}
          <Input
            label="المبلغ"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          {/* Currency Selector */}
          <CurrencySelector
            label="العملة"
            selected={currency}
            onSelect={setCurrency}
          />

          {/* Due Date */}
          <View style={styles.dateSection}>
            <Text style={styles.label}>تاريخ الاستحقاق</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.dateText}>{formatDate(dueDate.toISOString())}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          )}

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

          {/* Info Box */}
          {settings.notificationsEnabled && (
            <View style={styles.infoBox}>
              <Ionicons name="notifications" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                ستتلقى تذكيراً قبل يومين من موعد الاستحقاق وفي يوم الاستحقاق
              </Text>
            </View>
          )}

          {/* Save Button */}
          <Button
            title="حفظ الدين"
            onPress={handleSave}
            loading={loading}
            size="large"
            style={styles.saveButton}
          />
        </ScrollView>
        </TouchableWithoutFeedback>
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
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  typeSection: {
    marginBottom: SPACING.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeButtonActiveGreen: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  typeButtonActiveRed: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  typeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeTextActive: {
    color: COLORS.white,
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
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primaryLight,
    flex: 1,
    textAlign: 'right',
  },
  saveButton: {
    marginTop: SPACING.lg,
  },
});
