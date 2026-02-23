import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/adminAuth';
import { update, remove } from '@/lib/db';

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, stock, isActive, is_active } = body;

    // Support both camelCase and snake_case
    const finalIsActive = isActive !== undefined ? isActive : is_active;

    const ticket = await update(
      `UPDATE tickets SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        stock = COALESCE($4, stock),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *`,
      [name, description, price, stock, finalIsActive, parseInt(id)]
    );

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deleted = await remove('DELETE FROM tickets WHERE id = $1', [
      parseInt(id),
    ]);

    if (!deleted) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}

export const PATCH = requireAuth(patchHandler);
export const DELETE = requireAuth(deleteHandler);
