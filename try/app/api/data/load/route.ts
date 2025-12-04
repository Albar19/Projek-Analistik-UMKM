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

    // If user not found or MySQL unavailable, return empty data
    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({
        products: [],
        sales: [],
        settings: {
          storeName: 'Toko Saya',
          storeAddress: '',
          timezone: 'Asia/Jakarta',
          currency: 'IDR',
          emailNotifications: true,
          notificationEmail: session.user.email || '',
        }
      });
    }

    const userId = (userResult[0] as any).id;

    // Fetch products, sales, and settings in parallel
    const [products, sales, settings] = await Promise.all([
      query('SELECT * FROM products WHERE userId = ? ORDER BY name', [userId]),
      query('SELECT * FROM sales WHERE userId = ? ORDER BY date DESC', [userId]),
      query('SELECT * FROM business_settings WHERE userId = ?', [userId]),
    ]);

    return NextResponse.json({
      products: Array.isArray(products) ? products : [],
      sales: Array.isArray(sales) ? sales : [],
      settings: Array.isArray(settings) && settings[0] 
        ? {
            storeName: (settings[0] as any).storeName || '',
            storeAddress: (settings[0] as any).storeAddress || '',
            timezone: (settings[0] as any).timezone || 'Asia/Jakarta',
            currency: (settings[0] as any).currency || 'IDR',
            emailNotifications: (settings[0] as any).emailNotifications,
            notificationEmail: (settings[0] as any).notificationEmail || '',
          }
        : {
            storeName: 'Toko Saya',
            storeAddress: '',
            timezone: 'Asia/Jakarta',
            currency: 'IDR',
            emailNotifications: true,
            notificationEmail: session.user.email || '',
          }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Return empty data on error instead of 500 - allows app to function
    return NextResponse.json({
      products: [],
      sales: [],
      settings: {
        storeName: 'Toko Saya',
        storeAddress: '',
        timezone: 'Asia/Jakarta',
        currency: 'IDR',
        emailNotifications: true,
        notificationEmail: '',
      }
    });
  }
}
