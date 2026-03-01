/* ==========================================
   CITIZEN PORTAL SCRIPT
   ========================================== */

let socket;
let myIssues = [];
let allIssues = [];
let currentCitizen = null;
let currentIssueId = null;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCitizenPortal();
    setupFormListeners();
});

function initializeCitizenPortal() {
    // Get or create citizen
    const name = prompt('Enter your name (Citizen):') || 'Citizen ' + Math.floor(Math.random() * 1000);
    
    currentCitizen = {
        name: name,
        email: name.toLowerCase().replace(/\s+/g, '') + '@citizen.city.gov',
        role: 'citizen'
    };

    document.getElementById('citizenName').textContent = currentCitizen.name;
    localStorage.setItem('currentUser', JSON.stringify(currentCitizen));

    // Connect to WebSocket
    connectToServer();
}

function connectToServer() {
    const serverUrl = window.location.origin;
    socket = io(serverUrl);

    socket.on('connect', () => {
        console.log('✅ Connected to server');
        console.log('Citizen:', currentCitizen.name);

        // Register as citizen
        socket.emit('registerUser', currentCitizen);
    });

    socket.on('issuesList', (issues) => {
        allIssues = issues;
        myIssues = issues.filter(i => i.reportedBy === currentCitizen.name);
        displayMyIssues();
    });

    socket.on('issueCreated', (issue) => {
        allIssues.push(issue);
        if (issue.reportedBy === currentCitizen.name) {
            myIssues.push(issue);
            showNotification('✅ Issue submitted successfully!', 'success');
            showNotificationToast('Your issue has been registered!');
        }
        updateAllTabs();
    });

    socket.on('issueUpdated', (issue) => {
        const index = allIssues.findIndex(i => i.id === issue.id);
        if (index !== -1) {
            allIssues[index] = issue;
        }

        const myIndex = myIssues.findIndex(i => i.id === issue.id);
        if (myIndex !== -1) {
            myIssues[myIndex] = issue;
            showNotificationToast(`📢 Update: Issue status changed to ${formatStatus(issue.status)}`);
        }

        updateAllTabs();
    });

    socket.on('issueStatusChanged', (data) => {
        const issue = myIssues.find(i => i.id === data.issueId);
        if (issue) {
            showNotificationToast(`🔔 ${data.message}`);
        }
    });

    socket.on('commentAdded', (data) => {
        const issue = myIssues.find(i => i.id === data.issueId);
        if (issue && data.comment.role === 'officer') {
            showNotificationToast(`💬 Officer comment: "${data.comment.text.substring(0, 50)}..."`);
        }
    });

    socket.on('usersUpdated', (users) => {
        console.log('Connected officers:', users.officers.length);
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        showNotification('Connection lost. Reconnecting...', 'warning');
    });
}

// ==========================================
// FORM HANDLING
// ==========================================

function setupFormListeners() {
    const form = document.getElementById('issueForm');
    if (form) {
        form.addEventListener('submit', submitIssue);
    }
}

function submitIssue(e) {
    e.preventDefault();

    const title = document.getElementById('issueTitle').value.trim();
    const category = document.getElementById('issueCategory').value;
    const location = document.getElementById('issueLocation').value.trim();
    const description = document.getElementById('issueDescription').value.trim();
    const priority = document.getElementById('issuePriority').value;

    if (!title || !category || !location || !description) {
        showAlert('Please fill in all required fields');
        return;
    }

    const newIssue = {
        title,
        category,
        location,
        description,
        priority,
        reportedBy: currentCitizen.name,
        createdAt: new Date()
    };

    socket.emit('createIssue', newIssue);

    // Reset form
    document.getElementById('issueForm').reset();
    showAlert('Issue submitted successfully! Officers will review it shortly.');
}

// ==========================================
// DISPLAY FUNCTIONS
// ==========================================

