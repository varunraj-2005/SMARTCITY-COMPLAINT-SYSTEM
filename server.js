/* ==========================================
   SMART CITY MULTI-DEVICE SERVER
   Central server for officer and citizen communication
   ========================================== */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ==========================================
// DATA STORAGE (In-memory for demo)
// ==========================================

let issues = [];
let connectedUsers = {
    officers: [],
    citizens: []
};

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Get all issues
app.get('/api/issues', (req, res) => {
    res.json(issues);
});

// Create new issue (from citizen)
app.post('/api/issues', (req, res) => {
    const { title, description, category, location, reportedBy } = req.body;
    
    const newIssue = {
        id: Date.now().toString(),
        title,
        description,
        category,
        location,
        reportedBy,
        status: 'submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedTo: null,
        priority: 'normal',
        comments: []
    };

    issues.push(newIssue);

    // Broadcast to all connected clients
    io.emit('issueCreated', newIssue);

    res.json({ success: true, issue: newIssue });
});

// Update issue status (from officer)
app.put('/api/issues/:id', (req, res) => {
    const { status, priority, assignedTo, comment } = req.body;
    const issue = issues.find(i => i.id === req.params.id);

    if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
    }

    issue.status = status || issue.status;
    issue.priority = priority || issue.priority;
    issue.assignedTo = assignedTo || issue.assignedTo;
    issue.updatedAt = new Date();

    if (comment) {
        issue.comments.push({
            by: assignedTo,
            text: comment,
            timestamp: new Date()
        });
    }

    // Broadcast to all connected clients
    io.emit('issueUpdated', issue);

    res.json({ success: true, issue });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const stats = {
        totalIssues: issues.length,
        submitted: issues.filter(i => i.status === 'submitted').length,
        inProgress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
        closed: issues.filter(i => i.status === 'closed').length,
        connectedOfficers: connectedUsers.officers.length,
        connectedCitizens: connectedUsers.citizens.length
    };
    res.json(stats);
});

// ==========================================
// WEBSOCKET EVENTS (Real-time communication)
// ==========================================

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Handle user registration
    socket.on('registerUser', (data) => {
        const { role, name, email } = data;

        if (role === 'officer') {
            connectedUsers.officers.push({ id: socket.id, name, email });
            console.log(`Officer connected: ${name}`);
        } else if (role === 'citizen') {
            connectedUsers.citizens.push({ id: socket.id, name, email });
            console.log(`Citizen connected: ${name}`);
        }

        // Broadcast updated user list
        io.emit('usersUpdated', connectedUsers);
        socket.emit('issuesList', issues);
    });

    // Handle issue creation from citizen
    socket.on('createIssue', (data) => {
        const newIssue = {
            id: Date.now().toString(),
            ...data,
            status: 'submitted',
            createdAt: new Date(),
            updatedAt: new Date(),
            assignedTo: null,
            priority: 'normal',
            comments: []
        };

        issues.push(newIssue);
        console.log('New issue created:', newIssue.id);

        // Broadcast to all clients
        io.emit('issueCreated', newIssue);
        
        // Notify all officers
        io.emit('newIssueNotification', {
            message: `New issue reported: ${newIssue.title}`,
            issue: newIssue
        });
    });

    // Handle issue update from officer
    socket.on('updateIssue', (data) => {
        const issue = issues.find(i => i.id === data.id);

        if (issue) {
            issue.status = data.status || issue.status;
            issue.priority = data.priority || issue.priority;
            issue.assignedTo = data.assignedTo || issue.assignedTo;
            issue.updatedAt = new Date();

            if (data.comment) {
                issue.comments.push({
                    by: data.assignedTo,
                    text: data.comment,
                    timestamp: new Date()
                });
            }

            console.log('Issue updated:', issue.id);

            // Broadcast to all clients
            io.emit('issueUpdated', issue);
            
            // Notify the citizen who reported it
            io.emit('issueStatusChanged', {
                issueId: issue.id,
                newStatus: issue.status,
                message: `Issue "${issue.title}" status changed to ${issue.status}`
            });
        }
    });

    // Handle real-time chat/comments
    socket.on('addComment', (data) => {
        const issue = issues.find(i => i.id === data.issueId);
        if (issue) {
            const comment = {
                by: data.by,
                text: data.text,
                timestamp: new Date(),
                role: data.role
            };
            issue.comments.push(comment);
            io.emit('commentAdded', { issueId: data.issueId, comment });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        connectedUsers.officers = connectedUsers.officers.filter(u => u.id !== socket.id);
        connectedUsers.citizens = connectedUsers.citizens.filter(u => u.id !== socket.id);
        io.emit('usersUpdated', connectedUsers);
        console.log('User disconnected:', socket.id);
    });
});

// ==========================================
// SERVER STARTUP
// ==========================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`\n🏙️  SMART CITY SERVER STARTED\n`);
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ WebSocket connection ready`);
    console.log(`\n📊 API Endpoints:\n`);
    console.log(`   GET  /api/issues       - Get all issues`);
    console.log(`   POST /api/issues       - Create new issue`);
    console.log(`   PUT  /api/issues/:id   - Update issue`);
    console.log(`   GET  /api/stats        - Get statistics\n`);
    console.log(`🔗 Connect from:\n`);
    console.log(`   Officer Device : http://localhost:${PORT}/officer.html`);
    console.log(`   Citizen Device : http://localhost:${PORT}/citizen.html\n`);
});
