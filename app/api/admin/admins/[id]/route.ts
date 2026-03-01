import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/adminAuthNew';
import { update, remove } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, password, email, artistId, isActive } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }

    if (password !== undefined && password.trim() !== '') {
      const password_hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(password_hash);
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email || null);
    }

    if (artistId !== undefined) {
      updates.push(`artist_id = $${paramIndex++}`);
      values.push(artistId || null);
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(parseInt(id));

    const admin = await update(
      `UPDATE admins SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, username, email, role, artist_id, is_active, created_at, updated_at`,
      values
    );

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json(
      { error: 'Failed to update admin' },
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

    const deleted = await remove(
      'DELETE FROM admins WHERE id = $1 AND role = $2',
      [parseInt(id), 'artist_admin']
    );

    if (!deleted) {
      return NextResponse.json(
        { error: 'Admin not found or cannot be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}

export const PATCH = requireSuperAdmin(patchHandler);
export const DELETE = requireSuperAdmin(deleteHandler);