function displayMyIssues() {
    const container = document.getElementById('myIssuesContainer');

    if (myIssues.length === 0) {
        container.innerHTML = '<p class="no-data">You haven\'t reported any issues yet</p>';
        return;
    }

    const filtered = filterMyIssuesArray(myIssues);

    container.innerHTML = filtered.map(issue => `
        <div class="issue-card my-issue">
            <div class="issue-header">
                <h4>${issue.title}</h4>
                <span class="status-badge status-${issue.status}">${formatStatus(issue.status)}</span>
            </div>
            <p class="issue-category">📂 ${issue.category || 'Unknown'}</p>
            <p class="issue-location">📍 ${issue.location}</p>
            <p class="issue-description">${issue.description.substring(0, 100)}...</p>
            <div class="issue-footer">
                <small>${new Date(issue.createdAt).toLocaleDateString()}</small>
                <button onclick="openIssueModal('${issue.id}')" class="btn btn-sm btn-primary">View</button>
            </div>
        </div>
    `).join('');
}

function displayStatusTracker() {
    const container = document.getElementById('statusTrackerContainer');

    if (myIssues.length === 0) {
        container.innerHTML = '<p class="no-data">No issues to track</p>';
        return;
    }

    container.innerHTML = myIssues.map(issue => `
        <div class="status-tracker-item">
            <div class="tracker-header">
                <h4>${issue.title}</h4>
                <span class="status-badge status-${issue.status}">${formatStatus(issue.status)}</span>
            </div>
            <div class="tracker-timeline">
                <div class="timeline-step ${issue.status !== 'submitted' ? 'completed' : 'active'}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-label">Submitted</div>
                </div>
                <div class="timeline-step ${issue.status === 'in_progress' || issue.status === 'resolved' || issue.status === 'closed' ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-label">In Progress</div>
                </div>
                <div class="timeline-step ${issue.status === 'resolved' || issue.status === 'closed' ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-label">Resolved</div>
                </div>
                <div class="timeline-step ${issue.status === 'closed' ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-label">Closed</div>
                </div>
            </div>
            <p class="tracker-location">📍 ${issue.location}</p>
            ${issue.assignedTo ? `<p class="tracker-assigned">Assigned to: ${issue.assignedTo}</p>` : ''}
            <button onclick="openIssueModal('${issue.id}')" class="btn btn-sm">Details</button>
        </div>
    `).join('');
}

function updateAllTabs() {
    displayMyIssues();
    displayStatusTracker();
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================

function openIssueModal(issueId) {
    const issue = myIssues.find(i => i.id === issueId);
    if (!issue) return;

    currentIssueId = issueId;

    document.getElementById('modalTitle').textContent = `Issue #${issueId.substring(0, 6)}`;
    document.getElementById('modalIssueId').textContent = issueId;
    document.getElementById('modalIssueTitle').textContent = issue.title;
    document.getElementById('modalIssueDesc').textContent = issue.description;
    document.getElementById('modalIssueLocation').textContent = issue.location;
    document.getElementById('modalIssueStatus').textContent = formatStatus(issue.status);
    document.getElementById('modalIssuePriority').textContent = issue.priority.toUpperCase();
    document.getElementById('modalAssignedOfficer').textContent = issue.assignedTo || 'Not assigned yet';
    document.getElementById('modalCreatedDate').textContent = new Date(issue.createdAt).toLocaleString();

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
                <strong>${c.by}</strong> <span class="role-badge">${c.role}</span>
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
        by: currentCitizen.name,
        text: text,
        role: 'citizen'
    });

    document.getElementById('modalComment').value = '';
    showAlert('Comment added');
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
        'report': 'reportTab',
        'myIssues': 'myIssuesTab',
        'status': 'statusTab'
    }[tabName];

    if (document.getElementById(tabId)) {
        document.getElementById(tabId).classList.add('active');
        
        // Update content when tab is switched
        if (tabName === 'myIssues') {
            displayMyIssues();
        } else if (tabName === 'status') {
            displayStatusTracker();
        }
    }

    // Activate corresponding button
    event.target.classList.add('active');
}

// ==========================================
// FILTER FUNCTIONS
// ==========================================

function filterMyIssues() {
    displayMyIssues();
}

function filterMyIssuesArray(issues) {
    const search = document.getElementById('mySearchIssue')?.value.toLowerCase() || '';
    const status = document.getElementById('myFilterStatus')?.value || '';

    let filtered = issues;

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

    return filtered;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatStatus(status) {
    const statusMap = {
        'submitted': '📝 Submitted',
        'in_progress': '⚙️ In Progress',
        'resolved': '✅ Resolved',
        'closed': '🔒 Closed'
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
}

function showNotificationToast(message) {
    const toast = document.getElementById('notificationToast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
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
