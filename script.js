/* ==========================================
   SMART CITY ISSUE REPORTING SYSTEM - JAVASCRIPT
   ========================================== */

// ==========================================
// SERVICE WORKER REGISTRATION
// ==========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker registered');
                showBackgroundProcessStatus('Service Worker Active');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// ==========================================
// GLOBAL UTILITY FUNCTIONS
// ==========================================

function initializeLocalStorage() {
    if (!localStorage.getItem('allIssues')) {
        localStorage.setItem('allIssues', JSON.stringify([]));
    }
    if (!localStorage.getItem('darkMode')) {
        localStorage.setItem('darkMode', false);
    }
}

function applyDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}

function generateID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getLoggedInUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function getUserRole(email) {
    return email === 'admin@city.com' ? 'admin' : 'citizen';
}

function showAlert(message) {
    const alertEl = document.getElementById('successAlert');
    if (alertEl) {
        const msgEl = document.getElementById('alertMessage');
        if (msgEl) msgEl.textContent = message;
        alertEl.classList.remove('hidden');
        setTimeout(() => {
            alertEl.classList.add('hidden');
        }, 4000);
    }
}

function showBackgroundProcessStatus(message) {
    const statusEl = document.getElementById('backgroundStatus');
    const statusText = document.getElementById('statusText');
    if (statusEl && statusText) {
        statusText.textContent = message;
        statusEl.style.display = 'block';
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getAllIssues() {
    const issues = localStorage.getItem('allIssues');
    return issues ? JSON.parse(issues) : [];
}

function saveIssues(issues) {
    localStorage.setItem('allIssues', JSON.stringify(issues));
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function enableAutoSave() {
    const formElement = document.getElementById('issueForm');
    if (!formElement) return;

    setInterval(() => {
        const title = document.getElementById('issueTitle');
        const description = document.getElementById('issueDescription');
        const category = document.getElementById('issueCategory');
        const location = document.getElementById('issueLocation');

        if (title && description) {
            const formData = {
                title: title.value || '',
                description: description.value || '',
                category: category ? category.value : '',
                location: location ? location.value : ''
            };

            if (formData.title || formData.description) {
                localStorage.setItem('formAutoSave', JSON.stringify(formData));
            }
        }
    }, 30000);
}

function restoreAutoSavedData() {
    const saved = localStorage.getItem('formAutoSave');
    if (saved) {
        const formData = JSON.parse(saved);
        const title = document.getElementById('issueTitle');
        const description = document.getElementById('issueDescription');
        const category = document.getElementById('issueCategory');
        const location = document.getElementById('issueLocation');

        if (title) title.value = formData.title || '';
        if (description) description.value = formData.description || '';
        if (category) category.value = formData.category || '';
        if (location) location.value = formData.location || '';
    }
}

function clearAutoSavedData() {
    localStorage.removeItem('formAutoSave');
}

// ==========================================
// LOGIN PAGE FUNCTIONALITY
// ==========================================

if (document.getElementById('loginForm')) {
    initializeLocalStorage();
    applyDarkMode();

    let selectedRole = null;

    window.selectRole = function(role) {
        selectedRole = role;
        const roleSelection = document.getElementById('roleSelection');
        const loginSection = document.getElementById('loginSection');
        const roleText = document.getElementById('roleText');
        const demoEmail = document.getElementById('demoEmail');

        if (roleSelection) roleSelection.classList.add('hidden');
        if (loginSection) loginSection.classList.add('active');
        if (roleText) roleText.textContent = role === 'citizen' ? 'Citizen Login' : 'Officer Login';
        if (demoEmail) {
            demoEmail.innerHTML = role === 'citizen' 
                ? '<strong>Email:</strong> citizen@city.com' 
                : '<strong>Email:</strong> admin@city.com';
        }

        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.focus();
    };

    window.backToRoleSelection = function() {
        selectedRole = null;
        const roleSelection = document.getElementById('roleSelection');
        const loginSection = document.getElementById('loginSection');
        const form = document.getElementById('loginForm');

        if (loginSection) loginSection.classList.remove('active');
        if (roleSelection) roleSelection.classList.remove('hidden');
        if (form) form.reset();
    };

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        let isValid = false;
        if (selectedRole === 'citizen' && email === 'citizen@city.com') {
            isValid = true;
        } else if (selectedRole === 'officer' && email === 'admin@city.com') {
            isValid = true;
        } else {
            const expectedEmail = selectedRole === 'citizen' ? 'citizen@city.com' : 'admin@city.com';
            alert('Please use email: ' + expectedEmail);
            return;
        }

        const user = {
            email: email,
            role: getUserRole(email),
            selectedRole: selectedRole
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
    });
}

// ==========================================
// ISSUE DETAIL MODAL - GLOBAL FUNCTIONS
// ==========================================

window.viewIssueDetail = function(issueId) {
    const issues = getAllIssues();
    const issue = issues.find(i => i.id === issueId);
    
    if (!issue) {
        alert('Issue not found');
        return;
    }

    // Populate the modal with issue details
    const titleEl = document.getElementById('detailIssueTitle');
    const descEl = document.getElementById('detailIssueDescription');
    const categoryEl = document.getElementById('detailIssueCategory');
    const locationEl = document.getElementById('detailIssueLocation');
    const statusEl = document.getElementById('detailIssueStatus');
    const creatorEl = document.getElementById('detailIssueCreator');
    const dateEl = document.getElementById('detailIssueDate');
    const photosSection = document.getElementById('detailPhotosSection');
    const photoGrid = document.getElementById('detailPhotoGrid');

    if (titleEl) titleEl.textContent = escapeHtml(issue.title);
    if (descEl) descEl.textContent = escapeHtml(issue.description);
    if (categoryEl) categoryEl.textContent = escapeHtml(issue.category);
    if (locationEl) locationEl.textContent = escapeHtml(issue.location);
    if (statusEl) {
        statusEl.innerHTML = `<span class="status-badge status-${issue.status.toLowerCase().replace(/\s+/g, '')}">${issue.status}</span>`;
    }
    if (creatorEl) creatorEl.textContent = escapeHtml(issue.createdBy);
    if (dateEl) dateEl.textContent = formatDate(issue.createdAt);

    // Handle photos
    if (issue.photos && issue.photos.length > 0) {
        if (photosSection) photosSection.style.display = 'block';
        if (photoGrid) {
            photoGrid.innerHTML = issue.photos.map((photo, index) => `
                <img src="${photo.data}" alt="Photo ${index + 1}" onclick="viewPhoto('${btoa(photo.data)}')">
            `).join('');
        }
    } else {
        if (photosSection) photosSection.style.display = 'none';
    }

    // Show the modal
    const modal = document.getElementById('issueDetailModal');
    if (modal) {
        modal.classList.add('show');
    }
};

window.closeIssueDetail = function() {
    const modal = document.getElementById('issueDetailModal');
    if (modal) {
        modal.classList.remove('show');
    }
};

document.addEventListener('click', function(e) {
    const issueDetailModal = document.getElementById('issueDetailModal');
    if (issueDetailModal && e.target === issueDetailModal) {
        issueDetailModal.classList.remove('show');
    }
});

// ==========================================
// CITIZEN DASHBOARD FUNCTIONALITY
// ==========================================

if (document.getElementById('issueForm')) {
    initializeLocalStorage();
    applyDarkMode();

    const currentUser = getLoggedInUser();
    if (!currentUser) {
        window.location.href = 'index.html';
    }

    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = currentUser.email;

    enableAutoSave();
    restoreAutoSavedData();

    let uploadedPhotos = [];
    let map = null;
    let selectedMarker = null;
    let selectedLocation = null;

    // ==========================================
    // MAP FUNCTIONALITY
    // ==========================================

    function initializeMap() {
        if (map) return;

        const mapElement = document.getElementById('issueMap');
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }

        map = L.map('issueMap').setView([20.5937, 78.9629], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            selectLocationOnMap(lat, lng);
        });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const { latitude, longitude } = position.coords;
                    map.setView([latitude, longitude], 13);
                },
                function(error) {
                    console.log('Geolocation not available');
                }
            );
        }
    }

    function selectLocationOnMap(lat, lng) {
        if (selectedMarker) {
            map.removeLayer(selectedMarker);
        }

        selectedMarker = L.marker([lat, lng], { draggable: true }).addTo(map);

        const coordsEl = document.getElementById('mapCoordinates');
        if (coordsEl) {
            coordsEl.textContent = `📍 Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
        }

        selectedLocation = {
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
        };

        map.panTo([lat, lng]);
        getAddressFromCoordinates(lat, lng);
    }

    function getAddressFromCoordinates(lat, lng) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.address) {
                    const city = data.address.city || data.address.town || '';
                    const road = data.address.road || '';
                    const address = [road, city].filter(Boolean).join(', ') || data.display_name;
                    selectedLocation.address = address;
                    const coordsEl = document.getElementById('mapCoordinates');
                    if (coordsEl) {
                        coordsEl.textContent = `📍 ${address}`;
                    }
                }
            })
            .catch(error => console.log('Geocoding error'));
    }

    const mapBtn = document.getElementById('openMapBtn');
    const mapModal = document.getElementById('mapModal');
    const confirmLocBtn = document.getElementById('confirmLocation');
    const cancelLocBtn = document.getElementById('cancelLocation');
    const closeMapBtn = document.getElementById('closeMapBtn');
    const issueLocInput = document.getElementById('issueLocation');

    if (mapBtn && mapModal) {
        mapBtn.addEventListener('click', function() {
            mapModal.classList.add('show');
            setTimeout(initializeMap, 100);
        });
    }

    if (confirmLocBtn && issueLocInput) {
        confirmLocBtn.addEventListener('click', function() {
            if (selectedLocation) {
                issueLocInput.value = selectedLocation.address;
                mapModal.classList.remove('show');
            } else {
                alert('Please select a location on the map');
            }
        });
    }

    if (cancelLocBtn) {
        cancelLocBtn.addEventListener('click', function() {
            mapModal.classList.remove('show');
        });
    }

    if (closeMapBtn) {
        closeMapBtn.addEventListener('click', function() {
            mapModal.classList.remove('show');
        });
    }

    // ==========================================
    // CATEGORY FUNCTIONALITY
    // ==========================================

    const categorySelect = document.getElementById('issueCategory');
    const customInput = document.getElementById('customCategory');

    if (categorySelect && customInput) {
        categorySelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customInput.classList.remove('hidden');
                customInput.focus();
                categorySelect.required = false;
            } else {
                customInput.classList.add('hidden');
                categorySelect.required = true;
            }
        });
    }

    function getSelectedCategory() {
        const categoryValue = categorySelect ? categorySelect.value : '';
        
        if (categoryValue === 'custom') {
            const customValue = customInput ? customInput.value.trim() : '';
            if (!customValue) {
                alert('Please enter a custom category name');
                return null;
            }
            return customValue;
        }
        
        return categoryValue;
    }

    // ==========================================
    // PHOTO UPLOAD FUNCTIONALITY
    // ==========================================

    const photoInput = document.getElementById('issuePhoto');
    const photoLabel = document.querySelector('.photo-upload-label');
    const photoPreviewContainer = document.getElementById('photoPreview');

    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                handlePhotoFiles(files);
            }
        });
    }

    if (photoLabel) {
        photoLabel.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            photoLabel.classList.add('drag-over');
        });

        photoLabel.addEventListener('dragleave', function() {
            photoLabel.classList.remove('drag-over');
        });

        photoLabel.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            photoLabel.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length === 0) {
                alert('Please drop image files only');
                return;
            }

            handlePhotoFiles(imageFiles);
        });
    }

    function handlePhotoFiles(files) {
        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                alert(`"${file.name}" is not an image file`);
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert(`Photo "${file.name}" is too large. Max 5MB.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const photoData = {
                    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    data: e.target.result
                };

                uploadedPhotos.push(photoData);
                displayPhotoPreview();
            };
            reader.onerror = function() {
                alert(`Error reading file: ${file.name}`);
            };
            reader.readAsDataURL(file);
        });
        
        if (files.length > 0) {
            showAlert('📸 ' + files.length + ' photo(s) added!');
        }
    }

    function displayPhotoPreview() {
        if (!photoPreviewContainer) return;
        
        photoPreviewContainer.innerHTML = '';
        
        if (uploadedPhotos.length === 0) {
            return;
        }

        uploadedPhotos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-preview-item';
            
            const img = document.createElement('img');
            img.src = photo.data;
            img.alt = 'Photo preview';
            img.style.cssText = 'width:100%; height:100px; object-fit:cover;';
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-photo';
            removeBtn.textContent = '✕';
            removeBtn.onclick = function() {
                removePhoto(photo.id);
            };
            
            photoItem.appendChild(img);
            photoItem.appendChild(removeBtn);
            photoPreviewContainer.appendChild(photoItem);
        });

        let photoCount = document.querySelector('.photo-count');
        if (photoCount) {
            photoCount.remove();
        }
        
        const countDiv = document.createElement('div');
        countDiv.className = 'photo-count';
        countDiv.textContent = '📸 ' + uploadedPhotos.length + ' photo(s) selected';
        photoPreviewContainer.parentNode.insertBefore(countDiv, photoPreviewContainer.nextSibling);
    }

    window.removePhoto = function(photoId) {
        uploadedPhotos = uploadedPhotos.filter(p => p.id !== photoId);
        displayPhotoPreview();
        showAlert('📸 Photo removed');
    };

    function clearPhotos() {
        uploadedPhotos = [];
        if (photoPreviewContainer) {
            photoPreviewContainer.innerHTML = '';
        }
        const photoCount = document.querySelector('.photo-count');
        if (photoCount) {
            photoCount.remove();
        }
        if (photoInput) {
            photoInput.value = '';
        }
    }

    // ==========================================
    // FORM SUBMISSION
    // ==========================================

    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
        issueForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const selectedCategory = getSelectedCategory();
            if (!selectedCategory) return;

            const title = document.getElementById('issueTitle');
            const description = document.getElementById('issueDescription');
            const location = document.getElementById('issueLocation');

            if (!title || !description || !location || !title.value || !description.value || !location.value) {
                alert('Please fill in all required fields');
                return;
            }

            const newIssue = {
                id: generateID(),
                title: title.value,
                description: description.value,
                category: selectedCategory,
                location: location.value,
                status: 'Submitted',
                createdAt: new Date().toISOString(),
                createdBy: currentUser.email,
                photos: uploadedPhotos
            };

            const issues = getAllIssues();
            issues.push(newIssue);
            saveIssues(issues);

            issueForm.reset();
            if (customInput) customInput.classList.add('hidden');
            clearAutoSavedData();
            clearPhotos();

            showAlert('✅ Issue submitted with ' + uploadedPhotos.length + ' photo(s)!');
            displayMyIssues();
        });
    }

    // ==========================================
    // DISPLAY USER ISSUES
    // ==========================================

    function displayMyIssues() {
        const issues = getAllIssues();
        const userIssues = issues.filter(issue => issue.createdBy === currentUser.email);
        const issuesList = document.getElementById('myIssuesList');

        if (!issuesList) return;

        if (userIssues.length === 0) {
            issuesList.innerHTML = '<p class="empty-state">No issues reported yet</p>';
            return;
        }

        issuesList.innerHTML = userIssues.map(issue => {
            let photoHTML = '';
            if (issue.photos && issue.photos.length > 0) {
                photoHTML = `
                    <div class="issue-photos">
                        <p style="font-size: 12px; color: var(--text-light); margin-bottom: 10px;">
                            📸 ${issue.photos.length} photo(s)
                        </p>
                        <div class="issue-photos-grid">
                            ${issue.photos.map((photo, index) => `
                                <div class="issue-photo-item" onclick="viewPhoto('${btoa(photo.data)}')">
                                    <img src="${photo.data}" alt="Photo" style="cursor: pointer;">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="issue-card">
                    <div class="issue-card-header">
                        <span class="issue-card-title">${escapeHtml(issue.title)}</span>
                        <span class="issue-card-status status-${issue.status.toLowerCase().replace(/\s+/g, '')}">
                            ${issue.status}
                        </span>
                    </div>
                    <div class="issue-card-meta">
                        <strong>Category:</strong> ${escapeHtml(issue.category)} | 
                        <strong>Location:</strong> ${escapeHtml(issue.location)}
                    </div>
                    <div class="issue-card-meta">
                        <strong>Created:</strong> ${formatDate(issue.createdAt)}
                    </div>
                    <div class="issue-card-description">
                        ${escapeHtml(issue.description)}
                    </div>
                    ${photoHTML}
                    <div class="issue-card-actions">
                        <button class="btn-primary" onclick="viewIssueDetail('${issue.id}')">View Details</button>
                        <button class="btn-delete" onclick="deleteIssue('${issue.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==========================================
    // PHOTO VIEWING
    // ==========================================

    window.viewPhoto = function(encodedData) {
        try {
            const photoData = atob(encodedData);
            
            let modal = document.getElementById('photoModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'photoModal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content photo-modal-content">
                        <button class="close-btn" onclick="closePhotoModal()">&times;</button>
                        <img id="fullPhoto" src="" alt="Full view" style="max-width: 100%; max-height: 80vh; border-radius: 8px;">
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            document.getElementById('fullPhoto').src = photoData;
            modal.classList.add('show');
        } catch (error) {
            console.error('Error viewing photo:', error);
        }
    };

    window.closePhotoModal = function() {
        const photoModal = document.getElementById('photoModal');
        if (photoModal) {
            photoModal.classList.remove('show');
        }
    };

    // ==========================================
    // DELETE ISSUE
    // ==========================================

    window.deleteIssue = function(issueId) {
        const confirmModal = document.getElementById('confirmModal');
        if (!confirmModal) return;

        confirmModal.classList.add('show');

        const confirmDelete = document.getElementById('confirmDelete');
        const cancelDelete = document.getElementById('cancelDelete');

        const onConfirm = () => {
            const issues = getAllIssues();
            const filteredIssues = issues.filter(issue => issue.id !== issueId);
            saveIssues(filteredIssues);
            confirmModal.classList.remove('show');
            showAlert('Issue deleted!');
            displayMyIssues();
            confirmDelete.removeEventListener('click', onConfirm);
            cancelDelete.removeEventListener('click', onCancel);
        };

        const onCancel = () => {
            confirmModal.classList.remove('show');
            confirmDelete.removeEventListener('click', onConfirm);
            cancelDelete.removeEventListener('click', onCancel);
        };

        confirmDelete.addEventListener('click', onConfirm);
        cancelDelete.addEventListener('click', onCancel);
    };

    // Dark mode toggle
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Alert close
    const alertClose = document.querySelector('.alert-close');
    if (alertClose) {
        alertClose.addEventListener('click', function() {
            const alert = document.getElementById('successAlert');
            if (alert) alert.classList.add('hidden');
        });
    }

    displayMyIssues();
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

if (document.getElementById('issuesTable')) {
    initializeLocalStorage();
    applyDarkMode();

    const currentUser = getLoggedInUser();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
    }

    let selectedIssueId = null;

    function updateCategoryFilter() {
        const issues = getAllIssues();
        const categories = new Set();
        
        ['Infrastructure', 'Electricity', 'Water Supply', 'Garbage', 'Traffic'].forEach(cat => {
            categories.add(cat);
        });
        
        issues.forEach(issue => {
            if (issue.category) {
                categories.add(issue.category);
            }
        });

        const filterSelect = document.getElementById('filterCategory');
        if (!filterSelect) return;

        const currentValue = filterSelect.value;
        filterSelect.innerHTML = '<option value="">All Categories</option>';

        Array.from(categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterSelect.appendChild(option);
        });

        filterSelect.value = currentValue;
    }

    function displayAllIssues(category = '', status = '') {
        const issues = getAllIssues();
        const filtered = issues.filter(issue => {
            const categoryMatch = !category || issue.category === category;
            const statusMatch = !status || issue.status === status;
            return categoryMatch && statusMatch;
        });

        const tbody = document.getElementById('issuesTableBody');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">No issues found</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(issue => `
            <tr>
                <td>${escapeHtml(issue.id)}</td>
                <td>${escapeHtml(issue.title)}</td>
                <td>${escapeHtml(issue.description.substring(0, 50))}...</td>
                <td>${escapeHtml(issue.category)}</td>
                <td>${escapeHtml(issue.location)}</td>
                <td><span class="status-badge status-${issue.status.toLowerCase().replace(/\s+/g, '')}">${issue.status}</span></td>
                <td>${escapeHtml(issue.createdBy)}</td>
                <td>${formatDate(issue.createdAt)}</td>
                <td>
                    ${issue.photos && issue.photos.length > 0 ? `
                        <span class="photo-badge" onclick="openPhotoGallery('${btoa(JSON.stringify(issue.photos))}')">
                            ${issue.photos.length} 📸
                        </span>
                    ` : '<span style="color: var(--text-light);">-</span>'}
                </td>
                <td>
                    <button class="btn-secondary" onclick="viewIssueDetail('${issue.id}')" style="margin-bottom: 5px; width: 100%;">View</button>
                    <button class="btn-update" onclick="openStatusModal('${issue.id}')" style="margin-bottom: 5px; width: 100%;">Update</button>
                    <button class="btn-delete" onclick="deleteIssueAdmin('${issue.id}')" style="width: 100%;">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function updateStats() {
        const issues = getAllIssues();
        const stats = {
            total: issues.length,
            submitted: issues.filter(i => i.status === 'Submitted').length,
            review: issues.filter(i => i.status === 'In Review').length,
            progress: issues.filter(i => i.status === 'In Progress').length,
            resolved: issues.filter(i => i.status === 'Resolved').length
        };

        const el = (id) => document.getElementById(id);
        if (el('totalIssues')) el('totalIssues').textContent = stats.total;
        if (el('submittedCount')) el('submittedCount').textContent = stats.submitted;
        if (el('inReviewCount')) el('inReviewCount').textContent = stats.review;
        if (el('inProgressCount')) el('inProgressCount').textContent = stats.progress;
        if (el('resolvedCount')) el('resolvedCount').textContent = stats.resolved;
    }

    const filterCat = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    const resetBtn = document.getElementById('resetFilters');

    if (filterCat) {
        filterCat.addEventListener('change', function() {
            displayAllIssues(this.value, filterStatus ? filterStatus.value : '');
        });
    }

    if (filterStatus) {
        filterStatus.addEventListener('change', function() {
            displayAllIssues(filterCat ? filterCat.value : '', this.value);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (filterCat) filterCat.value = '';
            if (filterStatus) filterStatus.value = '';
            displayAllIssues();
        });
    }

    window.openStatusModal = function(issueId) {
        selectedIssueId = issueId;
        const modal = document.getElementById('statusModal');
        if (modal) modal.classList.add('show');
    };

    const confirmStatusBtn = document.getElementById('confirmStatus');
    const cancelStatusBtn = document.getElementById('cancelStatus');
    const statusSelect = document.getElementById('statusSelect');

    if (confirmStatusBtn) {
        confirmStatusBtn.addEventListener('click', function() {
            const newStatus = statusSelect ? statusSelect.value : '';
            if (!newStatus) return;

            const issues = getAllIssues();
            const issueIndex = issues.findIndex(i => i.id === selectedIssueId);

            if (issueIndex !== -1) {
                issues[issueIndex].status = newStatus;
                saveIssues(issues);
                showAlert('Status updated!');
                const modal = document.getElementById('statusModal');
                if (modal) modal.classList.remove('show');
                updateCategoryFilter();
                displayAllIssues();
                updateStats();
            }
        });
    }

    if (cancelStatusBtn) {
        cancelStatusBtn.addEventListener('click', function() {
            const modal = document.getElementById('statusModal');
            if (modal) modal.classList.remove('show');
        });
    }

    window.deleteIssueAdmin = function(issueId) {
        const confirmModal = document.getElementById('confirmModal');
        if (!confirmModal) return;

        confirmModal.classList.add('show');

        const confirmDelete = document.getElementById('confirmDelete');
        const cancelDelete = document.getElementById('cancelDelete');

        const onConfirm = () => {
            const issues = getAllIssues();
            const filteredIssues = issues.filter(issue => issue.id !== issueId);
            saveIssues(filteredIssues);
            confirmModal.classList.remove('show');
            showAlert('Issue deleted!');
            displayAllIssues();
            updateCategoryFilter();
            updateStats();
            confirmDelete.removeEventListener('click', onConfirm);
            cancelDelete.removeEventListener('click', onCancel);
        };

        const onCancel = () => {
            confirmModal.classList.remove('show');
            confirmDelete.removeEventListener('click', onConfirm);
            cancelDelete.removeEventListener('click', onCancel);
        };

        confirmDelete.addEventListener('click', onConfirm);
        cancelDelete.addEventListener('click', onCancel);
    };

    window.openPhotoGallery = function(encodedPhotos) {
        try {
            const photos = JSON.parse(atob(encodedPhotos));
            if (!photos || photos.length === 0) return;
            
            let modal = document.getElementById('photoGalleryModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'photoGalleryModal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content photo-gallery-modal">
                        <button class="close-btn" onclick="closePhotoGallery()">&times;</button>
                        <div class="photo-gallery-container">
                            <div class="gallery-nav">
                                <button class="gallery-prev" onclick="prevPhoto()">← Prev</button>
                                <span class="gallery-counter">
                                    <span id="currentPhotoNum">1</span> / <span id="totalPhotosNum">0</span>
                                </span>
                                <button class="gallery-next" onclick="nextPhoto()">Next →</button>
                            </div>
                            <img id="galleryPhoto" src="" alt="Photo" style="max-width: 100%; max-height: 65vh; border-radius: 8px; margin-top: 15px;">
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            window.currentPhotos = photos;
            window.currentPhotoIndex = 0;
            displayGalleryPhoto();
            modal.classList.add('show');
        } catch (error) {
            console.error('Error opening gallery:', error);
            alert('Could not open photos');
        }
    };

    window.displayGalleryPhoto = function() {
        if (!window.currentPhotos || window.currentPhotos.length === 0) return;
        
        const photo = window.currentPhotos[window.currentPhotoIndex];
        const galleryImg = document.getElementById('galleryPhoto');
        const currentNum = document.getElementById('currentPhotoNum');
        const totalNum = document.getElementById('totalPhotosNum');

        if (galleryImg) galleryImg.src = photo.data;
        if (currentNum) currentNum.textContent = window.currentPhotoIndex + 1;
        if (totalNum) totalNum.textContent = window.currentPhotos.length;
    };

    window.nextPhoto = function() {
        if (!window.currentPhotos) return;
        window.currentPhotoIndex = (window.currentPhotoIndex + 1) % window.currentPhotos.length;
        displayGalleryPhoto();
    };

    window.prevPhoto = function() {
        if (!window.currentPhotos) return;
        window.currentPhotoIndex = (window.currentPhotoIndex - 1 + window.currentPhotos.length) % window.currentPhotos.length;
        displayGalleryPhoto();
    };

    window.closePhotoGallery = function() {
        const modal = document.getElementById('photoGalleryModal');
        if (modal) {
            modal.classList.remove('show');
        }
    };

    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const alertClose = document.querySelector('.alert-close');
    if (alertClose) {
        alertClose.addEventListener('click', function() {
            const alert = document.getElementById('successAlert');
            if (alert) alert.classList.add('hidden');
        });
    }

    updateCategoryFilter();
    displayAllIssues();
    updateStats();
}

console.log('✅ Script loaded successfully!');
