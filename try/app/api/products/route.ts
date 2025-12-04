import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await query(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = (userResult[0] as any).id;

    const products = await query(
      'SELECT * FROM products WHERE userId = ? ORDER BY name',
      [userId]
    );

    return NextResponse.json({ products, total: Array.isArray(products) ? products.length : 0 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
      'INSERT INTO products (id, userId, name, category, price, costPrice, stock, minStock, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, body.name, body.category, body.price, body.costPrice, body.stock, body.minStock, body.unit]
    );

    const product = await query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    return NextResponse.json(Array.isArray(product) && product[0] ? product[0] : {}, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
