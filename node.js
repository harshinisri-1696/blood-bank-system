const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// Create SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'blood_bank.db'), (err) => {
    if (err) {
        console.error('❌ Database error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        
        // Create tables
        db.run(`CREATE TABLE IF NOT EXISTS donors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            blood_group TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT,
            donation_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS blood_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_name TEXT NOT NULL,
            blood_group TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            hospital TEXT,
            contact TEXT NOT NULL,
            urgency TEXT DEFAULT 'Normal',
            status TEXT DEFAULT 'Pending',
            request_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Insert sample data if empty
        db.get("SELECT COUNT(*) as count FROM donors", [], (err, row) => {
            if (!err && row && row.count === 0) {
                const sampleDonors = [
                    ['John Doe', 28, 'A+', '9876543210', 'New York', '2024-01-15'],
                    ['Sarah Smith', 24, 'O+', '9876543211', 'Los Angeles', '2024-02-10'],
                    ['Mike Johnson', 32, 'B+', '9876543212', 'Chicago', '2024-01-20']
                ];
                sampleDonors.forEach(donor => {
                    db.run("INSERT INTO donors (name, age, blood_group, phone, address, donation_date) VALUES (?, ?, ?, ?, ?, ?)", donor);
                });
                console.log('📊 Sample donors added');
            }
        });
        
        db.get("SELECT COUNT(*) as count FROM blood_requests", [], (err, row) => {
            if (!err && row && row.count === 0) {
                const sampleRequests = [
                    ['Alice Johnson', 'A+', 2, 'City Hospital', '9876543220', 'High'],
                    ['Bob Williams', 'O+', 3, 'Medical Center', '9876543221', 'Normal']
                ];
                sampleRequests.forEach(req => {
                    db.run("INSERT INTO blood_requests (patient_name, blood_group, quantity, hospital, contact, urgency) VALUES (?, ?, ?, ?, ?, ?)", req);
                });
                console.log('📊 Sample requests added');
            }
        });
    }
});

// ============ API ENDPOINTS ============

// Get all donors
app.get('/api/donors', (req, res) => {
    db.all("SELECT * FROM donors ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
            console.error('Error fetching donors:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows || []);
        }
    });
});

// Add new donor
app.post('/api/donors', (req, res) => {
    const { name, age, blood_group, phone, address, donation_date } = req.body;
    
    if (!name || !age || !blood_group || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = "INSERT INTO donors (name, age, blood_group, phone, address, donation_date) VALUES (?, ?, ?, ?, ?, ?)";
    db.run(query, [name, age, blood_group, phone, address, donation_date || null], function(err) {
        if (err) {
            console.error('Error adding donor:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: this.lastID, message: 'Donor added successfully' });
        }
    });
});

// Delete donor
app.delete('/api/donors/:id', (req, res) => {
    db.run("DELETE FROM donors WHERE id = ?", [req.params.id], function(err) {
        if (err) {
            console.error('Error deleting donor:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Donor deleted successfully' });
        }
    });
});

// Get all blood requests
app.get('/api/requests', (req, res) => {
    db.all("SELECT * FROM blood_requests ORDER BY request_date DESC", [], (err, rows) => {
        if (err) {
            console.error('Error fetching requests:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows || []);
        }
    });
});

// Add new blood request
app.post('/api/requests', (req, res) => {
    const { patient_name, blood_group, quantity, hospital, contact, urgency } = req.body;
    
    if (!patient_name || !blood_group || !quantity || !contact) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = "INSERT INTO blood_requests (patient_name, blood_group, quantity, hospital, contact, urgency) VALUES (?, ?, ?, ?, ?, ?)";
    db.run(query, [patient_name, blood_group, quantity, hospital, contact, urgency || 'Normal'], function(err) {
        if (err) {
            console.error('Error adding request:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: this.lastID, message: 'Request submitted successfully' });
        }
    });
});

// Update request status
app.put('/api/requests/:id', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE blood_requests SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
        if (err) {
            console.error('Error updating request:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Status updated successfully' });
        }
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    db.get("SELECT COUNT(*) as total FROM donors", [], (err, donorCount) => {
        const totalDonors = (err || !donorCount) ? 0 : donorCount.total;
        db.get("SELECT COUNT(*) as pending FROM blood_requests WHERE status = 'Pending'", [], (err, pendingCount) => {
            const pendingRequests = (err || !pendingCount) ? 0 : pendingCount.pending;
            db.all("SELECT blood_group, COUNT(*) as count FROM donors GROUP BY blood_group", [], (err, groups) => {
                res.json({
                    totalDonors: totalDonors,
                    pendingRequests: pendingRequests,
                    bloodGroups: groups || []
                });
            });
        });
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Blood Bank API is running!',
        database: 'SQLite',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

// ============ FRONTEND ROUTES ============

// IMPORTANT: Serve frontend.html for root route
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'frontend.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving frontend.html:', err);
            res.status(404).send(`
                <h1>🩸 Blood Bank System</h1>
                <p>Frontend file not found. Please check deployment.</p>
                <p>API is working! Visit <a href="/api/test">/api/test</a></p>
            `);
        }
    });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Catch-all route - serve frontend for any unknown routes
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'frontend.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Page not found' });
        }
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Blood Bank Server is running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📝 Test: http://localhost:${PORT}/api/test`);
    console.log(`💾 Database: SQLite (blood_bank.db)`);
    console.log(`📁 Current directory: ${__dirname}`);
    console.log(`📄 Frontend exists: ${require('fs').existsSync(path.join(__dirname, 'frontend.html')) ? '✅ Yes' : '❌ No'}`);
    console.log(`\n✅ Ready to deploy on Render!\n`);
});