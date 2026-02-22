import { Hono } from 'hono';
import type { Bindings } from '../types';

const events = new Hono<{ Bindings: Bindings }>();

// Get all events (with optional filters)
events.get('/', async (c) => {
  try {
    const artistSlug = c.req.query('artist');
    const status = c.req.query('status');
    
    const db = c.env.DB;
    
    let query = 'SELECT * FROM events';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (artistSlug) {
      // Get artist ID by slug
      const artistResult = await db.prepare(
        'SELECT id FROM artists WHERE slug = $1'
      ).bind(artistSlug).first<{ id: number }>();
      
      if (artistResult) {
        conditions.push('artist_id = $' + (params.length + 1));
        params.push(artistResult.id);
      }
    }
    
    if (status) {
      conditions.push('status = $' + (params.length + 1));
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY start_time ASC';
    
    const result = await db.prepare(query).bind(...params).all();
    const eventsList = result.results || [];
    
    // Sort events: live first, then upcoming, then others by start_time
    const sortedEvents = eventsList.sort((a, b) => {
      // Priority 1: Live events first
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (a.status !== 'live' && b.status === 'live') return 1;
      
      // Priority 2: Upcoming events
      if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
      if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
      
      // Priority 3: Sort by start_time (earliest first)
      if (a.start_time && b.start_time) {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      }
      
      return 0;
    });
    
    return c.json(sortedEvents);
  } catch (error: any) {
    console.error('Get events error:', error);
    return c.json({ error: 'Failed to get events', details: error.message }, 500);
  }
});

// Get single event by slug
events.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = c.env.DB;
    
    const event = await db.prepare(
      'SELECT * FROM events WHERE slug = $1'
    ).bind(slug).first();
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    // Get tickets for this event
    const ticketsResult = await db.prepare(
      'SELECT * FROM tickets WHERE event_id = $1 AND is_active = true'
    ).bind(event.id).all();
    
    return c.json({
      ...event,
      tickets: ticketsResult.results || [],
    });
  } catch (error: any) {
    console.error('Get event error:', error);
    return c.json({ error: 'Failed to get event', details: error.message }, 500);
  }
});

// Get tickets for an event
events.get('/:slug/tickets', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = c.env.DB;
    
    const event = await db.prepare(
      'SELECT * FROM events WHERE slug = $1'
    ).bind(slug).first();
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    const ticketsResult = await db.prepare(
      'SELECT * FROM tickets WHERE event_id = $1 AND is_active = true'
    ).bind(event.id).all();
    
    return c.json(ticketsResult.results || []);
  } catch (error: any) {
    console.error('Get tickets error:', error);
    return c.json({ error: 'Failed to get tickets', details: error.message }, 500);
  }
});

export default events;
