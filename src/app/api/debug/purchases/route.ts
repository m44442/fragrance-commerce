// src/app/api/debug/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('=== Debug: Checking all purchases ===');
    
    // 全ての購入履歴を取得（デバッグ用）
    const allPurchases = await prisma.purchase.findMany({
      include: {
        user: {
          select: { id: true, email: true }
        },
        fragrance: {
          select: { id: true, name: true }
        }
      }
    });
    
    console.log('Total purchases in database:', allPurchases.length);
    
    // 現在のユーザーの購入履歴
    const userPurchases = await prisma.purchase.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        fragrance: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log('User purchases:', userPurchases.length);
    
    return NextResponse.json({ 
      totalPurchases: allPurchases.length,
      userPurchases: userPurchases.length,
      allPurchases: allPurchases.map(p => ({
        id: p.id,
        userId: p.userId,
        userEmail: p.user.email,
        fragranceId: p.fragranceId,
        fragranceName: p.fragrance.name,
        createdAt: p.createdAt
      })),
      userPurchaseDetails: userPurchases
    });
    
  } catch (error) {
    console.error('Debug purchases error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}