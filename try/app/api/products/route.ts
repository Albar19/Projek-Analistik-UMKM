import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '100');

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.product.count(),
    ]);

    return NextResponse.json({ products, total });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const product = await prisma.product.create({
      data: {
        name: body.name,
        category: body.category,
        price: body.price,
        costPrice: body.costPrice,
        stock: body.stock,
        minStock: body.minStock,
        unit: body.unit,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
