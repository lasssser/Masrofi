import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import {
  incomeStorage,
  financialAnalysis,
  settingsStorage,
  Settings,
  Income,
  recurringExpenseStorage,
  RecurringExpense,
  CATEGORIES,
} from '../../utils/storage';
import { formatCurrency, generateId } from '../../utils/helpers';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function DashboardScreen() {
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });
  const [refreshing, setRefreshing] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [forecast, setForecast] = useState<{
    totalIncome: number;
    expectedExpenses: number;
    recurringExpenses: number;
    dueDebts: number;
    upcomingBills: number;
    estimatedRemaining: number;
    lastMonthAverage: number;
    savingsGoalContributions: number;
  } | null>(null);

  // Form states
  const [incomeTitle, setIncomeTitle] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeRecurring, setIncomeRecurring] = useState(true);

  const [recurringTitle, setRecurringTitle] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringCategory, setRecurringCategory] = useState('bills');
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthName = new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

  const loadData = async () => {
    try {
      const [settingsData, incomesData, recurringData, forecastData] = await Promise.all([
        settingsStorage.get(),
        incomeStorage.getByMonth(currentMonth),
        recurringExpenseStorage.getAll(),
        financialAnalysis.getMonthlyForecast(currentMonth),
      ]);
      setSettings(settingsData);
      setIncomes(incomesData);
      setRecurringExpenses(recurringData.filter(r => r.isActive));
      setForecast(forecastData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddIncome = async () => {
    if (!incomeTitle.trim() || !incomeAmount) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات');
      return;
    }

    await incomeStorage.add({
      id: generateId(),
      title: incomeTitle.trim(),
      amount: parseFloat(incomeAmount),
      date: new Date().toISOString(),
      isRecurring: incomeRecurring,
      frequency: incomeRecurring ? 'monthly' : undefined,
    });

    setShowIncomeModal(false);
    setIncomeTitle('');
    setIncomeAmount('');
    setIncomeRecurring(true);
    loadData();
  };

  const handleAddRecurring = async () => {
    if (!recurringTitle.trim() || !recurringAmount) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات');
      return;
    }

    await recurringExpenseStorage.add({
      id: generateId(),
      title: recurringTitle.trim(),
      amount: parseFloat(recurringAmount),
      category: recurringCategory,
      frequency: recurringFrequency,
      nextDate: new Date().toISOString().split('T')[0],
      isActive: true,
    });

    setShowRecurringModal(false);
    setRecurringTitle('');
    setRecurringAmount('');
    setRecurringCategory('bills');
    setRecurringFrequency('monthly');
    loadData();
  };

  const handleDeleteIncome = async (id: string) => {
    Alert.alert('حذف الدخل', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await incomeStorage.delete(id);
          loadData();
        },
      },
    ]);
  };

  const handleDeleteRecurring = async (id: string) => {
    Alert.alert('حذف المصروف المتكرر', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await recurringExpenseStorage.delete(id);
          loadData();
        },
      },
    ]);
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalRecurring = recurringExpenses.reduce((sum, r) => sum + r.amount, 0);

  const getStatusColor = (remaining: number, income: number) => {
    if (income === 0) return COLORS.textMuted;
    const percentage = (remaining / income) * 100;
    if (percentage >= 30) return COLORS.secondary;
    if (percentage >= 10) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <Text style={styles.headerSubtitle}>التوقعات المالية</Text>
        </View>

        {/* Main Forecast Card */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.forecastCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.forecastHeader}>
            <Ionicons name="analytics-outline" size={28} color={COLORS.white} />
            <Text style={styles.forecastTitle}>الملخص المالي</Text>
          </View>

          <View style={styles.forecastRow}>
            <View style={styles.forecastItem}>
              <Text style={styles.forecastLabel}>الدخل الشهري</Text>
              <Text style={styles.forecastValue}>{formatCurrency(totalIncome, settings.currency)}</Text>
            </View>
            <View style={styles.forecastDivider} />
            <View style={styles.forecastItem}>
              <Text style={styles.forecastLabel}>المتوقع صرفه</Text>
              <Text style={styles.forecastValue}>
                {formatCurrency(forecast?.expectedExpenses || 0, settings.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.remainingContainer}>
            <Text style={styles.remainingLabel}>المتبقي المتوقع</Text>
            <Text style={[
              styles.remainingValue,
              { color: getStatusColor(forecast?.estimatedRemaining || 0, totalIncome) }
            ]}>
              {formatCurrency(forecast?.estimatedRemaining || 0, settings.currency)}
            </Text>
          </View>
        </LinearGradient>

        {/* Breakdown Cards */}
        <View style={styles.breakdownRow}>
          <Card style={styles.breakdownCard}>
            <View style={[styles.breakdownIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="repeat-outline" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.breakdownLabel}>مصاريف متكررة</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(forecast?.recurringExpenses || 0, settings.currency)}
            </Text>
          </Card>

          <Card style={styles.breakdownCard}>
            <View style={[styles.breakdownIcon, { backgroundColor: COLORS.danger + '20' }]}>
              <Ionicons name="card-outline" size={20} color={COLORS.danger} />
            </View>
            <Text style={styles.breakdownLabel}>ديون مستحقة</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(forecast?.dueDebts || 0, settings.currency)}
            </Text>
          </Card>
        </View>

        <View style={styles.breakdownRow}>
          <Card style={styles.breakdownCard}>
            <View style={[styles.breakdownIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.breakdownLabel}>فواتير قادمة</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(forecast?.upcomingBills || 0, settings.currency)}
            </Text>
          </Card>

          <Card style={styles.breakdownCard}>
            <View style={[styles.breakdownIcon, { backgroundColor: COLORS.secondary + '20' }]}>
              <Ionicons name="trending-up-outline" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.breakdownLabel}>متوسط الشهر السابق</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(forecast?.lastMonthAverage || 0, settings.currency)}
            </Text>
          </Card>
        </View>

        {/* Income Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الدخل الشهري</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowIncomeModal(true)}>
              <Ionicons name="add-circle" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          {incomes.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>أضف راتبك أو دخلك الشهري</Text>
              <Button title="إضافة دخل" onPress={() => setShowIncomeModal(true)} size="small" />
            </Card>
          ) : (
            incomes.map(income => (
              <TouchableOpacity
                key={income.id}
                style={styles.listItem}
                onLongPress={() => handleDeleteIncome(income.id)}
              >
                <View style={[styles.listItemIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                  <Ionicons name="cash-outline" size={20} color={COLORS.secondary} />
                </View>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{income.title}</Text>
                  {income.isRecurring && (
                    <View style={styles.recurringBadge}>
                      <Ionicons name="repeat" size={12} color={COLORS.primary} />
                      <Text style={styles.recurringText}>شهري</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.listItemAmount, { color: COLORS.secondary }]}>
                  +{formatCurrency(income.amount, settings.currency)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recurring Expenses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>المصاريف المتكررة</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowRecurringModal(true)}>
              <Ionicons name="add-circle" size={24} color={COLORS.warning} />
            </TouchableOpacity>
          </View>

          {recurringExpenses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="repeat-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>أضف مصاريفك الثابتة (إيجار، اشتراكات...)</Text>
              <Button title="إضافة مصروف" onPress={() => setShowRecurringModal(true)} size="small" variant="outline" />
            </Card>
          ) : (
            recurringExpenses.map(expense => {
              const category = CATEGORIES.find(c => c.id === expense.category);
              return (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.listItem}
                  onLongPress={() => handleDeleteRecurring(expense.id)}
                >
                  <View style={[styles.listItemIcon, { backgroundColor: COLORS.categoryColors[expense.category as keyof typeof COLORS.categoryColors] + '20' }]}>
                    <Ionicons
                      name={category?.icon as any || 'ellipsis-horizontal'}
                      size={20}
                      color={COLORS.categoryColors[expense.category as keyof typeof COLORS.categoryColors] || COLORS.textMuted}
                    />
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemTitle}>{expense.title}</Text>
                    <View style={styles.recurringBadge}>
                      <Ionicons name="repeat" size={12} color={COLORS.warning} />
                      <Text style={styles.recurringText}>
                        {expense.frequency === 'monthly' ? 'شهرياً' :
                         expense.frequency === 'weekly' ? 'أسبوعياً' :
                         expense.frequency === 'daily' ? 'يومياً' : 'سنوياً'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.listItemAmount, { color: COLORS.danger }]}>
                    -{formatCurrency(expense.amount, settings.currency)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Tips */}
        {forecast && totalIncome > 0 && (
          <Card style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={24} color={COLORS.warning} />
              <Text style={styles.tipTitle}>نصيحة مالية</Text>
            </View>
            <Text style={styles.tipText}>
              {forecast.estimatedRemaining < 0
                ? `⚠️ تحذير: من المتوقع أن تتجاوز مصاريفك دخلك بـ ${formatCurrency(Math.abs(forecast.estimatedRemaining), settings.currency)}. حاول تقليل بعض المصاريف.`
                : forecast.estimatedRemaining < totalIncome * 0.1
                ? `💡 المتبقي قليل! حاول توفير ${formatCurrency(totalIncome * 0.2, settings.currency)} على الأقل للطوارئ.`
                : `✅ وضعك المالي جيد! يمكنك توفير ${formatCurrency(forecast.estimatedRemaining * 0.5, settings.currency)} لأهداف الادخار.`
              }
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Add Income Modal */}
      <Modal visible={showIncomeModal} animationType="slide" transparent onRequestClose={() => setShowIncomeModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowIncomeModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة دخل</Text>
              <View style={{ width: 24 }} />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="الوصف (مثل: راتب، عمل إضافي)"
              placeholderTextColor={COLORS.textMuted}
              value={incomeTitle}
              onChangeText={setIncomeTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="المبلغ"
              placeholderTextColor={COLORS.textMuted}
              value={incomeAmount}
              onChangeText={setIncomeAmount}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIncomeRecurring(!incomeRecurring)}
            >
              <Ionicons
                name={incomeRecurring ? 'checkbox' : 'square-outline'}
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.checkboxLabel}>دخل شهري متكرر</Text>
            </TouchableOpacity>

            <Button title="إضافة" onPress={handleAddIncome} size="large" style={styles.modalButton} />
          </View>
        </View>
      </Modal>

      {/* Add Recurring Expense Modal */}
      <Modal visible={showRecurringModal} animationType="slide" transparent onRequestClose={() => setShowRecurringModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowRecurringModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>مصروف متكرر</Text>
              <View style={{ width: 24 }} />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="الوصف (مثل: إيجار، كهرباء، إنترنت)"
              placeholderTextColor={COLORS.textMuted}
              value={recurringTitle}
              onChangeText={setRecurringTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="المبلغ"
              placeholderTextColor={COLORS.textMuted}
              value={recurringAmount}
              onChangeText={setRecurringAmount}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>التكرار</Text>
            <View style={styles.frequencyRow}>
              {(['monthly', 'weekly', 'yearly'] as const).map(freq => (
                <TouchableOpacity
                  key={freq}
                  style={[styles.frequencyButton, recurringFrequency === freq && styles.frequencyButtonActive]}
                  onPress={() => setRecurringFrequency(freq)}
                >
                  <Text style={[styles.frequencyText, recurringFrequency === freq && styles.frequencyTextActive]}>
                    {freq === 'monthly' ? 'شهري' : freq === 'weekly' ? 'أسبوعي' : 'سنوي'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>الفئة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.filter(c => c.id !== 'debts' && c.id !== 'savings').map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, recurringCategory === cat.id && styles.categoryChipActive]}
                  onPress={() => setRecurringCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={recurringCategory === cat.id ? COLORS.white : COLORS.textSecondary}
                  />
                  <Text style={[styles.categoryChipText, recurringCategory === cat.id && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button title="إضافة" onPress={handleAddRecurring} size="large" style={styles.modalButton} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.md,
  },
  monthTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  forecastCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  forecastTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  forecastItem: {
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xs,
  },
  forecastValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  forecastDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  remainingContainer: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  remainingLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  remainingValue: {
    fontSize: FONT_SIZES.xxxl,
    fontFamily: FONTS.bold,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  breakdownCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  breakdownLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  breakdownValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  addButton: {
    padding: SPACING.xs,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginVertical: SPACING.md,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  listItemTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    textAlign: 'right',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    justifyContent: 'flex-end',
  },
  recurringText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  listItemAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  tipCard: {
    backgroundColor: COLORS.warning + '15',
    borderColor: COLORS.warning + '30',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tipTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.warning,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'right',
    marginBottom: SPACING.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frequencyButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  frequencyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  frequencyTextActive: {
    color: COLORS.white,
  },
  categoryScroll: {
    marginBottom: SPACING.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  modalButton: {
    marginTop: SPACING.sm,
  },
});
