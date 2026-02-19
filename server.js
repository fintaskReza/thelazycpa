const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize SQLite database
const db = new sqlite3.Database('./subscribers.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    // Create table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      source TEXT DEFAULT 'website',
      linkedin_connected BOOLEAN DEFAULT 0,
      dm_sent BOOLEAN DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Subscribe endpoint
app.post('/api/subscribe', (req, res) => {
  const { email, name, source } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  const sql = `INSERT OR IGNORE INTO subscribers (email, name, source) VALUES (?, ?, ?)`;
  
  db.run(sql, [email.toLowerCase().trim(), name || null, source || 'website'], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(409).json({ error: 'Email already subscribed' });
    }
    
    console.log(`New subscriber: ${email}`);
    res.json({ 
      success: true, 
      message: 'Subscribed successfully',
      email: email 
    });
  });
});

// Get all subscribers (for admin use - protect this in production)
app.get('/api/subscribers', (req, res) => {
  const { format } = req.query;
  
  db.all(`SELECT * FROM subscribers ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (format === 'csv') {
      // Return as CSV for LinkedIn DM outreach
      const csv = [
        'Email,Name,Source,LinkedIn Connected,DM Sent,Created At',
        ...rows.map(r => `"${r.email}","${r.name || ''}","${r.source}",${r.linkedin_connected},${r.dm_sent},"${r.created_at}"`)
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
      return res.send(csv);
    }
    
    res.json(rows);
  });
});

// Get subscribers needing LinkedIn DM
app.get('/api/subscribers/linkedin-queue', (req, res) => {
  db.all(
    `SELECT email, name, created_at FROM subscribers 
     WHERE linkedin_connected = 0 
     ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Mark subscriber as LinkedIn connected
app.post('/api/subscribers/:email/linkedin', (req, res) => {
  const { email } = req.params;
  const { connected, dm_sent, notes } = req.body;
  
  db.run(
    `UPDATE subscribers SET 
      linkedin_connected = COALESCE(?, linkedin_connected),
      dm_sent = COALESCE(?, dm_sent),
      notes = COALESCE(?, notes)
     WHERE email = ?`,
    [connected, dm_sent, notes, email.toLowerCase()],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, changes: this.changes });
    }
  );
});

// Export for LinkedIn DM outreach
app.get('/api/export/linkedin-dm-list', (req, res) => {
  db.all(
    `SELECT email, name FROM subscribers 
     WHERE linkedin_connected = 0 AND dm_sent = 0
     ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Generate LinkedIn DM outreach list
      const list = rows.map(r => ({
        email: r.email,
        name: r.name,
        linkedin_search: r.name ? `${r.name} Reza` : r.email.split('@')[0],
        dm_script: `Hey ${r.name || 'there'}! Thanks for downloading the AI & Automation guide. Curious - what are you working on building right now? Always interested in what fellow vibe coders are up to!`
      }));
      
      res.json({
        total: list.length,
        message: 'Search these people on LinkedIn and send DMs',
        subscribers: list
      });
    }
  );
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  db.get(`SELECT COUNT(*) as total FROM subscribers`, [], (err, total) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    db.get(`SELECT COUNT(*) as linkedin_pending FROM subscribers WHERE linkedin_connected = 0`, [], (err, pending) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      db.get(`SELECT COUNT(*) as dm_sent FROM subscribers WHERE dm_sent = 1`, [], (err, sent) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        res.json({
          total_subscribers: total.total,
          linkedin_pending: pending.linkedin_pending,
          dm_sent: sent.dm_sent,
          conversion_rate: total.total > 0 ? ((sent.dm_sent / total.total) * 100).toFixed(1) + '%' : '0%'
        });
      });
    });
  });
});

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/guide', (req, res) => {
  res.sendFile(path.join(__dirname, 'guide.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TheLazyCPA server running on port ${PORT}`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`👥 Subscribers: http://localhost:${PORT}/api/subscribers`);
  console.log(`💬 LinkedIn Queue: http://localhost:${PORT}/api/subscribers/linkedin-queue`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err);
    else console.log('Database connection closed');
    process.exit(0);
  });
});
