const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importing cors

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// MySQL Connection Pool
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'emergency_waitlist_v2',
    connectionLimit: 10,
});

// Utility function to handle MySQL queries
const executeQuery = (query, params, res, successCallback) => {
    console.log('Executing query:', query, params); // Debugging log
    pool.query(query, params, (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).send('Server error');
        }
        successCallback(results);
    });
};

// User Login Endpoint
app.post('/login', (req, res) => {
    const { name, code } = req.body;

    if (!name || !code) {
        return res.status(400).send('Name and code are required');
    }

    const query = `SELECT * FROM users WHERE name = ? AND code = ?`;

    executeQuery(query, [name, code], res, (results) => {
        if (results.length === 0) {
            return res.status(401).send('Invalid credentials');
        }

        const user = results[0];
        console.log(`User authenticated: ${user.name}, Role: ${user.role}`);
        res.json({ message: 'Login successful', user });
    });
});

// Add New Patient
app.post('/admin/patients', (req, res) => {
    const { name, gender, date_of_birth, contact, priority_id } = req.body;

    if (!name || !gender || !date_of_birth || !contact || !priority_id) {
        return res.status(400).send('All fields are required');
    }

    const query = `INSERT INTO patients (name, gender, date_of_birth, contact, priority_id) VALUES (?, ?, ?, ?, ?)`;

    executeQuery(query, [name, gender, date_of_birth, contact, priority_id], res, (results) => {
        console.log('Patient added successfully:', results);
        res.status(201).send('Patient added successfully');
    });
});

// Get Wait Time for a User
app.get('/user/wait-time', (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).send('User ID is required');
    }

    const query = `
        SELECT p.name, p.priority_id, v.visit_time, pr.time_estimate
        FROM patients p
        INNER JOIN visits v ON p.patient_id = v.patient_id
        INNER JOIN priorities pr ON p.priority_id = pr.priority_id
        WHERE p.patient_id = ?
        ORDER BY v.visit_time ASC
    `;

    executeQuery(query, [userId], res, (results) => {
        if (results.length === 0) {
            return res.status(404).send('No wait time information found');
        }

        const waitTime = results.reduce((total, record) => total + record.time_estimate, 0);
        res.json({ waitTime, queuePosition: results.length });
    });
});

// Update Patient Status
app.put('/admin/patients/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).send('Status is required');
    }

    const query = `UPDATE patients SET status = ? WHERE patient_id = ?`;
    executeQuery(query, [status, id], res, (results) => {
        if (results.affectedRows === 0) {
            return res.status(404).send('Patient not found');
        }
        console.log(`Patient status updated for ID ${id}:`, results);
        res.send(`Patient status updated to ${status}`);
    });
});

// Assign Room and Doctor to a Patient
app.put('/admin/patients/assign', (req, res) => {
    const { patient_id, doctor_id, room_id } = req.body;

    // Debugging logs
    console.log('Assign Endpoint Hit');
    console.log('Request Body:', req.body);

    // Validate required fields
    if (!patient_id || !doctor_id || !room_id) {
        console.error('Validation Failed: Missing Fields');
        return res.status(400).send('Patient ID, Doctor ID, and Room ID are required');
    }

    const query = `
        INSERT INTO visits (patient_id, doctor_id, room_id, visit_time)
        VALUES (?, ?, ?, NOW())
    `;

    executeQuery(query, [patient_id, doctor_id, room_id], res, (results) => {
        console.log('Query Success:', results);
        res.status(200).send('Room and doctor assigned successfully');
    });
});

// View All Patients
app.get('/admin/patients', (req, res) => {
    const query = `
        SELECT p.*, d.name AS doctor_name, r.room_number
        FROM patients p
        LEFT JOIN visits v ON p.patient_id = v.patient_id
        LEFT JOIN doctors d ON v.doctor_id = d.doctor_id
        LEFT JOIN rooms r ON v.room_id = r.room_id
    `;
    executeQuery(query, [], res, (results) => {
        console.log('All patients fetched:', results);
        res.json(results);
    });
});

// Search Patients by Name
app.get('/admin/patients/search', (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).send('Name is required for search');
    }

    const query = `SELECT * FROM patients WHERE name LIKE ?`;
    executeQuery(query, [`%${name}%`], res, (results) => {
        res.json(results);
    });
});

// Get All Doctors
app.get('/admin/doctors', (req, res) => {
    const query = `SELECT * FROM doctors`;
    executeQuery(query, [], res, (results) => {
        res.json(results);
    });
});

// Get Available Rooms
app.get('/admin/rooms/available', (req, res) => {
    const query = `SELECT * FROM rooms WHERE status = FALSE`;
    executeQuery(query, [], res, (results) => {
        res.json(results);
    });
});

// Update Room Status
app.put('/admin/rooms/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== 'boolean') {
        return res.status(400).send('Status must be true or false');
    }

    const query = `UPDATE rooms SET status = ? WHERE room_id = ?`;
    executeQuery(query, [status, id], res, (results) => {
        if (results.affectedRows === 0) {
            return res.status(404).send('Room not found');
        }
        res.send('Room status updated successfully');
    });
});

// Fallback Route for 404
app.use((req, res) => {
    res.status(404).send('Endpoint not found');
});

// Start the Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
