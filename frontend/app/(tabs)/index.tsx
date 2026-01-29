import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { expenseStorage, Expense, CATEGORIES, settingsStorage, Settings } from '../../utils/storage';
import { formatCurrency, formatDate, isToday, isThisMonth, getDaysAgo, getDatesBetween } from '../../utils/helpers';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';

const screenWidth = Dimensions.get('window').width;

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true });
  const [refreshing, setRefreshing] = useState(false);
  const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');

  const loadData = async () => {
    try {
      const [expensesData, settingsData] = await Promise.all([
        expenseStorage.getAll(),
        settingsStorage.get(),
      ]);
      setExpenses(expensesData);
      setSettings(settingsData);
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

  // Calculate totals
  const todayTotal = expenses
    .filter(e => isToday(e.date))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthTotal = expenses
    .filter(e => isThisMonth(e.date))
    .reduce((sum, e) => sum + e.amount, 0);

  // Pie chart data - group by category for this month
  const monthExpenses = expenses.filter(e => isThisMonth(e.date));
  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    const total = monthExpenses
      .filter(e => e.category === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    if (total > 0) {
      acc.push({
        value: total,
        color: COLORS.categoryColors[cat.id as keyof typeof COLORS.categoryColors] || COLORS.textMuted,
        text: cat.label,
        label: cat.label,
      });
    }
    return acc;
  }, [] as { value: number; color: string; text: string; label: string }[]);

  // Bar chart data - last 7 days
  const last7Days = getDatesBetween(getDaysAgo(6), new Date());
  const barData = last7Days.map(dateStr => {
    const dayTotal = expenses
      .filter(e => e.date.split('T')[0] === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    const dayName = new Date(dateStr).toLocaleDateString('ar-SA', { weekday: 'short' });
    return {
      value: dayTotal,
      label: dayName,
      frontColor: COLORS.primary,
    };
  });

  const handleDelete = async (id: string) => {
    await expenseStorage.delete(id);
    loadData();
  };

  const getCategoryLabel = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.label || 'أخرى';
  };

  const getCategoryColor = (categoryId: string) => {
    return COLORS.categoryColors[categoryId as keyof typeof COLORS.categoryColors] || COLORS.textMuted;
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
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>اليوم</Text>
            <Text style={styles.summaryValue}>{formatCurrency(todayTotal, settings.currency)}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>هذا الشهر</Text>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
              {formatCurrency(monthTotal, settings.currency)}
            </Text>
          </Card>
        </View>

        {/* Chart Toggle */}
        {expenses.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, chartView === 'pie' && styles.toggleButtonActive]}
                onPress={() => setChartView('pie')}
              >
                <Text style={[styles.toggleText, chartView === 'pie' && styles.toggleTextActive]}>
                  حسب الفئة
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, chartView === 'bar' && styles.toggleButtonActive]}
                onPress={() => setChartView('bar')}
              >
                <Text style={[styles.toggleText, chartView === 'bar' && styles.toggleTextActive]}>
                  آخر 7 أيام
                </Text>
              </TouchableOpacity>
            </View>

            {chartView === 'pie' && categoryTotals.length > 0 ? (
              <View style={styles.pieChartWrapper}>
                <PieChart
                  data={categoryTotals}
                  donut
                  radius={80}
                  innerRadius={50}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterLabel}>الإجمالي</Text>
                      <Text style={styles.pieCenterValue}>
                        {formatCurrency(monthTotal, settings.currency)}
                      </Text>
                    </View>
                  )}
                />
                <View style={styles.legendContainer}>
                  {categoryTotals.map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendText}>{item.label}</Text>
                      <Text style={styles.legendValue}>
                        {formatCurrency(item.value, settings.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : chartView === 'bar' ? (
              <View style={styles.barChartWrapper}>
                <BarChart
                  data={barData}
                  barWidth={30}
                  spacing={15}
                  xAxisColor={COLORS.border}
                  yAxisColor={COLORS.border}
                  yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
                  noOfSections={4}
                  maxValue={Math.max(...barData.map(d => d.value)) * 1.2 || 100}
                  height={150}
                  width={screenWidth - 100}
                  isAnimated
                />
              </View>
            ) : (
              <Text style={styles.noChartData}>لا توجد بيانات كافية للرسم البياني</Text>
            )}
          </View>
        )}

        {/* Expense List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>آخر المصروفات</Text>
          {expenses.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="لا يوجد مصروفات بعد"
              subtitle="اضغط على + لإضافة مصروف جديد"
            />
          ) : (
            expenses.slice(0, 20).map(expense => (
              <TouchableOpacity
                key={expense.id}
                style={styles.expenseItem}
                onLongPress={() => handleDelete(expense.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(expense.category) }]}>
                  <Ionicons
                    name={CATEGORIES.find(c => c.id === expense.category)?.icon as any || 'ellipsis-horizontal'}
                    size={20}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.expenseDetails}>
                  <Text style={styles.expenseTitle}>{expense.title}</Text>
                  <Text style={styles.expenseCategory}>
                    {getCategoryLabel(expense.category)} • {formatDate(expense.date)}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>
                  {formatCurrency(expense.amount, settings.currency)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/expense/add')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
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
    paddingBottom: 100,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  chartContainer: {
    marginBottom: SPACING.lg,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  pieChartWrapper: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  pieCenterValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: SPACING.xs,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  legendValue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    fontWeight: '600',
  },
  barChartWrapper: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  noChartData: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    padding: SPACING.lg,
  },
  listSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseDetails: {
    flex: 1,
    marginRight: SPACING.md,
  },
  expenseTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  expenseCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  expenseAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.danger,
  },
  fab: {
    position: 'absolute',
    left: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
