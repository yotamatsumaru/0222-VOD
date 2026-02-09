import { Hono } from 'hono';
import type { Bindings } from '../types';
import { Database } from '../lib/db';

const artists = new Hono<{ Bindings: Bindings }>();

// Get all artists
artists.get('/', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const artistsList = await db.getArtists();
    
    return c.json(artistsList);
  } catch (error: any) {
    console.error('Get artists error:', error);
    return c.json({ error: 'Failed to get artists', details: error.message }, 500);
  }
});

// Get single artist by slug
artists.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = new Database(c.env.DB);
    
    const artist = await db.getArtistBySlug(slug);
    if (!artist) {
      return c.json({ error: 'Artist not found' }, 404);
    }
    
    // Get events for this artist
    const events = await db.getEvents({ artistId: artist.id });
    
    return c.json({
      ...artist,
      events,
    });
  } catch (error: any) {
    console.error('Get artist error:', error);
    return c.json({ error: 'Failed to get artist', details: error.message }, 500);
  }
});

export default artists;
