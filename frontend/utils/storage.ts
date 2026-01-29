import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  EXPENSES: 'bayti_expenses',
  DEBTS: 'bayti_debts',
  SHOPPING_LISTS: 'bayti_shopping_lists',
  SHOPPING_ITEMS: 'bayti_shopping_items',
  SETTINGS: 'bayti_settings',
};

// Types
export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // ISO string
  notes?: string;
}

export interface Debt {
  id: string;
  personName: string;
  type: 'لنا' | 'علينا';
  totalAmount: number;
  dueDate: string; // ISO string
  status: 'نشط' | 'مدفوع';
  notes?: string;
  paidDate?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  qty: number;
  isBought: boolean;
  price?: number;
  createdAt: string;
}

export interface Settings {
  currency: 'TRY' | 'USD' | 'EUR' | 'SYP';
  notificationsEnabled: boolean;
}

// Categories
export const CATEGORIES = [
  { id: 'food', label: 'أكل', icon: 'fast-food' },
  { id: 'transport', label: 'مواصلات', icon: 'car' },
  { id: 'bills', label: 'فواتير', icon: 'receipt' },
  { id: 'health', label: 'صحة', icon: 'medkit' },
  { id: 'home', label: 'بيت', icon: 'home' },
  { id: 'education', label: 'تعليم', icon: 'school' },
  { id: 'debts', label: 'ديون', icon: 'wallet' },
  { id: 'shopping', label: 'مشتريات', icon: 'cart' },
  { id: 'other', label: 'أخرى', icon: 'ellipsis-horizontal' },
];

export const CURRENCIES = [
  { code: 'TRY', symbol: '₺', label: 'ليرة تركية' },
  { code: 'USD', symbol: '$', label: 'دولار أمريكي' },
  { code: 'EUR', symbol: '€', label: 'يورو' },
  { code: 'SYP', symbol: 'ل.س', label: 'ليرة سورية' },
];

// Default settings
const DEFAULT_SETTINGS: Settings = {
  currency: 'TRY',
  notificationsEnabled: true,
};

// Generic storage functions
async function getData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error reading from storage:', error);
    return defaultValue;
  }
}

async function setData<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to storage:', error);
    throw error;
  }
}

// Expenses
export const expenseStorage = {
  async getAll(): Promise<Expense[]> {
    return getData<Expense[]>(KEYS.EXPENSES, []);
  },
  async add(expense: Expense): Promise<void> {
    const expenses = await this.getAll();
    expenses.unshift(expense);
    await setData(KEYS.EXPENSES, expenses);
  },
  async update(id: string, updates: Partial<Expense>): Promise<void> {
    const expenses = await this.getAll();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updates };
      await setData(KEYS.EXPENSES, expenses);
    }
  },
  async delete(id: string): Promise<void> {
    const expenses = await this.getAll();
    const filtered = expenses.filter(e => e.id !== id);
    await setData(KEYS.EXPENSES, filtered);
  },
};

// Debts
export const debtStorage = {
  async getAll(): Promise<Debt[]> {
    return getData<Debt[]>(KEYS.DEBTS, []);
  },
  async getById(id: string): Promise<Debt | undefined> {
    const debts = await this.getAll();
    return debts.find(d => d.id === id);
  },
  async add(debt: Debt): Promise<void> {
    const debts = await this.getAll();
    debts.unshift(debt);
    await setData(KEYS.DEBTS, debts);
  },
  async update(id: string, updates: Partial<Debt>): Promise<void> {
    const debts = await this.getAll();
    const index = debts.findIndex(d => d.id === id);
    if (index !== -1) {
      debts[index] = { ...debts[index], ...updates };
      await setData(KEYS.DEBTS, debts);
    }
  },
  async delete(id: string): Promise<void> {
    const debts = await this.getAll();
    const filtered = debts.filter(d => d.id !== id);
    await setData(KEYS.DEBTS, filtered);
  },
};

// Shopping Lists
export const shoppingListStorage = {
  async getAll(): Promise<ShoppingList[]> {
    return getData<ShoppingList[]>(KEYS.SHOPPING_LISTS, []);
  },
  async getById(id: string): Promise<ShoppingList | undefined> {
    const lists = await this.getAll();
    return lists.find(l => l.id === id);
  },
  async add(list: ShoppingList): Promise<void> {
    const lists = await this.getAll();
    lists.unshift(list);
    await setData(KEYS.SHOPPING_LISTS, lists);
  },
  async update(id: string, updates: Partial<ShoppingList>): Promise<void> {
    const lists = await this.getAll();
    const index = lists.findIndex(l => l.id === id);
    if (index !== -1) {
      lists[index] = { ...lists[index], ...updates };
      await setData(KEYS.SHOPPING_LISTS, lists);
    }
  },
  async delete(id: string): Promise<void> {
    const lists = await this.getAll();
    const filtered = lists.filter(l => l.id !== id);
    await setData(KEYS.SHOPPING_LISTS, filtered);
    // Also delete all items in this list
    const items = await shoppingItemStorage.getAll();
    const remainingItems = items.filter(i => i.listId !== id);
    await setData(KEYS.SHOPPING_ITEMS, remainingItems);
  },
};

// Shopping Items
export const shoppingItemStorage = {
  async getAll(): Promise<ShoppingItem[]> {
    return getData<ShoppingItem[]>(KEYS.SHOPPING_ITEMS, []);
  },
  async getByListId(listId: string): Promise<ShoppingItem[]> {
    const items = await this.getAll();
    return items.filter(i => i.listId === listId);
  },
  async add(item: ShoppingItem): Promise<void> {
    const items = await this.getAll();
    items.unshift(item);
    await setData(KEYS.SHOPPING_ITEMS, items);
  },
  async update(id: string, updates: Partial<ShoppingItem>): Promise<void> {
    const items = await this.getAll();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      await setData(KEYS.SHOPPING_ITEMS, items);
    }
  },
  async delete(id: string): Promise<void> {
    const items = await this.getAll();
    const filtered = items.filter(i => i.id !== id);
    await setData(KEYS.SHOPPING_ITEMS, filtered);
  },
};

// Settings
export const settingsStorage = {
  async get(): Promise<Settings> {
    return getData<Settings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  },
  async update(updates: Partial<Settings>): Promise<void> {
    const settings = await this.get();
    await setData(KEYS.SETTINGS, { ...settings, ...updates });
  },
};

// Backup & Restore
export const backupStorage = {
  async exportAll(): Promise<string> {
    const data = {
      expenses: await expenseStorage.getAll(),
      debts: await debtStorage.getAll(),
      shoppingLists: await shoppingListStorage.getAll(),
      shoppingItems: await shoppingItemStorage.getAll(),
      settings: await settingsStorage.get(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },
  async importAll(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString);
      if (data.expenses) await setData(KEYS.EXPENSES, data.expenses);
      if (data.debts) await setData(KEYS.DEBTS, data.debts);
      if (data.shoppingLists) await setData(KEYS.SHOPPING_LISTS, data.shoppingLists);
      if (data.shoppingItems) await setData(KEYS.SHOPPING_ITEMS, data.shoppingItems);
      if (data.settings) await setData(KEYS.SETTINGS, data.settings);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('فشل استيراد البيانات');
    }
  },
};
