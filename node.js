// server.js - In-memory storage (NO disk needed!)
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// In-memory data storage (no database file needed!)
let donors = [
    { id: 1, name: 'John Doe', age: 28, blood_group: 'A+', phone: '9876543210', address: 'New York', donation_date: '2024-01-15', created_at: new Date() },
    { id: 2, name: 'Sarah Smith', age: 24, blood_group: 'O+', phone: '9876543211', address: 'Los Angeles', donation_date: '2024-02-10', created_at: new Date() },
    { id: 3, name: 'Mike Johnson', age: 32, blood_group: 'B+', phone: '9876543212', address: 'Chicago', donation_date: '2024-01-20', created_at: new Date() }
];

let bloodRequests = [
    { id: 1, patient_name: 'Alice Johnson', blood_group: 'A+', quantity: 2, hospital: 'City Hospital', contact: '9876543220', urgency: 'High', status: 'Pending', request_date: new Date() },
    { id: 2, patient_name: 'Bob Williams', blood_group: 'O+', quantity: 3, hospital: 'Medical Center', contact: '9876543221', urgency: 'Normal', status: 'Pending', request_date: new Date() }
];

let nextDonorId = 4;
let nextRequestId = 3;

// ============ API ENDPOINTS ============

// Get all donors
app.get('/api/donors', (req, res) => {
    res.json(donors);
});

// Add new donor
app.post('/api/donors', (req, res) => {
    const { name, age, blood_group, phone, address, donation_date } = req.body;
    
    if (!name || !age || !blood_group || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newDonor = {
        id: nextDonorId++,
        name,
        age,
        blood_group,
        phone,
        address: address || '',
        donation_date: donation_date || null,
        created_at: new Date()
    };
    
    donors.unshift(newDonor);
    console.log('✅ Donor added:', newDonor.name);
    res.json({ id: newDonor.id, message: 'Donor added successfully' });
});

// Delete donor
app.delete('/api/donors/:id', (req, res) => {
    const id = parseInt(req.params.id);
    donors = donors.filter(d => d.id !== id);
    res.json({ message: 'Donor deleted successfully' });
});

// Get all blood requests
app.get('/api/requests', (req, res) => {
    res.json(bloodRequests);
});

// Add new blood request
app.post('/api/requests', (req, res) => {
    const { patient_name, blood_group, quantity, hospital, contact, urgency } = req.body;
    
    if (!patient_name || !blood_group || !quantity || !contact) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newRequest = {
        id: nextRequestId++,
        patient_name,
        blood_group,
        quantity,
        hospital: hospital || '',
        contact,
        urgency: urgency || 'Normal',
        status: 'Pending',
        request_date: new Date()
    };
    
    bloodRequests.unshift(newRequest);
    console.log('✅ Request added:', newRequest.patient_name);
    res.json({ id: newRequest.id, message: 'Request submitted successfully' });
});

// Update request status
app.put('/api/requests/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const request = bloodRequests.find(r => r.id === id);
    if (request) {
        request.status = status;
    }
    res.json({ message: 'Status updated successfully' });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const bloodGroups = {};
    donors.forEach(d => {
        bloodGroups[d.blood_group] = (bloodGroups[d.blood_group] || 0) + 1;
    });
    
    res.json({
        totalDonors: donors.length,
        pendingRequests: bloodRequests.filter(r => r.status === 'Pending').length,
        bloodGroups: Object.entries(bloodGroups).map(([blood_group, count]) => ({ blood_group, count }))
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Blood Bank API is running!',
        storage: 'In-memory (data resets on restart)',
        donors_count: donors.length,
        requests_count: bloodRequests.length,
        timestamp: new Date().toISOString()
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Blood Bank Server is running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`💾 Storage: In-memory (no disk needed, completely free!)`);
    console.log(`📊 Current data: ${donors.length} donors, ${bloodRequests.length} requests`);
    console.log(`\n⚠️  Note: Data resets when server restarts (perfect for demo!)\n`);
});