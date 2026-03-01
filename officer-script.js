/* ==========================================
   OFFICER DASHBOARD SCRIPT
   ========================================== */

let socket;
let allIssues = [];
let currentOfficer = null;
let currentIssueId = null;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeOfficerDashboard();
});

function initializeOfficerDashboard() {
    // Get or create officer
    const surname = prompt('Enter your name (Officer):') || 'Officer ' + Math.floor(Math.random() * 1000);
    
    currentOfficer = {
        name: surname,
        email: surname.toLowerCase().replace(/\s+/g, '') + '@police.city.gov',
        role: 'officer'
    };

    document.getElementById('officerName').textContent = currentOfficer.name;
    localStorage.setItem('currentUser', JSON.stringify(currentOfficer));

    // Connect to WebSocket
    connectToServer();
}

function connectToServer() {
    const serverUrl = window.location.origin;
    socket = io(serverUrl);

    socket.on('connect', () => {
        console.log('✅ Connected to server');
        console.log('Officer:', currentOfficer.name);

        // Register as officer
        socket.emit('registerUser', currentOfficer);
    });

    socket.on('issuesList', (issues) => {
        allIssues = issues;
        displayDashboard();
    });

    socket.on('issueCreated', (issue) => {
        allIssues.push(issue);
        showNotification(`📌 New Issue: ${issue.title}`, 'success');
        updateDashboard();
    });

    socket.on('issueUpdated', (issue) => {
        const index = allIssues.findIndex(i => i.id === issue.id);
        if (index !== -1) {
            allIssues[index] = issue;
        }
        updateDashboard();
    });

    socket.on('usersUpdated', (users) => {
        updateUsersList(users);
    });

    socket.on('newIssueNotification', (data) => {
        showNotification(data.message, 'alert');
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        showNotification('Connection lost. Reconnecting...', 'warning');
    });
}

// ==========================================
// DISPLAY FUNCTIONS
// ==========================================

function displayDashboard() {
    updateStats();
    displayRecentIssues();
}

function updateDashboard() {
    updateStats();
    displayRecentIssues();
    displayAllIssues();
    displayAssignedIssues();
}

function updateStats() {
    const stats = {
        total: allIssues.length,
        submitted: allIssues.filter(i => i.status === 'submitted').length,
        inProgress: allIssues.filter(i => i.status === 'in_progress').length,
        resolved: allIssues.filter(i => i.status === 'resolved').length
    };

    document.getElementById('totalIssues').textContent = stats.total;
    document.getElementById('submittedCount').textContent = stats.submitted;
    document.getElementById('inProgressCount').textContent = stats.inProgress;
    document.getElementById('resolvedCount').textContent = stats.resolved;
}

function displayRecentIssues() {
    const container = document.getElementById('recentIssuesList');
    const recent = allIssues.slice(-3).reverse();

    container.innerHTML = recent.map(issue => `
        <div class="issue-card recent">
            <div class="issue-header">
                <h4>${issue.title}</h4>
                <span class="status-badge status-${issue.status}">${formatStatus(issue.status)}</span>
            </div>
            <p class="issue-location">📍 ${issue.location}</p>
            <p class="issue-reporter">Reported by: ${issue.reportedBy}</p>
            <small>${new Date(issue.createdAt).toLocaleDateString()}</small>
            <button onclick="openIssueModal('${issue.id}')" class="btn btn-sm">Details</button>
        </div>
    `).join('');
}

