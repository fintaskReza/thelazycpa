const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// SMTP Configuration - Set these in Vercel environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: process.env.GOOGLE_SHEETS_ID,
  apiKey: process.env.GOOGLE_API_KEY
};

// Create SMTP transporter if credentials exist
let transporter = null;
if (SMTP_CONFIG.host && SMTP_CONFIG.auth.user) {
  transporter = nodemailer.createTransport(SMTP_CONFIG);
  console.log('✉️ SMTP configured');
} else {
  console.log('⚠️ SMTP not configured - set SMTP_HOST, SMTP_USER, SMTP_PASS env vars');
}

// Initialize SQLite database
const db = new sqlite3.Database('./subscribers.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Create subscribers table
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
    
    // Create waiting lists table
    db.run(`CREATE TABLE IF NOT EXISTS waiting_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT,
      list_type TEXT NOT NULL, -- 'business_ai' or 'accountants_ai'
      company TEXT,
      role TEXT,
      linkedin_url TEXT,
      notes TEXT,
      gsheet_synced BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// Email sending function
async function sendEmail(to, subject, html, text) {
  if (!transporter) {
    console.log('SMTP not configured, skipping email send');
    return { success: false, error: 'SMTP not configured' };
  }
  
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'reza@thelazycpa.com',
      to,
      subject,
      text,
      html
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
}

// Welcome email template
function getWelcomeEmail(name) {
  return {
    subject: "Your AI & Automation 101 Guide is Here! 🤖",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #00ff88;">Hey ${name || 'there'}! 👋</h1>
        
        <p>Thanks for downloading the AI & Automation 101 guide!</p>
        
        <p><strong>Download your guide here:</strong><br>
        <a href="https://thelazycpa.vercel.app/AI-Automation-101.pdf" 
           style="display: inline-block; background: #00ff88; color: #000; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">
          📥 Download Guide
        </a></p>
        
        <h3>What's inside:</h3>
        <ul>
          <li>12 core concepts explained simply</li>
          <li>Real examples from 30+ apps I built</li>
          <li>DOs and DON'Ts for each topic</li>
          <li>No jargon, no fluff</li>
        </ul>
        
        <h3>Quick question:</h3>
        <p>What are you currently trying to build or automate? Hit reply and let me know — I read every email!</p>
        
        <p>Talk soon,<br>
        <strong>Reza</strong><br>
        <em>The Lazy CPA</em></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="font-size: 12px; color: #666;">
          You're receiving this because you downloaded the AI & Automation 101 guide from thelazycpa.com
        </p>
      </div>
    `,
    text: `Hey ${name || 'there'}!

Thanks for downloading the AI & Automation 101 guide!

Download your guide here:
https://thelazycpa.vercel.app/AI-Automation-101.pdf

What's inside:
- 12 core concepts explained simply
- Real examples from 30+ apps I built
- DOs and DON'Ts for each topic
- No jargon, no fluff

Quick question: What are you currently trying to build or automate? Hit reply and let me know!

Talk soon,
Reza
The Lazy CPA
`
  };
}

// Waiting list confirmation email
function getWaitingListEmail(name, courseType) {
  const courseName = courseType === 'business_ai' 
    ? 'AI for Business Owners'
    : 'AI for Accountants';
  
  const launchDate = 'March 2025';
  
  return {
    subject: `You're on the ${courseName} waiting list! 🚀`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #00ff88;">You're in, ${name || 'there'}! 🎉</h1>
        
        <p>You're on the waiting list for <strong>${courseName}</strong> launching in ${launchDate}.</p>
        
        <h3>What to expect:</h3>
        <ul>
          <li>Early access pricing (50% off)</li>
          <li>Bonus modules not in the main course</li>
          <li>Direct access to me for questions</li>
          <li>Private community invitation</li>
        </ul>
        
        <p><strong>Launch date:</strong> ${launchDate}</p>
        
        <p>I'll send you updates as we get closer to launch. In the meantime, check out the free guide if you haven't already!</p>
        
        <p>Excited to have you on board,<br>
        <strong>Reza</strong></p>
      </div>
    `,
    text: `You're in, ${name || 'there'}!

You're on the waiting list for ${courseName} launching in ${launchDate}.

What to expect:
- Early access pricing (50% off)
- Bonus modules not in the main course
- Direct access to me for questions
- Private community invitation

Launch date: ${launchDate}

I'll send you updates as we get closer. In the meantime, check out the free guide!

Excited to have you on board,
Reza
`
  };
}

// Google Sheets sync function (placeholder - needs Google API setup)
async function syncToGoogleSheets(data, sheetName) {
  if (!GOOGLE_SHEETS_CONFIG.spreadsheetId) {
    console.log('Google Sheets not configured');
    return { success: false, error: 'Google Sheets not configured' };
  }
  
  // This would need proper Google API authentication
  // For now, we'll store in SQLite and provide export functionality
  console.log('Would sync to Google Sheets:', data);
  return { success: true };
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    smtp_configured: !!transporter,
    gsheet_configured: !!GOOGLE_SHEETS_CONFIG.spreadsheetId
  });
});

// Subscribe endpoint
app.post('/api/subscribe', async (req, res) => {
  const { email, name, source } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  const sql = `INSERT OR IGNORE INTO subscribers (email, name, source) VALUES (?, ?, ?)`;
  
  db.run(sql, [email.toLowerCase().trim(), name || null, source || 'website'], async function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(409).json({ error: 'Email already subscribed' });
    }
    
    console.log(`New subscriber: ${email}`);
    
    // Send welcome email
    const emailTemplate = getWelcomeEmail(name);
    const emailResult = await sendEmail(email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
    
    res.json({ 
      success: true, 
      message: 'Subscribed successfully',
      email: email,
      email_sent: emailResult.success
    });
  });
});

// Waiting list endpoint
app.post('/api/waiting-list', async (req, res) => {
  const { email, name, list_type, company, role, linkedin_url, notes } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  if (!['business_ai', 'accountants_ai'].includes(list_type)) {
    return res.status(400).json({ error: 'Invalid list type' });
  }
  
  const sql = `INSERT INTO waiting_lists (email, name, list_type, company, role, linkedin_url, notes) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [
    email.toLowerCase().trim(),
    name || null,
    list_type,
    company || null,
    role || null,
    linkedin_url || null,
    notes || null
  ], async function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log(`New waiting list signup: ${email} for ${list_type}`);
    
    // Send confirmation email
    const emailTemplate = getWaitingListEmail(name, list_type);
    const emailResult = await sendEmail(email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
    
    // Try to sync to Google Sheets
    const gsheetResult = await syncToGoogleSheets({
      email, name, list_type, company, role, linkedin_url, notes,
      created_at: new Date().toISOString()
    }, list_type);
    
    res.json({ 
      success: true, 
      message: 'Added to waiting list',
      email: email,
      email_sent: emailResult.success,
      gsheet_synced: gsheetResult.success
    });
  });
});

