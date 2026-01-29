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
import { shoppingListStorage, shoppingItemStorage, ShoppingList, ShoppingItem } from '../../utils/storage';
import { formatDate } from '../../utils/helpers';
import EmptyState from '../../components/EmptyState';

export default function ShoppingScreen() {
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [itemCounts, setItemCounts] = useState<{ [key: string]: { total: number; bought: number } }>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const listsData = await shoppingListStorage.getAll();
      const itemsData = await shoppingItemStorage.getAll();
      
      // Calculate item counts for each list
      const counts: { [key: string]: { total: number; bought: number } } = {};
      listsData.forEach(list => {
        const listItems = itemsData.filter(item => item.listId === list.id);
        counts[list.id] = {
          total: listItems.length,
          bought: listItems.filter(item => item.isBought).length,
        };
      });
      
      setLists(listsData);
      setItemCounts(counts);
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

  const handleDelete = async (id: string) => {
    Alert.alert(
      'حذف القائمة',
      'هل أنت متأكد من حذف هذه القائمة وجميع عناصرها؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await shoppingListStorage.delete(id);
            loadData();
          },
        },
      ]
    );
  };

  const getProgressColor = (bought: number, total: number) => {
    if (total === 0) return COLORS.textMuted;
    const progress = bought / total;
    if (progress === 1) return COLORS.secondary;
    if (progress >= 0.5) return COLORS.warning;
    return COLORS.primary;
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
        {/* Lists */}
        {lists.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="لا توجد قوائم بعد"
            subtitle="اضغط على + لإنشاء قائمة تسوق جديدة"
          />
        ) : (
          lists.map(list => {
            const counts = itemCounts[list.id] || { total: 0, bought: 0 };
            const progressWidth = counts.total > 0 ? (counts.bought / counts.total) * 100 : 0;
            const progressColor = getProgressColor(counts.bought, counts.total);
            
            return (
              <TouchableOpacity
                key={list.id}
                style={styles.listItem}
                onPress={() => router.push(`/shopping/${list.id}`)}
                onLongPress={() => handleDelete(list.id)}
              >
                <View style={styles.listHeader}>
                  <View style={styles.listIconContainer}>
                    <Ionicons name="list" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{list.name}</Text>
                    <Text style={styles.listDate}>تم إنشائها: {formatDate(list.createdAt)}</Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                      {counts.bought}/{counts.total}
                    </Text>
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progressWidth}%`, backgroundColor: progressColor }
                      ]} 
                    />
                  </View>
                </View>
                
                {counts.total > 0 && counts.bought === counts.total && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                    <Text style={styles.completedText}>مكتملة</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/shopping/add-list')}
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
  listItem: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  listName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  listDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  countBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  countText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressContainer: {
    marginTop: SPACING.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  completedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondary,
    fontWeight: '500',
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
