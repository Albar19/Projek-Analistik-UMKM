import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Sale, BusinessSettings, ChatMessage, ActivityLog, User } from './types';
import { mockProducts, mockSales, defaultSettings } from './data';

// Default NVIDIA API Key
const NVIDIA_API_KEY = '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';

interface AppState {
  // Data
  products: Product[];
  sales: Sale[];
  settings: BusinessSettings;
  chatHistory: ChatMessage[];
  activityLogs: ActivityLog[];
  currentUser: User | null;
  
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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial Data
      products: mockProducts,
      sales: mockSales,
      settings: { ...defaultSettings, nvidiaApiKey: NVIDIA_API_KEY },
      chatHistory: [],
      activityLogs: [],
      currentUser: {
        id: 'u1',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date(),
      },
      
      // Products
      addProduct: (product) => {
        set((state) => ({
          products: [...state.products, product],
        }));
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
        get().addActivityLog({
          userId: get().currentUser?.id || 'system',
          userName: get().currentUser?.name || 'System',
          action: 'DELETE_PRODUCT',
          details: `Menghapus produk: ${product?.name}`,
        });
      },
      
      // Sales
      addSale: (sale) => {
        set((state) => ({
          sales: [...state.sales, sale],
        }));
        // Update product stock
        const product = get().products.find((p) => p.id === sale.productId);
        if (product) {
          get().updateProduct(sale.productId, {
            stock: product.stock - sale.quantity,
          });
        }
      },
      
      addManySales: (newSales) => {
        set((state) => ({
          sales: [...state.sales, ...newSales],
        }));
        get().addActivityLog({
          userId: get().currentUser?.id || 'system',
          userName: get().currentUser?.name || 'System',
          action: 'IMPORT_SALES',
          details: `Mengimport ${newSales.length} data penjualan`,
        });
      },
      
      updateSale: (id, updates) => {
        set((state) => ({
          sales: state.sales.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },
      
      deleteSale: (id) => {
        set((state) => ({
          sales: state.sales.filter((s) => s.id !== id),
        }));
      },
      
      // Settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
        get().addActivityLog({
          userId: get().currentUser?.id || 'system',
          userName: get().currentUser?.name || 'System',
          action: 'UPDATE_SETTINGS',
          details: 'Mengupdate pengaturan bisnis',
        });
      },
      
      // Chat
      addChatMessage: (message) => {
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        }));
      },
      
      clearChatHistory: () => {
        set({ chatHistory: [] });
      },
      
      // Activity Log
      addActivityLog: (log) => {
        const newLog: ActivityLog = {
          ...log,
          id: `log-${Date.now()}`,
          timestamp: new Date(),
        };
        set((state) => ({
          activityLogs: [newLog, ...state.activityLogs].slice(0, 100), // Keep last 100 logs
        }));
      },
      
      // User
      setCurrentUser: (user) => {
        set({ currentUser: user });
      },
    }),
    {
      name: 'sales-dashboard-storage',
      partialize: (state) => ({
        products: state.products,
        sales: state.sales,
        settings: state.settings,
        activityLogs: state.activityLogs,
      }),
    }
  )
);
