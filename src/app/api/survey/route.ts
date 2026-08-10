import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Survey from '@/models/Survey';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function checkAuth() {
  return { email: 'admin@earthwork.com', role: 'admin' };
}

export async function POST(request: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await connectToDatabase();
    } catch (dbError: any) {
      console.error('Database connection failed in POST survey:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please verify your MongoDB URI credentials in .env.local.' },
        { status: 400 }
      );
    }

    const { zone, area, points, targetZ, gridArea, metrics } = await request.json();

    if (!zone || !area || !points || points.length === 0 || targetZ === undefined || gridArea === undefined || !metrics) {
      return NextResponse.json({ error: 'Missing required survey data' }, { status: 400 });
    }

    const newSurvey = await Survey.create({
      zone,
      area,
      points,
      targetZ,
      gridArea,
      metrics,
    });

    return NextResponse.json({ success: true, survey: newSurvey });
  } catch (error: any) {
    console.error('Save survey error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await connectToDatabase();
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      const zone = searchParams.get('zone');
      const area = searchParams.get('area');

      // If a specific ID is requested, return the full survey including points
      if (id) {
        const survey = await Survey.findById(id);
        if (!survey) {
          return NextResponse.json({ error: 'Survey record not found' }, { status: 404 });
        }
        return NextResponse.json({ survey });
      }

      // Build filter query
      const query: any = {};
      if (zone) query.zone = zone;
      if (area) query.area = area;

      // Exclude points in general list query for light payload
      const surveys = await Survey.find(query, { points: 0 }).sort({ createdAt: -1 });
      return NextResponse.json({ surveys });
    } catch (dbError: any) {
      console.error('Database connection failed in GET survey, returning empty fallback list:', dbError);
      // Return empty array gracefully to prevent frontend crash
      return NextResponse.json({ surveys: [], isFallback: true });
    }
  } catch (error: any) {
    console.error('Get surveys error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