function displayAllIssues() {
    const container = document.getElementById('issuesContainer');
    const issues = filterIssuesArray(allIssues);

    if (issues.length === 0) {
        container.innerHTML = '<p class="no-data">No issues found</p>';
        return;
    }

    container.innerHTML = issues.map(issue => `
        <div class="issue-card">
            <div class="issue-header">
                <h4>${issue.title}</h4>
                <span class="status-badge status-${issue.status}">${formatStatus(issue.status)}</span>
                <span class="priority-badge priority-${issue.priority}">${issue.priority.toUpperCase()}</span>
            </div>
            <p class="issue-category">📂 ${issue.category || 'Unknown'}</p>
            <p class="issue-location">📍 ${issue.location}</p>
            <p class="issue-reporter">Reported by: ${issue.reportedBy}</p>
            <p class="issue-description">${issue.description.substring(0, 100)}...</p>
            <div class="issue-footer">
                <small>${new Date(issue.createdAt).toLocaleDateString()}</small>
                <button onclick="openIssueModal('${issue.id}')" class="btn btn-sm btn-primary">Manage</button>
            </div>
        </div>
    `).join('');
}

function displayAssignedIssues() {
    const container = document.getElementById('assignedIssuesContainer');
    const assigned = allIssues.filter(i => i.assignedTo === currentOfficer.email);

    if (assigned.length === 0) {
        container.innerHTML = '<p class="no-data">No issues assigned to you</p>';
        return;
    }

    container.innerHTML = assigned.map(issue => `
        <div class="issue-card assigned">
            <div class="issue-header">
                <h4>${issue.title}</h4>
                <span class="status-badge status-${issue.status}">${formatStatus(issue.status)}</span>
            </div>
            <p class="issue-location">📍 ${issue.location}</p>
            <p class="issue-description">${issue.description.substring(0, 100)}...</p>
            <button onclick="openIssueModal('${issue.id}')" class="btn btn-primary">Update</button>
        </div>
    `).join('');
}

function updateUsersList(users) {
    const container = document.getElementById('usersList');
    
    let html = '<div class="users-section">';
    html += `<h4>👮 Officers (${users.officers.length})</h4>`;
    html += users.officers.map(u => `<div class="user-item">👮 ${u.name}</div>`).join('');
    html += '</div>';
    
    html += '<div class="users-section">';
    html += `<h4>👥 Citizens (${users.citizens.length})</h4>`;
    html += users.citizens.map(u => `<div class="user-item">👤 ${u.name}</div>`).join('');
    html += '</div>';

    container.innerHTML = html;
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================

function openIssueModal(issueId) {
    const issue = allIssues.find(i => i.id === issueId);
    if (!issue) return;

    currentIssueId = issueId;

    document.getElementById('modalTitle').textContent = `Issue #${issueId.substring(0, 6)}`;
    document.getElementById('modalIssueTitle').textContent = issue.title;
    document.getElementById('modalIssueDesc').textContent = issue.description;
    document.getElementById('modalIssueLocation').textContent = issue.location;
    document.getElementById('modalIssueReporter').textContent = issue.reportedBy;
    document.getElementById('modalIssueStatus').value = issue.status;
    document.getElementById('modalIssuePriority').value = issue.priority;

    displayComments(issue.comments);
    showModal();
}

function closeModal() {
    document.getElementById('issueModal').classList.add('hidden');
    currentIssueId = null;
}

function showModal() {
    document.getElementById('issueModal').classList.remove('hidden');
}

function displayComments(comments) {
    const container = document.getElementById('commentsList');
    
    if (comments.length === 0) {
        container.innerHTML = '<p class="no-data">No comments yet</p>';
        return;
    }

    container.innerHTML = comments.map(c => `
        <div class="comment">
            <div class="comment-header">
                <strong>${c.by}</strong>
                <small>${new Date(c.timestamp).toLocaleString()}</small>
            </div>
            <p>${c.text}</p>
        </div>
    `).join('');
}

function addComment() {
    const text = document.getElementById('modalComment').value.trim();
    if (!text) {
        showAlert('Please enter a comment');
        return;
    }

    socket.emit('addComment', {
        issueId: currentIssueId,
        by: currentOfficer.name,
        text: text,
        role: 'officer'
    });

    document.getElementById('modalComment').value = '';
    showAlert('Comment added');
}

function assignToMe() {
    const issue = allIssues.find(i => i.id === currentIssueId);
    if (!issue) return;

    socket.emit('updateIssue', {
        id: currentIssueId,
        assignedTo: currentOfficer.email,
        status: issue.status,
        priority: issue.priority,
        comment: `Assigned to ${currentOfficer.name}`
    });

    showAlert('Issue assigned to you');
}

function saveIssueChanges() {
    const issue = allIssues.find(i => i.id === currentIssueId);
    if (!issue) return;

    const newStatus = document.getElementById('modalIssueStatus').value;
    const newPriority = document.getElementById('modalIssuePriority').value;

    socket.emit('updateIssue', {
        id: currentIssueId,
        status: newStatus,
        priority: newPriority,
        assignedTo: issue.assignedTo || currentOfficer.email
    });

    showAlert('Issue updated');
    closeModal();
}

// ==========================================
// TAB FUNCTIONS
// ==========================================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const tabId = {
        'dashboard': 'dashboardTab',
        'issues': 'issuesTab',
        'assigned': 'assignedTab',
        'statistics': 'statisticsTab'
    }[tabName];

    if (document.getElementById(tabId)) {
        document.getElementById(tabId).classList.add('active');
    }

    // Activate corresponding button
    event.target.classList.add('active');
}

