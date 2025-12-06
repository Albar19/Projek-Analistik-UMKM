import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    const defaultSettings = {
      storeName: `Toko ${session.user.name || 'Saya'}`,
      businessName: `Toko ${session.user.name || 'Saya'}`,
      storeAddress: '',
      businessType: 'retail',
      timezone: 'Asia/Jakarta',
      currency: 'IDR',
      lowStockThreshold: 10,
      minStockAlert: 10,
      emailNotifications: true,
      enableNotifications: true,
      notificationEmail: session.user.email || '',
      categories: ['Makanan', 'Minuman', 'Snack', 'Lainnya'],
      units: ['Pcs', 'Box', 'Kg', 'Liter'],
    };

    // If user not found or MySQL unavailable, return empty data
    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({
        products: [],
        sales: [],
        settings: defaultSettings
      });
    }

    const userId = (userResult[0] as any).id;
    console.log('📊 Loading data for userId:', userId, 'email:', session.user.email);

    // Fetch products, sales, and settings in parallel
    const [products, sales, settings] = await Promise.all([
      query('SELECT * FROM products WHERE userId = ? ORDER BY name', [userId]),
      query('SELECT * FROM sales WHERE userId = ? ORDER BY date DESC', [userId]),
      query('SELECT * FROM settings WHERE userId = ?', [userId]),
    ]);

    console.log('📥 Settings from DB:', Array.isArray(settings) ? settings.length : 0, 'records');

    // If no settings exist, create default settings for this user
    if (!Array.isArray(settings) || settings.length === 0) {
      console.log('⚠️ No settings found, creating default settings for user:', userId);
      try {
        const { v4: uuidv4 } = await import('uuid');
        const settingsId = uuidv4();
        await query(
          `INSERT INTO settings (
            id, userId, businessName, storeAddress, businessType, 
            currency, timezone, lowStockThreshold, enableNotifications,
            enableAutoReports, reportFrequency, categories, units
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            settingsId, 
            userId, 
            `Toko ${session.user.name}`,
            '',
            'retail',
            'IDR',
            'Asia/Jakarta',
            10,
            1,
            0,
            'weekly',
            JSON.stringify(['Makanan', 'Minuman', 'Snack', 'Lainnya']),
            JSON.stringify(['Pcs', 'Box', 'Kg', 'Liter'])
          ]
        );
        console.log('✅ Default settings created for user:', userId);
      } catch (err) {
        console.error('❌ Failed to create default settings:', err);
      }
    }

    // Parse settings from database
    let parsedSettings = defaultSettings;
    
    // Re-fetch settings if we just created them
    let finalSettings = settings;
    if (!Array.isArray(settings) || settings.length === 0) {
      finalSettings = await query('SELECT * FROM settings WHERE userId = ?', [userId]);
    }
    
    if (Array.isArray(finalSettings) && finalSettings[0]) {
      const s = finalSettings[0] as any;
      parsedSettings = {
        storeName: s.businessName || s.storeName || defaultSettings.storeName,
        businessName: s.businessName || s.storeName || defaultSettings.businessName,
        storeAddress: s.storeAddress || defaultSettings.storeAddress,
        businessType: s.businessType || defaultSettings.businessType,
        timezone: s.timezone || defaultSettings.timezone,
        currency: s.currency || defaultSettings.currency,
        lowStockThreshold: s.lowStockThreshold || defaultSettings.lowStockThreshold,
        minStockAlert: s.lowStockThreshold || s.minStockAlert || defaultSettings.minStockAlert,
        emailNotifications: Boolean(s.enableNotifications),
        enableNotifications: Boolean(s.enableNotifications),
        notificationEmail: s.notificationEmail || defaultSettings.notificationEmail,
        categories: s.categories ? JSON.parse(s.categories) : defaultSettings.categories,
        units: s.units ? JSON.parse(s.units) : defaultSettings.units,
      };
      console.log('✅ Parsed settings - storeName:', parsedSettings.storeName);
    }

    return NextResponse.json({
      products: Array.isArray(products) ? products : [],
      sales: Array.isArray(sales) ? sales : [],
      settings: parsedSettings
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Return empty data on error instead of 500 - allows app to function
    return NextResponse.json({
      products: [],
      sales: [],
      settings: {
        storeName: 'Toko Saya',
        businessName: 'Toko Saya',
        storeAddress: '',
        businessType: 'retail',
        timezone: 'Asia/Jakarta',
        currency: 'IDR',
        lowStockThreshold: 10,
        minStockAlert: 10,
        emailNotifications: true,
        enableNotifications: true,
        notificationEmail: '',
        categories: ['Makanan', 'Minuman', 'Snack', 'Lainnya'],
        units: ['Pcs', 'Box', 'Kg', 'Liter'],
      }
    });
  }
}
