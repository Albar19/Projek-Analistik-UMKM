import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

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

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get all sales for the period
    const sales = await query(
      'SELECT * FROM sales WHERE userId = ? AND date >= ? ORDER BY date ASC',
      [userId, startDateStr]
    );

    // Calculate product sales
    const productMap = new Map();
    if (Array.isArray(sales)) {
      sales.forEach((sale: any) => {
        const existing = productMap.get(sale.productId);
        if (existing) {
          existing.totalQuantity += sale.quantity;
          existing.totalRevenue += sale.total;
        } else {
          productMap.set(sale.productId, {
            productId: sale.productId,
            productName: sale.productName,
            totalQuantity: sale.quantity,
            totalRevenue: sale.total,
            averageDaily: 0,
          });
        }
      });
    }

    // Calculate average daily
    productMap.forEach((product: any) => {
      product.averageDaily = Math.round(product.totalQuantity / days);
    });

    const productSales = Array.from(productMap.values()).sort(
      (a: any, b: any) => b.totalRevenue - a.totalRevenue
    );

    // Get total stats
    const salesArray = Array.isArray(sales) ? sales : [];
    const totalRevenue = salesArray.reduce((sum: number, sale: any) => sum + sale.total, 0);
    const totalQuantity = salesArray.reduce((sum: number, sale: any) => sum + sale.quantity, 0);
    const totalTransactions = salesArray.length;

    // Get low stock products
    const lowStockProducts = await query(
      'SELECT * FROM products WHERE userId = ? AND stock <= minStock ORDER BY stock ASC',
      [userId]
    );

    return NextResponse.json({
      totalRevenue,
      totalQuantity,
      totalTransactions,
      averageTransactionValue: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
      productSales,
      lowStockProducts: Array.isArray(lowStockProducts) ? lowStockProducts : [],
      period: { days, startDate: startDateStr },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
