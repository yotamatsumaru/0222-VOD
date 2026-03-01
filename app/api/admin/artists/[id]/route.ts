import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuthNew';
import { update, remove } from '@/lib/db';

async function patchHandler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean },
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, bio, image_url } = body;

    const artist = await update(
      `UPDATE artists SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        bio = COALESCE($3, bio),
        image_url = COALESCE($4, image_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [name, slug, bio, image_url, parseInt(id)]
    );

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json(artist);
  } catch (error: any) {
    console.error('Update artist error:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Artist with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update artist' },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean },
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deleted = await remove('DELETE FROM artists WHERE id = $1', [
      parseInt(id),
    ]);

    if (!deleted) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Artist deleted successfully' });
  } catch (error) {
    console.error('Delete artist error:', error);
    return NextResponse.json(
      { error: 'Failed to delete artist' },
      { status: 500 }
    );
  }
}

export const PATCH = requireAdmin(patchHandler);
export const DELETE = requireAdmin(deleteHandler);
