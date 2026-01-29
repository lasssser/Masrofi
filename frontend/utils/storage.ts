import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  EXPENSES: 'masrofi_expenses',
  DEBTS: 'masrofi_debts',
  SHOPPING_LISTS: 'masrofi_shopping_lists',
  SHOPPING_ITEMS: 'masrofi_shopping_items',
  SETTINGS: 'masrofi_settings',
  BUDGETS: 'masrofi_budgets',
  SAVINGS_GOALS: 'masrofi_savings_goals',
  RECURRING_EXPENSES: 'masrofi_recurring',
  WALLETS: 'masrofi_wallets',
  BILL_REMINDERS: 'masrofi_bill_reminders',
  INCOME: 'masrofi_income',
};

// Types
export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  walletId?: string;
  isRecurring?: boolean;
  recurringId?: string;
}

export interface Debt {
  id: string;
  personName: string;
  type: 'لنا' | 'علينا';
  totalAmount: number;
  dueDate: string;
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

export interface Budget {
  id: string;
  category: string; // 'all' for total budget
  amount: number;
  month: string; // YYYY-MM format
  spent: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  walletId?: string;
  isActive: boolean;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  color: string;
  icon: string;
  isDefault: boolean;
}

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  frequency: 'once' | 'monthly' | 'yearly';
  category: string;
  isPaid: boolean;
  notifyDaysBefore: number;
}

export interface Settings {
  currency: 'TRY' | 'USD' | 'EUR' | 'SYP';
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultWalletId?: string;
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
  { id: 'entertainment', label: 'ترفيه', icon: 'game-controller' },
  { id: 'savings', label: 'ادخار', icon: 'trending-up' },
  { id: 'other', label: 'أخرى', icon: 'ellipsis-horizontal' },
];

export const CURRENCIES = [
  { code: 'TRY', symbol: '₺', label: 'ليرة تركية' },
  { code: 'USD', symbol: '$', label: 'دولار أمريكي' },
  { code: 'EUR', symbol: '€', label: 'يورو' },
  { code: 'SYP', symbol: 'ل.س', label: 'ليرة سورية' },
];

export const GOAL_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const WALLET_ICONS = [
  'wallet', 'card', 'cash', 'briefcase', 'home', 'car', 'airplane', 'gift'
];

// Default settings
const DEFAULT_SETTINGS: Settings = {
  currency: 'TRY',
  notificationsEnabled: true,
  biometricEnabled: false,
  theme: 'dark',
  language: 'ar',
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
  async search(query: string, filters?: { category?: string; startDate?: string; endDate?: string; walletId?: string }): Promise<Expense[]> {
    const expenses = await this.getAll();
    return expenses.filter(e => {
      const matchesQuery = !query || e.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !filters?.category || e.category === filters.category;
      const matchesWallet = !filters?.walletId || e.walletId === filters.walletId;
      const matchesStartDate = !filters?.startDate || new Date(e.date) >= new Date(filters.startDate);
      const matchesEndDate = !filters?.endDate || new Date(e.date) <= new Date(filters.endDate);
      return matchesQuery && matchesCategory && matchesWallet && matchesStartDate && matchesEndDate;
    });
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

// Budgets
export const budgetStorage = {
  async getAll(): Promise<Budget[]> {
    return getData<Budget[]>(KEYS.BUDGETS, []);
  },
  async getByMonth(month: string): Promise<Budget[]> {
    const budgets = await this.getAll();
    return budgets.filter(b => b.month === month);
  },
  async add(budget: Budget): Promise<void> {
    const budgets = await this.getAll();
    budgets.unshift(budget);
    await setData(KEYS.BUDGETS, budgets);
  },
  async update(id: string, updates: Partial<Budget>): Promise<void> {
    const budgets = await this.getAll();
    const index = budgets.findIndex(b => b.id === id);
    if (index !== -1) {
      budgets[index] = { ...budgets[index], ...updates };
      await setData(KEYS.BUDGETS, budgets);
    }
  },
  async delete(id: string): Promise<void> {
    const budgets = await this.getAll();
    const filtered = budgets.filter(b => b.id !== id);
    await setData(KEYS.BUDGETS, filtered);
  },
  async getOrCreate(month: string, category: string = 'all'): Promise<Budget | null> {
    const budgets = await this.getByMonth(month);
    return budgets.find(b => b.category === category) || null;
  },
};

// Savings Goals
export const savingsGoalStorage = {
  async getAll(): Promise<SavingsGoal[]> {
    return getData<SavingsGoal[]>(KEYS.SAVINGS_GOALS, []);
  },
  async getById(id: string): Promise<SavingsGoal | undefined> {
    const goals = await this.getAll();
    return goals.find(g => g.id === id);
  },
  async add(goal: SavingsGoal): Promise<void> {
    const goals = await this.getAll();
    goals.unshift(goal);
    await setData(KEYS.SAVINGS_GOALS, goals);
  },
  async update(id: string, updates: Partial<SavingsGoal>): Promise<void> {
    const goals = await this.getAll();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates };
      await setData(KEYS.SAVINGS_GOALS, goals);
    }
  },
  async delete(id: string): Promise<void> {
    const goals = await this.getAll();
    const filtered = goals.filter(g => g.id !== id);
    await setData(KEYS.SAVINGS_GOALS, filtered);
  },
  async addAmount(id: string, amount: number): Promise<void> {
    const goal = await this.getById(id);
    if (goal) {
      await this.update(id, { currentAmount: goal.currentAmount + amount });
    }
  },
};

