import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const productId = searchParams.get('productId');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    let query: any = {
      where: {
        date: {
          gte: startDateStr,
        },
      },
    };

    if (productId) {
      query.where.productId = productId;
    }

    const sales = await prisma.sale.findMany({
      ...query,
      orderBy: { date: 'asc' },
    });

    // Calculate daily summary
    const dailyMap = new Map();
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

    const dailySales = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({ sales, dailySales, total: sales.length });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sale = await prisma.sale.create({
      data: {
        date: body.date,
        productId: body.productId,
        productName: body.productName,
        quantity: body.quantity,
        price: body.price,
        total: body.total,
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}
