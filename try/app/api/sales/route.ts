import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const productId = searchParams.get('productId');

    const userResult = await query(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = (userResult[0] as any).id;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    let sqlQuery = 'SELECT * FROM sales WHERE userId = ? AND date >= ?';
    let params: any[] = [userId, startDateStr];

    if (productId) {
      sqlQuery += ' AND productId = ?';
      params.push(productId);
    }

    sqlQuery += ' ORDER BY date ASC';

    const sales = await query(sqlQuery, params);

    // Calculate daily summary
    const dailyMap = new Map();
    if (Array.isArray(sales)) {
      sales.forEach((sale: any) => {
        const existing = dailyMap.get(sale.date);
        if (existing) {
          existing.total += sale.total;
          existing.quantity += sale.quantity;
          existing.transactions += 1;
        } else {
          dailyMap.set(sale.date, {
            date: sale.date,
            total: sale.total,
            quantity: sale.quantity,
            transactions: 1,
          });
        }
      });
    }

    const dailySales = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({ 
      sales: Array.isArray(sales) ? sales : [], 
      dailySales, 
      total: Array.isArray(sales) ? sales.length : 0 
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const userResult = await query(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = (userResult[0] as any).id;
    const id = uuidv4();

    await query(
      'INSERT INTO sales (id, userId, date, productId, productName, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, body.date, body.productId, body.productName, body.quantity, body.price, body.total]
    );

    const sale = await query(
      'SELECT * FROM sales WHERE id = ?',
      [id]
    );

    return NextResponse.json(Array.isArray(sale) && sale[0] ? sale[0] : {}, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}