// Get waiting list subscribers
app.get('/api/waiting-list/:type', (req, res) => {
  const { type } = req.params;
  const { format } = req.query;
  
  if (!['business_ai', 'accountants_ai'].includes(type)) {
    return res.status(400).json({ error: 'Invalid list type' });
  }
  
  db.all(
    `SELECT * FROM waiting_lists WHERE list_type = ? ORDER BY created_at DESC`,
    [type],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (format === 'csv') {
        const csv = [
          'Email,Name,Company,Role,LinkedIn,Notes,Created At',
          ...rows.map(r => `"${r.email}","${r.name || ''}","${r.company || ''}","${r.role || ''}","${r.linkedin_url || ''}","${r.notes || ''}","${r.created_at}"`)
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=waiting-list-${type}.csv`);
        return res.send(csv);
      }
      
      res.json(rows);
    }
  );
});

// Export waiting list for Google Sheets import
app.get('/api/waiting-list/:type/export', (req, res) => {
  const { type } = req.params;
  
  if (!['business_ai', 'accountants_ai'].includes(type)) {
    return res.status(400).json({ error: 'Invalid list type' });
  }
  
  const listName = type === 'business_ai' ? 'AI for Business Owners' : 'AI for Accountants';
  
  db.all(
    `SELECT * FROM waiting_lists WHERE list_type = ? ORDER BY created_at DESC`,
    [type],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        list_name: listName,
        total: rows.length,
        instructions: 'Copy this data and paste into Google Sheets',
        columns: ['Email', 'Name', 'Company', 'Role', 'LinkedIn URL', 'Notes', 'Joined'],
        data: rows.map(r => ({
          email: r.email,
          name: r.name,
          company: r.company,
          role: r.role,
          linkedin_url: r.linkedin_url,
          notes: r.notes,
          joined: r.created_at
        }))
      });
    }
  );
});

// Get all subscribers
app.get('/api/subscribers', (req, res) => {
  const { format } = req.query;
  
  db.all(`SELECT * FROM subscribers ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (format === 'csv') {
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
      
      const list = rows.map(r => ({
        email: r.email,
        name: r.name,
        linkedin_search: r.name ? `${r.name}` : r.email.split('@')[0],
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
  const stats = {};
  
  db.get(`SELECT COUNT(*) as total FROM subscribers`, [], (err, total) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    stats.total_subscribers = total.total;
    
    db.get(`SELECT COUNT(*) as linkedin_pending FROM subscribers WHERE linkedin_connected = 0`, [], (err, pending) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      stats.linkedin_pending = pending.linkedin_pending;
      
      db.get(`SELECT COUNT(*) as dm_sent FROM subscribers WHERE dm_sent = 1`, [], (err, sent) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.dm_sent = sent.dm_sent;
        
        db.get(`SELECT COUNT(*) as total FROM waiting_lists WHERE list_type = 'business_ai'`, [], (err, business) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          stats.waiting_list_business = business.total;
          
          db.get(`SELECT COUNT(*) as total FROM waiting_lists WHERE list_type = 'accountants_ai'`, [], (err, accountants) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            stats.waiting_list_accountants = accountants.total;
            
            res.json({
              ...stats,
              dm_conversion_rate: stats.total_subscribers > 0 ? ((stats.dm_sent / stats.total_subscribers) * 100).toFixed(1) + '%' : '0%',
              smtp_configured: !!transporter,
              gsheet_configured: !!GOOGLE_SHEETS_CONFIG.spreadsheetId
            });
          });
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
  console.log(`📚 Business Waiting List: http://localhost:${PORT}/api/waiting-list/business_ai`);
  console.log(`📚 Accountants Waiting List: http://localhost:${PORT}/api/waiting-list/accountants_ai`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err);
    else console.log('Database connection closed');
    process.exit(0);
  });
});
