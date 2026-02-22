import { Hono } from 'hono';
import type { Bindings } from '../types';

const artists = new Hono<{ Bindings: Bindings }>();

// Get all artists
artists.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const result = await db.prepare('SELECT * FROM artists ORDER BY name ASC').all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('Get artists error:', error);
    return c.json({ error: 'Failed to get artists', details: error.message }, 500);
  }
});

// Get single artist by slug
artists.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = c.env.DB;
    
    const artist = await db.prepare(
      'SELECT * FROM artists WHERE slug = $1'
    ).bind(slug).first();
    
    if (!artist) {
      return c.json({ error: 'Artist not found' }, 404);
    }
    
    // Get events for this artist
    const eventsResult = await db.prepare(
      'SELECT * FROM events WHERE artist_id = $1 ORDER BY start_time ASC'
    ).bind(artist.id).all();
    
    return c.json({
      ...artist,
      events: eventsResult.results || [],
    });
  } catch (error: any) {
    console.error('Get artist error:', error);
    return c.json({ error: 'Failed to get artist', details: error.message }, 500);
  }
});

export default artists;
