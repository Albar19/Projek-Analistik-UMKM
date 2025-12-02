import { create } from 'zustand';
import { Product, Sale, BusinessSettings, ChatMessage, ActivityLog, User } from './types';

// Default NVIDIA API Key
const NVIDIA_API_KEY = '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';

// Default empty state for new users
const getEmptyState = () => ({
  products: [] as Product[],
  sales: [] as Sale[],
  settings: {
    businessName: '',
    businessType: 'retail' as const,
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    lowStockThreshold: 10,
    enableNotifications: true,
    enableAutoReports: false,
    reportFrequency: 'weekly' as const,
    nvidiaApiKey: NVIDIA_API_KEY,
  } as BusinessSettings,
  chatHistory: [] as ChatMessage[],
  activityLogs: [] as ActivityLog[],
});

interface AppState {
  // User ID for storage key
  currentUserId: string | null;
  
  // Data
  products: Product[];
  sales: Sale[];
  settings: BusinessSettings;
  chatHistory: ChatMessage[];
  activityLogs: ActivityLog[];
  currentUser: User | null;
  
  // Actions - User & Data Management
  initializeUserData: (userId: string, userName: string, userEmail: string, userImage?: string) => void;
  clearUserData: () => void;
  
  // Actions - Products
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Actions - Sales
  addSale: (sale: Sale) => void;
  addManySales: (sales: Sale[]) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  
  // Actions - Settings
  updateSettings: (settings: Partial<BusinessSettings>) => void;
  
  // Actions - Chat
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
  
  // Actions - Activity Log
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  
  // Actions - User
  setCurrentUser: (user: User | null) => void;
}

// Helper function to get user-specific storage key
const getUserStorageKey = (userId: string) => `sales-dashboard-${userId}`;

