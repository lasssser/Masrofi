import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { debtStorage, Debt, settingsStorage, Settings } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';

export default function DebtsScreen() {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true });
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'لنا' | 'علينا'>('all');

  const loadData = async () => {
    try {
      const [debtsData, settingsData] = await Promise.all([
        debtStorage.getAll(),
        settingsStorage.get(),
      ]);
      setDebts(debtsData);
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
  const activeDebts = debts.filter(d => d.status === 'نشط');
  const oweUsTotal = activeDebts
    .filter(d => d.type === 'لنا')
    .reduce((sum, d) => sum + d.totalAmount, 0);
  const weOweTotal = activeDebts
    .filter(d => d.type === 'علينا')
    .reduce((sum, d) => sum + d.totalAmount, 0);

  // Filter debts
  const filteredDebts = debts.filter(d => {
    if (filter === 'all') return true;
    return d.type === filter;
  });

  const handleDelete = async (id: string) => {
    Alert.alert(
      'حذف الدين',
      'هل أنت متأكد من حذف هذا الدين؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await debtStorage.delete(id);
            loadData();
          },
        },
      ]
    );
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
          <Card style={[styles.summaryCard, { borderColor: COLORS.secondary }]}>
            <Text style={styles.summaryLabel}>لنا (مستحق)</Text>
            <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>
              {formatCurrency(oweUsTotal, settings.currency)}
            </Text>
          </Card>
          <Card style={[styles.summaryCard, { borderColor: COLORS.danger }]}>
            <Text style={styles.summaryLabel}>علينا (مطلوب)</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
              {formatCurrency(weOweTotal, settings.currency)}
            </Text>
          </Card>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'لنا', 'علينا'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'الكل' : f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Debts List */}
        {filteredDebts.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="لا يوجد ديون بعد"
            subtitle="اضغط على + لإضافة دين جديد"
          />
        ) : (
          filteredDebts.map(debt => (
            <TouchableOpacity
              key={debt.id}
              style={styles.debtItem}
              onPress={() => router.push(`/debt/${debt.id}`)}
              onLongPress={() => handleDelete(debt.id)}
            >
              <View style={styles.debtHeader}>
                <View style={styles.debtInfo}>
                  <Text style={styles.personName}>{debt.personName}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, debt.type === 'لنا' ? styles.badgeGreen : styles.badgeRed]}>
                      <Text style={styles.badgeText}>{debt.type}</Text>
                    </View>
                    {debt.status === 'مدفوع' && (
                      <View style={[styles.badge, styles.badgePaid]}>
                        <Text style={styles.badgeText}>مدفوع</Text>
                      </View>
                    )}
                    {debt.status === 'نشط' && isOverdue(debt.dueDate) && (
                      <View style={[styles.badge, styles.badgeOverdue]}>
                        <Text style={styles.badgeText}>متأخر</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.debtAmount, debt.type === 'لنا' ? styles.amountGreen : styles.amountRed]}>
                  {formatCurrency(debt.totalAmount, settings.currency)}
                </Text>
              </View>
              <View style={styles.debtFooter}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.dueDate}>
                  الاستحقاق: {formatDate(debt.dueDate)}
                </Text>
              </View>
              {debt.notes && (
                <Text style={styles.notes} numberOfLines={1}>
                  {debt.notes}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/debt/add')}
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
    borderWidth: 2,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  debtItem: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  debtInfo: {
    flex: 1,
  },
  personName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeGreen: {
    backgroundColor: COLORS.secondary + '30',
  },
  badgeRed: {
    backgroundColor: COLORS.danger + '30',
  },
  badgePaid: {
    backgroundColor: COLORS.primary + '30',
  },
  badgeOverdue: {
    backgroundColor: COLORS.warning + '30',
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  debtAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  amountGreen: {
    color: COLORS.secondary,
  },
  amountRed: {
    color: COLORS.danger,
  },
  debtFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  dueDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  notes: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'right',
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
