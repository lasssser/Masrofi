import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import {
  shoppingListStorage,
  shoppingItemStorage,
  expenseStorage,
  ShoppingList,
  ShoppingItem,
  settingsStorage,
  Settings,
} from '../../utils/storage';
import { generateId, formatCurrency } from '../../utils/helpers';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

export default function ShoppingListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true });
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [itemPrice, setItemPrice] = useState('');

  const loadData = async () => {
    if (!id) return;
    try {
      const [listData, itemsData, settingsData] = await Promise.all([
        shoppingListStorage.getById(id),
        shoppingItemStorage.getByListId(id),
        settingsStorage.get(),
      ]);
      if (listData) {
        setList(listData);
      }
      setItems(itemsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم العنصر');
      return;
    }

    try {
      await shoppingItemStorage.add({
        id: generateId(),
        listId: id!,
        name: newItemName.trim(),
        qty: parseInt(newItemQty) || 1,
        isBought: false,
        createdAt: new Date().toISOString(),
      });
      setNewItemName('');
      setNewItemQty('1');
      setShowAddModal(false);
      loadData();
    } catch (error) {
      Alert.alert('خطأ', 'فشل إضافة العنصر');
    }
  };

  const handleToggleBought = async (item: ShoppingItem) => {
    if (!item.isBought) {
      // Ask for price when marking as bought
      setSelectedItem(item);
      setItemPrice('');
      setShowPriceModal(true);
    } else {
      // Just unmark as bought
      await shoppingItemStorage.update(item.id, { isBought: false, price: undefined });
      loadData();
    }
  };

  const handleConfirmBought = async () => {
    if (!selectedItem) return;

    try {
      const price = itemPrice ? parseFloat(itemPrice) : undefined;

      // Update item as bought
      await shoppingItemStorage.update(selectedItem.id, {
        isBought: true,
        price,
      });

      // If price entered, create expense
      if (price && price > 0) {
        await expenseStorage.add({
          id: generateId(),
          title: selectedItem.name,
          amount: price * selectedItem.qty,
          category: 'shopping',
          date: new Date().toISOString(),
          notes: `من قائمة: ${list?.name}`,
        });
      }

      setShowPriceModal(false);
      setSelectedItem(null);
      setItemPrice('');
      loadData();
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحديث العنصر');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'حذف العنصر',
      'هل أنت متأكد من حذف هذا العنصر؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await shoppingItemStorage.delete(itemId);
            loadData();
          },
        },
      ]
    );
  };

  const boughtItems = items.filter(i => i.isBought);
  const pendingItems = items.filter(i => !i.isBought);

  if (!list) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: list.name,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pendingItems.length}</Text>
            <Text style={styles.statLabel}>متبقي</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.secondary }]}>{boughtItems.length}</Text>
            <Text style={styles.statLabel}>تم شراؤه</Text>
          </View>
        </View>

        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>عناصر متبقية</Text>
            {pendingItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => handleToggleBought(item)}
                onLongPress={() => handleDeleteItem(item.id)}
              >
                <View style={styles.checkbox}>
                  <Ionicons name="square-outline" size={24} color={COLORS.textMuted} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>الكمية: {item.qty}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bought Items */}
        {boughtItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تم شراؤها</Text>
            {boughtItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, styles.itemCardBought]}
                onPress={() => handleToggleBought(item)}
                onLongPress={() => handleDeleteItem(item.id)}
              >
                <View style={styles.checkbox}>
                  <Ionicons name="checkbox" size={24} color={COLORS.secondary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, styles.itemNameBought]}>{item.name}</Text>
                  <Text style={styles.itemQty}>
                    الكمية: {item.qty}
                    {item.price && ` • ${formatCurrency(item.price, settings.currency)}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {items.length === 0 && (
          <EmptyState
            icon="bag-add-outline"
            title="لا توجد عناصر بعد"
            subtitle="اضغط على + لإضافة عنصر جديد"
          />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة عنصر</Text>
              <View style={{ width: 24 }} />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="اسم العنصر"
              placeholderTextColor={COLORS.textMuted}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />

            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>الكمية:</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setNewItemQty(String(Math.max(1, parseInt(newItemQty) - 1)))}
              >
                <Ionicons name="remove" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{newItemQty}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setNewItemQty(String(parseInt(newItemQty) + 1))}
              >
                <Ionicons name="add" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Button
              title="إضافة"
              onPress={handleAddItem}
              size="large"
              style={styles.modalButton}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Price Modal */}
      <Modal
        visible={showPriceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPriceModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPriceModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>أدخل السعر (اختياري)</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedItem && (
              <Text style={styles.selectedItemText}>
                {selectedItem.name} (الكمية: {selectedItem.qty})
              </Text>
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="السعر (اختياري)"
              placeholderTextColor={COLORS.textMuted}
              value={itemPrice}
              onChangeText={setItemPrice}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Text style={styles.priceNote}>
              إذا أدخلت السعر، سيتم إنشاء سجل مصروف تلقائياً
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="تخطي"
                onPress={() => {
                  setItemPrice('');
                  handleConfirmBought();
                }}
                variant="outline"
                style={styles.skipButton}
              />
              <Button
                title="تأكيد"
                onPress={handleConfirmBought}
                style={styles.confirmButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  itemCardBought: {
    opacity: 0.7,
  },
  checkbox: {
    marginLeft: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'right',
  },
  itemNameBought: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  itemQty: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    fontWeight: '600',
    color: COLORS.text,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'right',
    marginBottom: SPACING.md,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  qtyLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  qtyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 40,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: SPACING.sm,
  },
  selectedItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  priceNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  skipButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