// Recurring Expenses
export const recurringExpenseStorage = {
  async getAll(): Promise<RecurringExpense[]> {
    return getData<RecurringExpense[]>(KEYS.RECURRING_EXPENSES, []);
  },
  async add(expense: RecurringExpense): Promise<void> {
    const expenses = await this.getAll();
    expenses.unshift(expense);
    await setData(KEYS.RECURRING_EXPENSES, expenses);
  },
  async update(id: string, updates: Partial<RecurringExpense>): Promise<void> {
    const expenses = await this.getAll();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updates };
      await setData(KEYS.RECURRING_EXPENSES, expenses);
    }
  },
  async delete(id: string): Promise<void> {
    const expenses = await this.getAll();
    const filtered = expenses.filter(e => e.id !== id);
    await setData(KEYS.RECURRING_EXPENSES, filtered);
  },
  async getDue(): Promise<RecurringExpense[]> {
    const expenses = await this.getAll();
    const today = new Date().toISOString().split('T')[0];
    return expenses.filter(e => e.isActive && e.nextDate <= today);
  },
};

// Wallets
export const walletStorage = {
  async getAll(): Promise<Wallet[]> {
    return getData<Wallet[]>(KEYS.WALLETS, []);
  },
  async getById(id: string): Promise<Wallet | undefined> {
    const wallets = await this.getAll();
    return wallets.find(w => w.id === id);
  },
  async add(wallet: Wallet): Promise<void> {
    const wallets = await this.getAll();
    if (wallet.isDefault) {
      wallets.forEach(w => w.isDefault = false);
    }
    wallets.unshift(wallet);
    await setData(KEYS.WALLETS, wallets);
  },
  async update(id: string, updates: Partial<Wallet>): Promise<void> {
    const wallets = await this.getAll();
    if (updates.isDefault) {
      wallets.forEach(w => w.isDefault = false);
    }
    const index = wallets.findIndex(w => w.id === id);
    if (index !== -1) {
      wallets[index] = { ...wallets[index], ...updates };
      await setData(KEYS.WALLETS, wallets);
    }
  },
  async delete(id: string): Promise<void> {
    const wallets = await this.getAll();
    const filtered = wallets.filter(w => w.id !== id);
    await setData(KEYS.WALLETS, filtered);
  },
  async getDefault(): Promise<Wallet | undefined> {
    const wallets = await this.getAll();
    return wallets.find(w => w.isDefault) || wallets[0];
  },
  async updateBalance(id: string, amount: number): Promise<void> {
    const wallet = await this.getById(id);
    if (wallet) {
      await this.update(id, { balance: wallet.balance + amount });
    }
  },
};

// Bill Reminders
export const billReminderStorage = {
  async getAll(): Promise<BillReminder[]> {
    return getData<BillReminder[]>(KEYS.BILL_REMINDERS, []);
  },
  async add(reminder: BillReminder): Promise<void> {
    const reminders = await this.getAll();
    reminders.unshift(reminder);
    await setData(KEYS.BILL_REMINDERS, reminders);
  },
  async update(id: string, updates: Partial<BillReminder>): Promise<void> {
    const reminders = await this.getAll();
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index] = { ...reminders[index], ...updates };
      await setData(KEYS.BILL_REMINDERS, reminders);
    }
  },
  async delete(id: string): Promise<void> {
    const reminders = await this.getAll();
    const filtered = reminders.filter(r => r.id !== id);
    await setData(KEYS.BILL_REMINDERS, filtered);
  },
  async getUpcoming(days: number = 7): Promise<BillReminder[]> {
    const reminders = await this.getAll();
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return reminders.filter(r => {
      if (r.isPaid) return false;
      const dueDate = new Date(r.dueDate);
      return dueDate >= today && dueDate <= futureDate;
    });
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
      budgets: await budgetStorage.getAll(),
      savingsGoals: await savingsGoalStorage.getAll(),
      recurringExpenses: await recurringExpenseStorage.getAll(),
      wallets: await walletStorage.getAll(),
      billReminders: await billReminderStorage.getAll(),
      settings: await settingsStorage.get(),
      exportDate: new Date().toISOString(),
      appVersion: '2.0.0',
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
      if (data.budgets) await setData(KEYS.BUDGETS, data.budgets);
      if (data.savingsGoals) await setData(KEYS.SAVINGS_GOALS, data.savingsGoals);
      if (data.recurringExpenses) await setData(KEYS.RECURRING_EXPENSES, data.recurringExpenses);
      if (data.wallets) await setData(KEYS.WALLETS, data.wallets);
      if (data.billReminders) await setData(KEYS.BILL_REMINDERS, data.billReminders);
      if (data.settings) await setData(KEYS.SETTINGS, data.settings);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('فشل استيراد البيانات');
    }
  },
};
