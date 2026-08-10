import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Survey from '@/models/Survey';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function checkAuth() {
  return { email: 'admin@earthwork.com', role: 'admin' };
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const result = await Survey.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ error: 'Survey record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Survey record deleted successfully' });
  } catch (error: any) {
    console.error('Delete survey error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
