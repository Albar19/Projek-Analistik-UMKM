import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { auth } from '@/auth';

// GET single product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    const product = await query(
      'SELECT * FROM products WHERE id = ? AND userId = ?',
      [id, userId]
    );

    if (!Array.isArray(product) || product.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// UPDATE product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      values.push(body.category);
    }
    if (body.price !== undefined) {
      updates.push('price = ?');
      values.push(body.price);
    }
    if (body.costPrice !== undefined) {
      updates.push('costPrice = ?');
      values.push(body.costPrice);
    }
    if (body.stock !== undefined) {
      updates.push('stock = ?');
      values.push(body.stock);
    }
    if (body.minStock !== undefined) {
      updates.push('minStock = ?');
      values.push(body.minStock);
    }
    if (body.unit !== undefined) {
      updates.push('unit = ?');
      values.push(body.unit);
    }

    updates.push('updatedAt = NOW()');

    if (updates.length === 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id, userId);

    await query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
      values
    );

    const product = await query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    console.log('✅ Product updated in cloud:', id);
    return NextResponse.json(Array.isArray(product) && product[0] ? product[0] : {});
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    await query(
      'DELETE FROM products WHERE id = ? AND userId = ?',
      [id, userId]
    );

    console.log('✅ Product deleted from cloud:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
