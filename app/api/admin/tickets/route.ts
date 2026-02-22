import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/adminAuth';
import { getAll, insert } from '@/lib/db';

async function getHandler(request: NextRequest) {
  try {
    const tickets = await getAll(
      `SELECT t.*, e.title as event_title
       FROM tickets t
       LEFT JOIN events e ON t.event_id = e.id
       ORDER BY t.created_at DESC`
    );

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, name, description, price, currency, stock, isActive } = body;

    console.log('POST /api/admin/tickets - Request body:', body);

    if (!eventId || !name || price === undefined) {
      console.error('POST /api/admin/tickets - Missing required fields:', { eventId, name, price });
      return NextResponse.json(
        { error: 'Missing required fields: eventId, name, and price are required' },
        { status: 400 }
      );
    }

    console.log('POST /api/admin/tickets - Inserting ticket into database...');

    const ticket = await insert(
      `INSERT INTO tickets (event_id, name, description, price, currency, stock, sold, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
       RETURNING *`,
      [
        eventId,
        name,
        description || null,
        price,
        currency || 'jpy',
        stock || null,
        isActive !== undefined ? isActive : true,
      ]
    );

    console.log('POST /api/admin/tickets - Ticket created successfully:', ticket);

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/tickets - Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create ticket',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
