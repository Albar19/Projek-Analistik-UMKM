import { create } from 'zustand';
import { Product, Sale, BusinessSettings, ChatMessage, ChatSession, ActivityLog, User } from './types';

// Default empty state for new users
const getEmptyState = () => ({
  products: [] as Product[],
  sales: [] as Sale[],
  settings: {
    businessName: '',
    storeName: '',
    storeAddress: '',
    businessType: 'retail' as const,
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    lowStockThreshold: 10,
    minStockAlert: 10,
    enableNotifications: true,
    emailNotifications: true,
    enableAutoReports: false,
    reportFrequency: 'weekly' as const,
    notificationEmail: '',
    categories: ['Makanan', 'Minuman', 'Snack', 'Lainnya'],
    units: ['Pcs', 'Box', 'Kg', 'Liter'],
  } as BusinessSettings,
  chatHistory: [] as ChatMessage[],
  chatSessions: [] as ChatSession[],
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
  chatSessions: ChatSession[];
  currentChatSessionId: string | null;
  activityLogs: ActivityLog[];
  currentUser: User | null;
  isLoading: boolean;
  
  // Actions - User & Data Management
  initializeUserData: (userId: string, userName: string, userEmail: string, userImage?: string) => void;
  loadDataFromMySQL: (userId: string, user: User) => Promise<void>;
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
  
  // Actions - Chat Sessions
  createChatSession: (title?: string) => string;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  saveCurrentSession: () => void;
  loadChatSession: (sessionId: string) => void;
  deleteChatSession: (sessionId: string) => void;
  setCurrentChatSession: (sessionId: string | null) => void;
  
  // Actions - Activity Log
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  
  // Actions - User
  setCurrentUser: (user: User | null) => void;
}

// Helper function to save data to MySQL cloud database
const saveToCloud = async (endpoint: string, data: unknown, method: string = 'POST') => {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error(`Failed to save to cloud: ${endpoint}`, await response.text());
    }
    return response.ok;
  } catch (error) {
    console.error(`Error saving to cloud: ${endpoint}`, error);
    return false;
  }
};

