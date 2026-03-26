// server.js - Blood Bank Backend API
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// !!! IMPORTANT: Update these credentials !!!
const db = mysql.createConnection({
    host: 'localhost',   
    user: 'root',          
    password: 'sri@1696',         
    database: 'blood_bank' 
});

// Test database connection
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Check username and password');
        console.log('3. Verify database exists: SHOW DATABASES;');
        console.log('4. Check if port 3306 is available');
        return;
    }
    console.log('✅ Connected to blood_bank database');
});

// ============ API ENDPOINTS ============

// Get all donors
app.get('/api/donors', (req, res) => {
    const query = 'SELECT * FROM donors ORDER BY created_at DESC';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching donors:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(result);
        }
    });
});

// Add new donor
app.post('/api/donors', (req, res) => {
    const { name, age, blood_group, phone, address, last_donation_date } = req.body;
    
    // Basic validation
    if (!name || !age || !blood_group || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = 'INSERT INTO donors (name, age, blood_group, phone, address, last_donation_date) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [name, age, blood_group, phone, address, last_donation_date], (err, result) => {
        if (err) {
            console.error('Error adding donor:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: result.insertId, ...req.body });
        }
    });
});

// Delete donor
app.delete('/api/donors/:id', (req, res) => {
    const query = 'DELETE FROM donors WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
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
    const query = 'SELECT * FROM blood_requests ORDER BY request_date DESC';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching requests:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(result);
        }
    });
});

// Add new blood request
app.post('/api/requests', (req, res) => {
    const { patient_name, blood_group, quantity, hospital_name, contact_phone, urgency } = req.body;
    
    if (!patient_name || !blood_group || !quantity || !contact_phone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = 'INSERT INTO blood_requests (patient_name, blood_group, quantity, hospital_name, contact_phone, urgency) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [patient_name, blood_group, quantity, hospital_name, contact_phone, urgency || 'Normal'], (err, result) => {
        if (err) {
            console.error('Error adding request:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: result.insertId, ...req.body });
        }
    });
});

// Update request status
app.put('/api/requests/:id', (req, res) => {
    const { status } = req.body;
    const query = 'UPDATE blood_requests SET status = ? WHERE id = ?';
    db.query(query, [status, req.params.id], (err, result) => {
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
    const stats = {};
    
    // Get total donors
    db.query('SELECT COUNT(*) as total FROM donors', (err, result) => {
        if (err) {
            console.error('Error getting donor count:', err);
            stats.totalDonors = 0;
        } else {
            stats.totalDonors = result[0].total;
        }
        
        // Get blood group distribution
        db.query('SELECT blood_group, COUNT(*) as count FROM donors GROUP BY blood_group', (err, result) => {
            if (!err) stats.bloodGroups = result;
            
            // Get pending requests
            db.query('SELECT COUNT(*) as pending FROM blood_requests WHERE status = "Pending"', (err, result) => {
                if (!err) stats.pendingRequests = result[0].pending;
                res.json(stats);
            });
        });
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Blood Bank API is running!' });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Blood Bank Server is running!`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`📋 Test endpoint: http://localhost:${PORT}/api/test\n`);
    console.log('Available endpoints:');
    console.log('  GET    /api/donors     - Get all donors');
    console.log('  POST   /api/donors     - Add new donor');
    console.log('  DELETE /api/donors/:id - Delete donor');
    console.log('  GET    /api/requests   - Get all requests');
    console.log('  POST   /api/requests   - Add new request');
    console.log('  PUT    /api/requests/:id - Update request');
    console.log('  GET    /api/stats      - Get statistics\n');
});