// ==========================================
// FILTER FUNCTIONS
// ==========================================

function filterIssues() {
    const search = document.getElementById('searchIssue').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;

    let filtered = allIssues;

    if (status) {
        filtered = filtered.filter(i => i.status === status);
    }

    if (search) {
        filtered = filtered.filter(i => 
            i.title.toLowerCase().includes(search) ||
            i.description.toLowerCase().includes(search) ||
            i.location.toLowerCase().includes(search)
        );
    }

    const container = document.getElementById('issuesContainer');
    container.innerHTML = filtered.map(issue => `
        <div class="issue-card">
            <div class="issue-header">
                <h4>${issue.title}</h4>
                <span class="status-badge status-${issue.status}">${formatStatus(issue.status)}</span>
                <span class="priority-badge priority-${issue.priority}">${issue.priority.toUpperCase()}</span>
            </div>
            <p class="issue-category">📂 ${issue.category || 'Unknown'}</p>
            <p class="issue-location">📍 ${issue.location}</p>
            <p class="issue-reporter">Reported by: ${issue.reportedBy}</p>
            <p class="issue-description">${issue.description.substring(0, 100)}...</p>
            <div class="issue-footer">
                <small>${new Date(issue.createdAt).toLocaleDateString()}</small>
                <button onclick="openIssueModal('${issue.id}')" class="btn btn-sm btn-primary">Manage</button>
            </div>
        </div>
    `).join('');
}

function filterIssuesArray(issues) {
    const search = document.getElementById('searchIssue')?.value.toLowerCase() || '';
    const status = document.getElementById('filterStatus')?.value || '';

    let filtered = issues;

    if (status) {
        filtered = filtered.filter(i => i.status === status);
    }

    if (search) {
        filtered = filtered.filter(i => 
            i.title.toLowerCase().includes(search) ||
            i.description.toLowerCase().includes(search)
        );
    }

    return filtered;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatStatus(status) {
    const statusMap = {
        'submitted': 'Submitted',
        'in_progress': 'In Progress',
        'resolved': 'Resolved',
        'closed': 'Closed'
    };
    return statusMap[status] || status;
}

function showAlert(message) {
    const alertEl = document.getElementById('successAlert');
    const msgEl = document.getElementById('alertMessage');
    msgEl.textContent = message;
    alertEl.classList.remove('hidden');
    setTimeout(() => {
        alertEl.classList.add('hidden');
    }, 3000);
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    showAlert(message);
}

function logout() {
    localStorage.removeItem('currentUser');
    socket.disconnect();
    window.location.href = 'index.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('issueModal');
    if (event.target === modal) {
        closeModal();
    }
}
