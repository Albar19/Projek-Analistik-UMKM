import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { auth } from '@/auth';

// GET single sale
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

    const userResult = await query(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = (userResult[0] as any).id;

    const sale = await query(
      'SELECT * FROM sales WHERE id = ? AND userId = ?',
      [id, userId]
    );

    if (!Array.isArray(sale) || sale.length === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json(sale[0]);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 });
  }
}

// UPDATE sale
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

    const userResult = await query(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = (userResult[0] as any).id;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.date !== undefined) {
      updates.push('date = ?');
      values.push(body.date);
    }
    if (body.productId !== undefined) {
      updates.push('productId = ?');
      values.push(body.productId);
    }
    if (body.productName !== undefined) {
      updates.push('productName = ?');
      values.push(body.productName);
    }
    if (body.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(body.quantity);
    }
    if (body.price !== undefined) {
      updates.push('price = ?');
      values.push(body.price);
    }
    if (body.total !== undefined) {
      updates.push('total = ?');
      values.push(body.total);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id, userId);

    await query(
      `UPDATE sales SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
      values
    );

    const sale = await query(
      'SELECT * FROM sales WHERE id = ?',
      [id]
    );

    console.log('✅ Sale updated in cloud:', id);
    return NextResponse.json(Array.isArray(sale) && sale[0] ? sale[0] : {});
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

// DELETE sale
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

    const userResult = await query(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = (userResult[0] as any).id;

    await query(
      'DELETE FROM sales WHERE id = ? AND userId = ?',
      [id, userId]
    );

    console.log('✅ Sale deleted from cloud:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
