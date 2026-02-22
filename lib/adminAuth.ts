import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function basicAuth(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
      },
    });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Simple comparison for now (in production, use bcrypt comparison with DB)
  if (username === validUsername && password === validPassword) {
    return null; // Authentication successful
  }

  return new NextResponse('Invalid credentials', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
    },
  });
}

export function requireAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T) => {
    const authError = await basicAuth(request);
    if (authError) {
      return authError;
    }
    return handler(request, ...args);
  };
}
