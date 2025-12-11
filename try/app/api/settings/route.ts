import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';

// GET settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = session.user.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (!isUuid) {
      const userResult = await query(
        'SELECT id FROM users WHERE email = ?',
        [session.user.email]
      );

      if (!Array.isArray(userResult) || userResult.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      userId = (userResult[0] as any).id;
    }

    const settings = await query(
      'SELECT * FROM settings WHERE userId = ?',
      [userId]
    );

    if (!Array.isArray(settings) || settings.length === 0) {
      // Return default settings if not found
      return NextResponse.json({
        businessName: `Toko ${session.user.name}`,
        storeName: `Toko ${session.user.name}`,
        storeAddress: '',
        businessType: 'retail',
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
        lowStockThreshold: 10,
        minStockAlert: 10,
        enableNotifications: true,
        emailNotifications: true,
        enableAutoReports: false,
        reportFrequency: 'weekly',
        notificationEmail: session.user.email || '',
        categories: ['Makanan', 'Minuman', 'Snack', 'Lainnya'],
        units: ['Pcs', 'Box', 'Kg', 'Liter'],
      });
    }

    const s = settings[0] as any;
    return NextResponse.json({
      ...s,
      storeName: s.businessName,
      minStockAlert: s.lowStockThreshold,
      emailNotifications: Boolean(s.enableNotifications),
      categories: s.categories ? JSON.parse(s.categories) : ['Makanan', 'Minuman', 'Snack', 'Lainnya'],
      units: s.units ? JSON.parse(s.units) : ['Pcs', 'Box', 'Kg', 'Liter'],
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// UPDATE/CREATE settings
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    let userId = session.user.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (!isUuid) {
      const userResult = await query(
        'SELECT id FROM users WHERE email = ?',
        [session.user.email]
      );

      if (!Array.isArray(userResult) || userResult.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      userId = (userResult[0] as any).id;
    }

    // Prepare values
    const businessName = body.businessName || body.storeName || `Toko ${session.user.name}`;
    const storeAddress = body.storeAddress || '';
    const businessType = body.businessType || 'retail';
    const currency = body.currency || 'IDR';
    const timezone = body.timezone || 'Asia/Jakarta';
    const lowStockThreshold = body.lowStockThreshold || body.minStockAlert || 10;
    const enableNotifications = body.enableNotifications || body.emailNotifications ? 1 : 0;
    const enableAutoReports = body.enableAutoReports ? 1 : 0;
    const reportFrequency = body.reportFrequency || 'weekly';
    const notificationEmail = body.notificationEmail || session.user.email || '';
    const categories = JSON.stringify(body.categories || ['Makanan', 'Minuman', 'Snack', 'Lainnya']);
    const units = JSON.stringify(body.units || ['Pcs', 'Box', 'Kg', 'Liter']);

    // Check if settings exist
    const existingSettings = await query(
      'SELECT id FROM settings WHERE userId = ?',
      [userId]
    );

    if (Array.isArray(existingSettings) && existingSettings.length > 0) {
      // Update existing settings
      await query(
        `UPDATE settings SET 
          businessName = ?, 
          storeAddress = ?,
          businessType = ?, 
          currency = ?, 
          timezone = ?, 
          lowStockThreshold = ?,
          enableNotifications = ?,
          enableAutoReports = ?,
          reportFrequency = ?,
          notificationEmail = ?,
          categories = ?,
          units = ?,
          updatedAt = NOW()
        WHERE userId = ?`,
        [
          businessName,
          storeAddress,
          businessType,
          currency,
          timezone,
          lowStockThreshold,
          enableNotifications,
          enableAutoReports,
          reportFrequency,
          notificationEmail,
          categories,
          units,
          userId,
        ]
      );
    } else {
      // Create new settings
      const settingsId = uuidv4();
      await query(
        `INSERT INTO settings (
          id, userId, businessName, storeAddress, businessType, currency, timezone, 
          lowStockThreshold, enableNotifications, enableAutoReports, reportFrequency,
          notificationEmail, categories, units
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settingsId,
          userId,
          businessName,
          storeAddress,
          businessType,
          currency,
          timezone,
          lowStockThreshold,
          enableNotifications,
          enableAutoReports,
          reportFrequency,
          notificationEmail,
          categories,
          units,
        ]
      );
    }

    console.log('✅ Settings saved to cloud:', businessName);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
