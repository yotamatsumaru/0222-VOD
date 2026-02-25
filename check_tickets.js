const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform'
});

async function checkTickets() {
  try {
    console.log('Connecting to database...');
    const result = await pool.query('SELECT id, name, price, currency, event_id FROM tickets ORDER BY id');
    
    console.log('\n=== Current Tickets ===');
    console.log('Total tickets:', result.rows.length);
    console.log('\nTicket Details:');
    result.rows.forEach(ticket => {
      console.log(`ID: ${ticket.id}, Name: ${ticket.name}, Price: ${ticket.price}, Currency: ${ticket.currency || 'NULL'}, Event ID: ${ticket.event_id}`);
    });
    
    // Check for problematic tickets
    const problemTickets = result.rows.filter(t => !t.currency || t.currency !== 'jpy');
    if (problemTickets.length > 0) {
      console.log('\n⚠️  WARNING: Found tickets with incorrect currency:');
      problemTickets.forEach(ticket => {
        console.log(`  - Ticket ID ${ticket.id}: "${ticket.name}" has currency: ${ticket.currency || 'NULL'}`);
      });
    } else {
      console.log('\n✅ All tickets have currency = "jpy"');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTickets();
