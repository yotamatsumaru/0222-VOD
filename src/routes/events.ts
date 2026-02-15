import { Hono } from 'hono';
import type { Bindings } from '../types';
import { Database } from '../lib/db';

const events = new Hono<{ Bindings: Bindings }>();

// Get all events (with optional filters)
events.get('/', async (c) => {
  try {
    const artistSlug = c.req.query('artist');
    const status = c.req.query('status');
    
    const db = new Database(c.env.DB);
    
    let filters: any = {};
    
    if (artistSlug) {
      const artist = await db.getArtistBySlug(artistSlug);
      if (artist) {
        filters.artistId = artist.id;
      }
    }
    
    if (status) {
      filters.status = status;
    }
    
    const eventsList = await db.getEvents(filters);
    
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
    const db = new Database(c.env.DB);
    
    const event = await db.getEventBySlug(slug);
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    // Get tickets for this event
    const tickets = await db.getTicketsByEventId(event.id);
    
    return c.json({
      ...event,
      tickets,
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
    const db = new Database(c.env.DB);
    
    const event = await db.getEventBySlug(slug);
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    const tickets = await db.getTicketsByEventId(event.id);
    
    return c.json(tickets);
  } catch (error: any) {
    console.error('Get tickets error:', error);
    return c.json({ error: 'Failed to get tickets', details: error.message }, 500);
  }
});

export default events;
