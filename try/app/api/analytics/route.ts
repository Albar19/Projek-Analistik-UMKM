import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get all sales for the period
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDateStr,
        },
      },
    });

    // Calculate product sales
    const productMap = new Map();
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

    // Calculate average daily
    productMap.forEach((product: any) => {
      product.averageDaily = Math.round(product.totalQuantity / days);
    });

    const productSales = Array.from(productMap.values()).sort(
      (a: any, b: any) => b.totalRevenue - a.totalRevenue
    );

    // Get total stats
    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.total, 0);
    const totalQuantity = sales.reduce((sum: number, sale: any) => sum + sale.quantity, 0);
    const totalTransactions = sales.length;

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.minStock,
        },
      },
    });

    return NextResponse.json({
      totalRevenue,
      totalQuantity,
      totalTransactions,
      averageTransactionValue: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
      productSales,
      lowStockProducts,
      period: { days, startDate: startDateStr },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
