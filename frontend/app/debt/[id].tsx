import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { debtStorage, expenseStorage, Debt, settingsStorage, Settings } from '../../utils/storage';
import { formatCurrency, formatDate, generateId } from '../../utils/helpers';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function DebtDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [debtData, settingsData] = await Promise.all([
        debtStorage.getById(id),
        settingsStorage.get(),
      ]);
      if (debtData) {
        setDebt(debtData);
      }
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading debt:', error);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!debt) return;

    Alert.alert(
      'تأكيد الدفع',
      `هل تريد تسجيل هذا الدين كمدفوع؟\n\nسيتم إنشاء سجل مصروف تلقائياً بنفس المبلغ.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            setLoading(true);
            try {
              const paidDate = new Date().toISOString();

              // Update debt status
              await debtStorage.update(debt.id, {
                status: 'مدفوع',
                paidDate,
              });

              // Create expense record for debts we owe
              if (debt.type === 'علينا') {
                await expenseStorage.add({
                  id: generateId(),
                  title: `دفع دين - ${debt.personName}`,
                  amount: debt.totalAmount,
                  category: 'debts',
                  date: paidDate,
                  notes: `دين مدفوع لـ ${debt.personName}`,
                });
              }

              // Reload data
              loadData();
              Alert.alert('نجاح', 'تم تسجيل الدفع بنجاح');
            } catch (error) {
              Alert.alert('خطأ', 'فشل تسجيل الدفع');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!debt) return;

    Alert.alert(
      'حذف الدين',
      'هل أنت متأكد من حذف هذا الدين؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await debtStorage.delete(debt.id);
              router.back();
            } catch (error) {
              Alert.alert('خطأ', 'فشل حذف الدين');
            }
          },
        },
      ]
    );
  };

  if (!debt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOverdue = debt.status === 'نشط' && new Date(debt.dueDate) < new Date();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: debt.personName,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.statusBadge,
              debt.status === 'مدفوع' ? styles.statusPaid : (isOverdue ? styles.statusOverdue : styles.statusActive)
            ]}>
              <Ionicons
                name={debt.status === 'مدفوع' ? 'checkmark-circle' : (isOverdue ? 'warning' : 'time')}
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.statusText}>
                {debt.status === 'مدفوع' ? 'مدفوع' : (isOverdue ? 'متأخر' : 'نشط')}
              </Text>
            </View>
            <View style={[
              styles.typeBadge,
              debt.type === 'لنا' ? styles.typeLana : styles.typeAlyna
            ]}>
              <Text style={styles.typeText}>{debt.type}</Text>
            </View>
          </View>
          <Text style={[
            styles.amount,
            debt.type === 'لنا' ? styles.amountGreen : styles.amountRed
          ]}>
            {formatCurrency(debt.totalAmount, settings.currency)}
          </Text>
          <Text style={styles.amountLabel}>
            {debt.type === 'لنا' ? 'مستحق لك' : 'مطلوب منك'}
          </Text>
        </Card>

        {/* Details */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{debt.personName}</Text>
            <View style={styles.detailLabel}>
              <Text style={styles.detailLabelText}>الشخص</Text>
              <Ionicons name="person" size={18} color={COLORS.textMuted} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{formatDate(debt.dueDate)}</Text>
            <View style={styles.detailLabel}>
              <Text style={styles.detailLabelText}>تاريخ الاستحقاق</Text>
              <Ionicons name="calendar" size={18} color={COLORS.textMuted} />
            </View>
          </View>

          {debt.paidDate && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailValue, { color: COLORS.secondary }]}>
                  {formatDate(debt.paidDate)}
                </Text>
                <View style={styles.detailLabel}>
                  <Text style={styles.detailLabelText}>تاريخ الدفع</Text>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />
                </View>
              </View>
            </>
          )}

          {debt.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.notesSection}>
                <View style={styles.detailLabel}>
                  <Text style={styles.detailLabelText}>ملاحظات</Text>
                  <Ionicons name="document-text" size={18} color={COLORS.textMuted} />
                </View>
                <Text style={styles.notesText}>{debt.notes}</Text>
              </View>
            </>
          )}
        </Card>

        {/* Actions */}
        {debt.status === 'نشط' && (
          <Button
            title="تسجيل كمدفوع"
            onPress={handleMarkAsPaid}
            loading={loading}
            variant="secondary"
            size="large"
            style={styles.actionButton}
          />
        )}

        <Button
          title="حذف الدين"
          onPress={handleDelete}
          variant="danger"
          size="large"
          style={styles.deleteButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  statusCard: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusHeader: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusActive: {
    backgroundColor: COLORS.primary,
  },
  statusPaid: {
    backgroundColor: COLORS.secondary,
  },
  statusOverdue: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  typeLana: {
    backgroundColor: COLORS.secondary + '30',
  },
  typeAlyna: {
    backgroundColor: COLORS.danger + '30',
  },
  typeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  amount: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  amountGreen: {
    color: COLORS.secondary,
  },
  amountRed: {
    color: COLORS.danger,
  },
  amountLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailsCard: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailLabelText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  notesSection: {
    gap: SPACING.sm,
  },
  notesText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
  },
  actionButton: {
    marginBottom: SPACING.sm,
  },
  deleteButton: {
    marginTop: SPACING.sm,
  },
});