export const useStore = create<AppState>()((set, get) => ({
  // Initial Data - Empty until user logs in
  currentUserId: null,
  products: [],
  sales: [],
  settings: getEmptyState().settings,
  chatHistory: [],
  chatSessions: [],
  currentChatSessionId: null,
  activityLogs: [],
  currentUser: null,
  isLoading: false,
  
  // Initialize user data - called when user logs in
  initializeUserData: (userId, userName, userEmail, userImage) => {
    const user: User = {
      id: userId,
      name: userName,
      email: userEmail,
      image: userImage,
      role: 'admin',
      createdAt: new Date(),
    };
    
    // Set user first, then load data from cloud
    set({
      currentUserId: userId,
      currentUser: user,
      isLoading: true,
    });
    
    // Load data from MySQL cloud
    get().loadDataFromMySQL(userId, user);
  },
  
  // Load data from MySQL - data persisten di cloud
  loadDataFromMySQL: async (userId, user) => {
    set({ isLoading: true });
    
    try {
      const response = await fetch('/api/data/load');
      const data = await response.json();
      
      console.log('📡 Loading data from TiDB Cloud...');
      console.log('📥 Settings received:', data.settings);
      
      // Ensure storeName is synced with businessName
      const loadedSettings = data.settings ? {
        ...getEmptyState().settings,
        ...data.settings,
        storeName: data.settings.storeName || data.settings.businessName || `Toko ${user.name}`,
        businessName: data.settings.businessName || data.settings.storeName || `Toko ${user.name}`,
      } : {
        ...getEmptyState().settings,
        storeName: `Toko ${user.name}`,
        businessName: `Toko ${user.name}`,
      };
      
      set({
        currentUserId: userId,
        currentUser: user,
        products: data.products || [],
        sales: data.sales || [],
        settings: loadedSettings,
        isLoading: false,
      });
      
      console.log('✅ Data loaded from TiDB Cloud:', {
        products: data.products?.length || 0,
        sales: data.sales?.length || 0,
        storeName: loadedSettings.storeName,
      });
    } catch (error) {
      console.error('❌ Error loading data from cloud:', error);
      // Use empty defaults if cloud fails
      set({
        currentUserId: userId,
        currentUser: user,
        ...getEmptyState(),
        settings: {
          ...getEmptyState().settings,
          storeName: `Toko ${user.name}`,
          businessName: `Toko ${user.name}`,
        },
        isLoading: false,
      });
    }
  },
  
  // Clear user data on logout (only clears local state, cloud data remains)
  clearUserData: () => {
    console.log('🚪 User logged out - cloud data preserved');
    set({
      currentUserId: null,
      currentUser: null,
      ...getEmptyState(),
    });
  },
  
  // Products - Save to cloud
  addProduct: (product) => {
    set((state) => ({ products: [...state.products, product] }));
    
    // Save to cloud
    saveToCloud('/api/products', product).then((success) => {
      if (success) console.log('✅ Product saved to cloud:', product.name);
    });
    
    get().addActivityLog({
      userId: get().currentUser?.id || 'system',
      userName: get().currentUser?.name || 'System',
      action: 'ADD_PRODUCT',
      details: `Menambahkan produk: ${product.name}`,
    });
  },
  
  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
    }));
    
    // Save to cloud
    saveToCloud(`/api/products/${id}`, updates, 'PUT').then((success) => {
      if (success) console.log('✅ Product updated in cloud:', id);
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
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
    
    // Delete from cloud
    saveToCloud(`/api/products/${id}`, {}, 'DELETE').then((success) => {
      if (success) console.log('✅ Product deleted from cloud:', id);
    });
    
    get().addActivityLog({
      userId: get().currentUser?.id || 'system',
      userName: get().currentUser?.name || 'System',
      action: 'DELETE_PRODUCT',
      details: `Menghapus produk: ${product?.name}`,
    });
  },
  
  // Sales - Save to cloud
  addSale: (sale) => {
    set((state) => ({ sales: [...state.sales, sale] }));
    
    // Save to cloud
    saveToCloud('/api/sales', sale).then((success) => {
      if (success) console.log('✅ Sale saved to cloud:', sale.id);
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
    set((state) => ({ sales: [...state.sales, ...newSales] }));
    
    // Save all to cloud
    saveToCloud('/api/sales', { sales: newSales }).then((success) => {
      if (success) console.log('✅ Bulk sales saved to cloud:', newSales.length);
    });
    
    get().addActivityLog({
      userId: get().currentUser?.id || 'system',
      userName: get().currentUser?.name || 'System',
      action: 'IMPORT_SALES',
      details: `Mengimport ${newSales.length} data penjualan`,
    });
  },
  
  updateSale: (id, updates) => {
    set((state) => ({
      sales: state.sales.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    
    // Update in cloud
    saveToCloud(`/api/sales/${id}`, updates, 'PUT').then((success) => {
      if (success) console.log('✅ Sale updated in cloud:', id);
    });
  },
  
  deleteSale: (id) => {
    set((state) => ({
      sales: state.sales.filter((s) => s.id !== id),
    }));
    
    // Delete from cloud
    saveToCloud(`/api/sales/${id}`, {}, 'DELETE').then((success) => {
      if (success) console.log('✅ Sale deleted from cloud:', id);
    });
  },
  
  // Settings - Save to cloud
  updateSettings: (newSettings) => {
    // Sync storeName and businessName
    const syncedSettings = {
      ...newSettings,
      businessName: newSettings.storeName || newSettings.businessName || get().settings.businessName,
      storeName: newSettings.storeName || newSettings.businessName || get().settings.storeName,
    };
    
    set((state) => ({
      settings: { ...state.settings, ...syncedSettings },
    }));
    
    // Save to cloud
    const fullSettings = { ...get().settings };
    console.log('📤 Saving settings to cloud:', fullSettings);
    
    saveToCloud('/api/settings', fullSettings, 'PUT').then((success) => {
      if (success) console.log('✅ Settings saved to cloud:', fullSettings.storeName || fullSettings.businessName);
      else console.error('❌ Failed to save settings to cloud');
    });
    
    get().addActivityLog({
      userId: get().currentUser?.id || 'system',
      userName: get().currentUser?.name || 'System',
      action: 'UPDATE_SETTINGS',
      details: 'Mengupdate pengaturan bisnis',
    });
  },
  
  // Chat - stored in memory only (not persisted to cloud for privacy)
  addChatMessage: (message) => {
    set((state) => ({
      chatHistory: [...state.chatHistory, message],
    }));
  },
  
  clearChatHistory: () => {
    set({ chatHistory: [] });
  },
  
  // Chat Sessions - stored in memory
  createChatSession: (title?: string) => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newSession: ChatSession = {
      id: sessionId,
      title: title || `Chat ${now.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}`,
      messages: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
    
    set((state) => ({
      chatSessions: [...state.chatSessions, newSession],
      currentChatSessionId: sessionId,
    }));
    
    return sessionId;
  },
  
  addMessageToSession: (sessionId: string, message: ChatMessage) => {
    set((state) => ({
      chatSessions: state.chatSessions.map((session) =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, message], updatedAt: new Date() }
          : session
      ),
    }));
  },
  
  saveCurrentSession: () => {
    const state = get();
    if (state.currentChatSessionId && state.chatHistory.length > 0) {
      const firstUserMessage = state.chatHistory.find((msg) => msg.role === 'user');
      const title = firstUserMessage
        ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
        : `Chat ${new Date().toLocaleDateString('id-ID')}`;
      
      set((state) => ({
        chatSessions: state.chatSessions.map((session) =>
          session.id === state.currentChatSessionId
            ? { ...session, messages: state.chatHistory, title, updatedAt: new Date(), isActive: false }
            : session
        ),
      }));
    }
  },
  
  loadChatSession: (sessionId: string) => {
    set((state) => {
      const session = state.chatSessions.find((s) => s.id === sessionId);
      if (session) {
        return { 
          currentChatSessionId: sessionId,
          chatHistory: session.messages,
        };
      }
      return {};
    });
  },
  
  deleteChatSession: (sessionId: string) => {
    set((state) => ({
      chatSessions: state.chatSessions.filter((s) => s.id !== sessionId),
    }));
  },
  
  setCurrentChatSession: (sessionId: string | null) => {
    set({ currentChatSessionId: sessionId });
  },
  
  // Activity Log - stored in memory only
  addActivityLog: (log) => {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date(),
    };
    set((state) => ({
      activityLogs: [newLog, ...state.activityLogs].slice(0, 100),
    }));
  },
  
  // User
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },
}));