// Helper function to load user data from localStorage
const loadUserData = (userId: string) => {
  if (typeof window === 'undefined') return null;
  
  const storageKey = getUserStorageKey(userId);
  const data = localStorage.getItem(storageKey);
  
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return parsed.state || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Helper function to save user data to localStorage
const saveUserData = (userId: string, data: Partial<AppState>) => {
  if (typeof window === 'undefined') return;
  
  const storageKey = getUserStorageKey(userId);
  const existingData = localStorage.getItem(storageKey);
  let currentState = {};
  
  if (existingData) {
    try {
      const parsed = JSON.parse(existingData);
      currentState = parsed.state || {};
    } catch {
      currentState = {};
    }
  }
  
  localStorage.setItem(storageKey, JSON.stringify({
    state: {
      ...currentState,
      products: data.products,
      sales: data.sales,
      settings: data.settings,
      chatHistory: data.chatHistory,
      activityLogs: data.activityLogs,
    },
    version: 1,
  }));
};

export const useStore = create<AppState>()((set, get) => ({
  // Initial Data - Empty until user logs in
  currentUserId: null,
  products: [],
  sales: [],
  settings: getEmptyState().settings,
  chatHistory: [],
  activityLogs: [],
  currentUser: null,
  
  // Initialize user data - called when user logs in
  initializeUserData: (userId, userName, userEmail, userImage) => {
    const existingData = loadUserData(userId);
    
    const user: User = {
      id: userId,
      name: userName,
      email: userEmail,
      image: userImage,
      role: 'admin',
      createdAt: new Date(),
    };
    
    if (existingData) {
      // Load existing user data
      set({
        currentUserId: userId,
        currentUser: user,
        products: existingData.products || [],
        sales: existingData.sales || [],
        settings: existingData.settings || getEmptyState().settings,
        chatHistory: existingData.chatHistory || [],
        activityLogs: existingData.activityLogs || [],
      });
    } else {
      // New user - start with empty data
      const emptyState = getEmptyState();
      set({
        currentUserId: userId,
        currentUser: user,
        ...emptyState,
        settings: {
          ...emptyState.settings,
          businessName: `Bisnis ${userName}`,
        },
      });
      
      // Save initial empty state
      saveUserData(userId, {
        ...emptyState,
        settings: {
          ...emptyState.settings,
          businessName: `Bisnis ${userName}`,
        },
      });
    }
  },
  
  // Clear user data on logout
  clearUserData: () => {
    set({
      currentUserId: null,
      currentUser: null,
      ...getEmptyState(),
    });
  },
  
  // Products
  addProduct: (product) => {
    set((state) => {
      const newProducts = [...state.products, product];
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, products: newProducts });
      }
      return { products: newProducts };
    });
    get().addActivityLog({
      userId: get().currentUser?.id || 'system',
      userName: get().currentUser?.name || 'System',
      action: 'ADD_PRODUCT',
      details: `Menambahkan produk: ${product.name}`,
    });
  },
  
  updateProduct: (id, updates) => {
    set((state) => {
      const newProducts = state.products.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      );
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, products: newProducts });
      }
      return { products: newProducts };
    });
    get().addActivityLog({
      userId: get().currentUser?.id || 'system',
      userName: get().currentUser?.name || 'System',
      action: 'UPDATE_PRODUCT',
      details: `Mengupdate produk ID: ${id}`,
    });
  },
  
  deleteProduct: (id) => {
    const product = get().products.find((p) => p.id === id);
    set((state) => {
      const newProducts = state.products.filter((p) => p.id !== id);
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, products: newProducts });
      }
      return { products: newProducts };
    });
    get().addActivityLog({
      userId: get().currentUser?.id || 'system',
      userName: get().currentUser?.name || 'System',
      action: 'DELETE_PRODUCT',
      details: `Menghapus produk: ${product?.name}`,
    });
  },
  
  // Sales
  addSale: (sale) => {
    set((state) => {
      const newSales = [...state.sales, sale];
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, sales: newSales });
      }
      return { sales: newSales };
    });
    // Update product stock
    const product = get().products.find((p) => p.id === sale.productId);
    if (product) {
      get().updateProduct(sale.productId, {
        stock: product.stock - sale.quantity,
      });
    }
  },
  
  addManySales: (newSales) => {
    set((state) => {
      const updatedSales = [...state.sales, ...newSales];
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, sales: updatedSales });
      }
      return { sales: updatedSales };
    });
    get().addActivityLog({
      userId: get().currentUser?.id || 'system',
      userName: get().currentUser?.name || 'System',
      action: 'IMPORT_SALES',
      details: `Mengimport ${newSales.length} data penjualan`,
    });
  },
  
  updateSale: (id, updates) => {
    set((state) => {
      const newSales = state.sales.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, sales: newSales });
      }
      return { sales: newSales };
    });
  },
  
  deleteSale: (id) => {
    set((state) => {
      const newSales = state.sales.filter((s) => s.id !== id);
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, sales: newSales });
      }
      return { sales: newSales };
    });
  },
  
  // Settings
  updateSettings: (newSettings) => {
    set((state) => {
      const updatedSettings = { ...state.settings, ...newSettings };
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, settings: updatedSettings });
      }
      return { settings: updatedSettings };
    });
    get().addActivityLog({
      userId: get().currentUser?.id || 'system',
      userName: get().currentUser?.name || 'System',
      action: 'UPDATE_SETTINGS',
      details: 'Mengupdate pengaturan bisnis',
    });
  },
  
  // Chat
  addChatMessage: (message) => {
    set((state) => {
      const newChatHistory = [...state.chatHistory, message];
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, chatHistory: newChatHistory });
      }
      return { chatHistory: newChatHistory };
    });
  },
  
  clearChatHistory: () => {
    set((state) => {
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, chatHistory: [] });
      }
      return { chatHistory: [] };
    });
  },
  
  // Activity Log
  addActivityLog: (log) => {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date(),
    };
    set((state) => {
      const newLogs = [newLog, ...state.activityLogs].slice(0, 100);
      if (state.currentUserId) {
        saveUserData(state.currentUserId, { ...state, activityLogs: newLogs });
      }
      return { activityLogs: newLogs };
    });
  },
  
  // User
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },
}));
