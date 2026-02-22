import { NextRequest, NextResponse } from 'next/server';
import { basicAuth } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  const authError = await basicAuth(request);
  
  if (authError) {
    return authError;
  }

  // Authentication successful
  return NextResponse.json({ 
    success: true,
    message: 'Authentication successful'
  });
}
