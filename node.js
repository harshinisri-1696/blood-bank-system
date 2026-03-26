// server.js - Blood Bank Backend API
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sri@1696', // Change this to your MySQL password
    database: 'blood_bank'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to blood_bank database');
    }
});

// ============ DONORS API ENDPOINTS ============

// Get all donors
app.get('/api/donors', (req, res) => {
    db.query('SELECT * FROM donors ORDER BY created_at DESC', (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(result);
        }
    });
});

// Add new donor
app.post('/api/donors', (req, res) => {
    const { name, age, blood_group, phone, address, last_donation_date } = req.body;
    db.query(
        'INSERT INTO donors (name, age, blood_group, phone, address, last_donation_date) VALUES (?, ?, ?, ?, ?, ?)',
        [name, age, blood_group, phone, address, last_donation_date],
        (err, result) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: result.insertId, ...req.body });
            }
        }
    );
});

// Delete donor
app.delete('/api/donors/:id', (req, res) => {
    db.query('DELETE FROM donors WHERE id = ?', [req.params.id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Donor deleted successfully' });
        }
    });
});

// ============ BLOOD REQUESTS API ENDPOINTS ============

// Get all blood requests
app.get('/api/requests', (req, res) => {
    db.query('SELECT * FROM blood_requests ORDER BY request_date DESC', (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(result);
        }
    });
});

// Add new blood request
app.post('/api/requests', (req, res) => {
    const { patient_name, blood_group, quantity, hospital_name, contact_phone, urgency } = req.body;
    db.query(
        'INSERT INTO blood_requests (patient_name, blood_group, quantity, hospital_name, contact_phone, urgency) VALUES (?, ?, ?, ?, ?, ?)',
        [patient_name, blood_group, quantity, hospital_name, contact_phone, urgency],
        (err, result) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: result.insertId, ...req.body });
            }
        }
    );
});

// Update request status
app.put('/api/requests/:id', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE blood_requests SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Status updated successfully' });
        }
    });
});

// ============ STATISTICS API ============

// Get blood bank statistics
app.get('/api/stats', (req, res) => {
    const stats = {};
    
    // Get total donors
    db.query('SELECT COUNT(*) as total FROM donors', (err, result) => {
        if (!err) stats.totalDonors = result[0].total;
        
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

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Blood Bank Server running on port ${PORT}`);
});