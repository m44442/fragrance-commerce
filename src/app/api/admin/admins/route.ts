import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// 管理者一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // スーパー管理者かチェック
    if (session.user.email !== 'rikumatsumoto.2003@gmail.com') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // 管理者ユーザーを取得
    const admins = await prisma.user.findMany({
      where: {
        isAdmin: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ 
      admins: admins.map(admin => ({
        ...admin,
        createdAt: admin.createdAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('Failed to fetch admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

// 新しい管理者を追加
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // スーパー管理者かチェック
    if (session.user.email !== 'rikumatsumoto.2003@gmail.com') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, password } = body;

    // 入力検証
    if (!email || !name || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // 管理者ユーザーを作成
    const newAdmin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isAdmin: true,
        role: 'ADMIN',
        emailVerified: new Date() // 管理者は即座に認証済みとする
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        role: true,
        createdAt: true
      }
    });

    console.log(`New admin created: ${email} by ${session.user.email}`);

    return NextResponse.json({ 
      message: 'Admin created successfully',
      admin: {
        ...newAdmin,
        createdAt: newAdmin.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Failed to create admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}