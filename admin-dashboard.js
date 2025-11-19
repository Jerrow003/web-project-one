// Admin Dashboard JavaScript - Integrated with Student Suggestion System
class AdminDashboard {
    constructor() {
        this.SUGGESTIONS_KEY = 'muni_suggestions_v1';
        this.MAX_CHARS = 500;
        this.suggestions = this.loadSuggestionsFromStorage();
        this.currentSuggestionId = null;
        this.currentFilter = 'all';
        this.init();
    }

    // Load suggestions from localStorage (compatible with student system)
    loadSuggestionsFromStorage() {
        try {
            const stored = localStorage.getItem(this.SUGGESTIONS_KEY);
            if (stored) {
                const suggestions = JSON.parse(stored);
                // Transform student format to admin format if needed
                return suggestions.map(suggestion => this.transformSuggestionFormat(suggestion));
            }
        } catch (e) {
            console.error('Failed to parse suggestions', e);
        }

        // Default sample data in student system format
        return [
            {
                id: Date.now() - 86400000 * 5,
                department: "Academic Affairs",
                tag: "Academic",
                text: "Implement more flexible office hours for professors to better accommodate student schedules, especially for working students and those with family commitments.",
                status: "Pending",
                adminResponse: "",
                created: Date.now() - 86400000 * 5,
                submittedBy: "Student Union",
                priority: "Medium"
            },
            {
                id: Date.now() - 86400000 * 4,
                department: "Facilities Management",
                tag: "Facilities",
                text: "Install more water fountains and hydration stations around campus, particularly near the library, student center, and sports facilities to promote student wellness.",
                status: "In Review",
                adminResponse: "We are currently evaluating the feasibility of this suggestion and conducting a campus-wide assessment. Will provide an update after the next facilities committee meeting.",
                created: Date.now() - 86400000 * 4,
                submittedBy: "Health & Wellness Committee",
                priority: "High"
            },
            {
                id: Date.now() - 86400000 * 3,
                department: "IT Services",
                tag: "Technology",
                text: "Upgrade the Wi-Fi infrastructure in dormitories and academic buildings to handle increased device connectivity and support online learning platforms.",
                status: "Implemented",
                adminResponse: "This suggestion has been successfully implemented. New access points were installed during the winter break, and network capacity has been increased by 40%.",
                created: Date.now() - 86400000 * 3,
                submittedBy: "Computer Science Department",
                priority: "High"
            },
            {
                id: Date.now() - 86400000 * 2,
                department: "Student Affairs",
                tag: "Student Life",
                text: "Create more social events and cultural programs for international students to help them integrate better into campus life and build community connections.",
                status: "Rejected",
                adminResponse: "While we appreciate this suggestion and recognize its importance, our current budget allocation does not allow for additional social programming this semester. We will reconsider this for the next academic year.",
                created: Date.now() - 86400000 * 2,
                submittedBy: "International Students Association",
                priority: "Medium"
            }
        ];
    }

    // Transform suggestion format between student and admin systems
    transformSuggestionFormat(suggestion) {
        return {
            id: suggestion.id,
            department: suggestion.department || 'General',
            text: suggestion.text || '',
            status: suggestion.status || 'Pending',
            response: suggestion.adminResponse || '',
            date: this.formatDateForDisplay(suggestion.created || Date.now()),
            submittedBy: suggestion.submittedBy || 'Anonymous Student',
            priority: suggestion.priority || 'Medium',
            tag: suggestion.tag || 'Other',
            created: suggestion.created || Date.now(),
            // Keep original fields for compatibility
            adminResponse: suggestion.adminResponse || '',
            originalData: suggestion
        };
    }

    // Format date for display
    formatDateForDisplay(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    // Save suggestions to localStorage (compatible with student system)
    saveSuggestions() {
        try {
            // Transform back to student system format before saving
            const studentFormatSuggestions = this.suggestions.map(suggestion => {
                const baseSuggestion = suggestion.originalData || {};
                return {
                    id: suggestion.id,
                    department: suggestion.department,
                    tag: suggestion.tag || 'Other',
                    text: suggestion.text,
                    status: suggestion.status,
                    adminResponse: suggestion.response || suggestion.adminResponse,
                    created: suggestion.created,
                    submittedBy: suggestion.submittedBy,
                    priority: suggestion.priority,
                    // Preserve any additional fields from original data
                    ...baseSuggestion
                };
            });
            
            localStorage.setItem(this.SUGGESTIONS_KEY, JSON.stringify(studentFormatSuggestions));
            return true;
        } catch (e) {
            console.error('Failed to save suggestions', e);
            this.showNotification('Failed to save suggestions', 'error');
            return false;
        }
    }

    // Initialize the dashboard
    init() {
        // Check authentication
        if (!this.checkAuth()) {
            window.location.href = 'admin-login.html';
            return;
        }

        this.setupEventListeners();
        this.loadSuggestions();
        this.announce('Admin dashboard loaded successfully');
        
        // Update student system stats
        this.updateStudentSystemStats();
    }

    // Check authentication
    checkAuth() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        const loginTime = parseInt(localStorage.getItem('adminLoginTime'));
        const currentTime = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (!isLoggedIn || currentTime - loginTime > twentyFourHours) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            return false;
        }
        return true;
    }

    // Update stats in student system
    updateStudentSystemStats() {
        const stats = this.calculateStats();
        
        // Update student system elements if they exist
        const totalEl = document.getElementById('totalSuggestionsCount');
        const implementedEl = document.getElementById('resolvedCount');
        const deptEl = document.getElementById('departmentsCount');

        if (totalEl) totalEl.textContent = stats.total;
        if (implementedEl) implementedEl.textContent = stats.implemented;
        if (deptEl) {
            const uniqueDepartments = new Set(this.suggestions.map(s => s.department)).size;
            deptEl.textContent = Math.max(uniqueDepartments, 1);
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(item);
            });
        });

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl+Enter to submit response
            if (e.ctrlKey && e.key === 'Enter' && document.getElementById('responseModal').classList.contains('active')) {
                this.submitResponse();
            }
        });

        // Response character counter
        const responseTextarea = document.getElementById('adminResponse');
        const responseCharCount = document.getElementById('responseCharCount');
        if (responseTextarea && responseCharCount) {
            responseTextarea.addEventListener('input', () => {
                responseCharCount.textContent = responseTextarea.value.length;
            });
        }

        // Search functionality
        this.setupSearch();
    }

    // Toggle sidebar for mobile
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        
        sidebar.classList.toggle('open');
        toggle.classList.toggle('active');
        
        const isExpanded = sidebar.classList.contains('open');
        toggle.setAttribute('aria-expanded', isExpanded.toString());

        // Handle overlay
        this.handleSidebarOverlay(isExpanded);
        
        this.announce(isExpanded ? 'Sidebar opened' : 'Sidebar closed');
    }

    // Handle sidebar overlay for mobile
    handleSidebarOverlay(showOverlay) {
        let overlay = document.getElementById('sidebarOverlay');
        
        if (showOverlay && !overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sidebarOverlay';
            overlay.className = 'sidebar-overlay';
            overlay.addEventListener('click', () => this.toggleSidebar());
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('active'), 10);
        } else if (!showOverlay && overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    // Handle navigation between sections
    handleNavigation(navItem) {
        // Remove active class from all items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        navItem.classList.add('active');
        
        // Update content based on navigation
        const target = navItem.getAttribute('href').substring(1);
        this.updateContent(target);
    }

    // Update main content based on section
    updateContent(section) {
        const contentHeader = document.querySelector('.content-header h1');
        
        switch(section) {
            case 'dashboard':
                contentHeader.textContent = 'Dashboard Overview';
                this.showDashboard();
                break;
            case 'suggestions':
                contentHeader.textContent = 'All Suggestions';
                this.currentFilter = 'all';
                this.loadSuggestions();
                break;
            case 'pending':
                contentHeader.textContent = 'Pending Review';
                this.currentFilter = 'pending';
                this.loadPendingSuggestions();
                break;
            case 'responded':
                contentHeader.textContent = 'Responded Suggestions';
                this.currentFilter = 'responded';
                this.loadRespondedSuggestions();
                break;
            case 'settings':
                contentHeader.textContent = 'Settings';
                this.showSettings();
                break;
            default:
                contentHeader.textContent = 'All Suggestions';
                this.currentFilter = 'all';
                this.loadSuggestions();
        }

        this.announce(`Navigated to ${contentHeader.textContent}`);
    }

    // Load all suggestions
    loadSuggestions() {
        this.displaySuggestions(this.suggestions);
    }

    // Load pending suggestions
    loadPendingSuggestions() {
        const pending = this.suggestions.filter(s => s.status === 'Pending');
        this.displaySuggestions(pending);
    }

    // Load responded suggestions
    loadRespondedSuggestions() {
        const responded = this.suggestions.filter(s => s.response && s.response.trim() !== '');
        this.displaySuggestions(responded);
    }

    // Display suggestions in the grid
    displaySuggestions(suggestionsToShow) {
        const suggestionsGrid = document.getElementById('suggestionsGrid');
        
        if (!suggestionsGrid) return;

        if (suggestionsToShow.length === 0) {
            suggestionsGrid.innerHTML = this.getEmptyStateHTML();
            return;
        }

        suggestionsGrid.innerHTML = suggestionsToShow.map(suggestion => this.getSuggestionCardHTML(suggestion)).join('');
        
        // Add animation to cards
        setTimeout(() => {
            document.querySelectorAll('.suggestion-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('fade-in');
            });
        }, 100);
    }

    // Get HTML for empty state
    getEmptyStateHTML() {
        let message = '';
        switch(this.currentFilter) {
            case 'pending':
                message = 'There are no pending suggestions at this time.';
                break;
            case 'responded':
                message = 'No suggestions have been responded to yet.';
                break;
            default:
                message = 'No suggestions found. Suggestions will appear here once submitted by students.';
        }

        return `
            <div class="no-suggestions">
                <i class="fas fa-inbox"></i>
                <h3>No suggestions found</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Get HTML for suggestion card
    getSuggestionCardHTML(suggestion) {
        const statusClass = `status-${suggestion.status.toLowerCase().replace(' ', '-')}`;
        
        return `
            <div class="suggestion-card" data-id="${suggestion.id}">
                <div class="suggestion-header-admin">
                    <div class="department-badge">${this.escapeHtml(suggestion.department)}</div>
                    <div class="status-badge ${statusClass}">
                        ${suggestion.status}
                    </div>
                </div>
                <div class="suggestion-content">
                    ${suggestion.tag ? `
                    <div class="suggestion-tag">
                        <strong>Category:</strong> 
                        <span class="tag-${suggestion.tag.toLowerCase()}">${this.escapeHtml(suggestion.tag)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="suggestion-text">${this.escapeHtml(suggestion.text)}</div>
                    
                    ${suggestion.priority ? `
                    <div class="suggestion-priority">
                        <strong>Priority:</strong> 
                        <span class="priority-${suggestion.priority.toLowerCase()}">${suggestion.priority}</span>
                    </div>
                    ` : ''}
                    
                    ${suggestion.submittedBy ? `
                    <div class="suggestion-submitter">
                        <strong>Submitted by:</strong> ${this.escapeHtml(suggestion.submittedBy)}
                    </div>
                    ` : ''}
                    
                    <div class="suggestion-meta">
                        <span>Submitted: ${this.formatDate(suggestion.date)}</span>
                        <span>ID: #${suggestion.id}</span>
                    </div>
                    
                    ${suggestion.response ? `
                    <div class="admin-response-display">
                        <div class="admin-response-header">
                            <div class="admin-response-title">
                                <i class="fas fa-reply"></i>
                                Admin Response
                            </div>
                            <div class="admin-response-date">Responded: ${this.formatDate(suggestion.date)}</div>
                        </div>
                        <p>${this.escapeHtml(suggestion.response)}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="suggestion-actions-admin">
                    <button type="button" class="action-btn-admin respond-btn" 
                            onclick="adminDashboard.openResponseModal(${suggestion.id})"
                            data-tooltip="Respond to this suggestion">
                        <i class="fas fa-reply"></i>
                        <span>Respond</span>
                    </button>
                    <button type="button" class="action-btn-admin implement-btn" 
                            onclick="adminDashboard.updateStatus(${suggestion.id}, 'Implemented')"
                            data-tooltip="Mark as implemented">
                        <i class="fas fa-check"></i>
                        <span>Implement</span>
                    </button>
                    <button type="button" class="action-btn-admin reject-btn" 
                            onclick="adminDashboard.updateStatus(${suggestion.id}, 'Rejected')"
                            data-tooltip="Reject this suggestion">
                        <i class="fas fa-times"></i>
                        <span>Reject</span>
                    </button>
                    <button type="button" class="action-btn-admin delete-btn" 
                            onclick="adminDashboard.openDeleteModal(${suggestion.id})"
                            data-tooltip="Delete this suggestion">
                        <i class="fas fa-trash"></i>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    // Open response modal
    openResponseModal(id) {
        const suggestion = this.suggestions.find(s => s.id === id);
        if (!suggestion) return;
        
        this.currentSuggestionId = id;
        
        document.getElementById('previewDepartment').textContent = suggestion.department;
        document.getElementById('previewText').textContent = suggestion.text;
        document.getElementById('adminResponse').value = suggestion.response || '';
        document.getElementById('responseStatus').value = suggestion.status;
        
        // Update character count
        const responseCharCount = document.getElementById('responseCharCount');
        if (responseCharCount) {
            responseCharCount.textContent = document.getElementById('adminResponse').value.length;
        }
        
        const modal = document.getElementById('responseModal');
        modal.classList.add('active');
        
        // Focus on textarea
        setTimeout(() => {
            document.getElementById('adminResponse').focus();
        }, 100);
        
        this.announce('Response dialog opened');
    }

    // Close response modal
    closeResponseModal() {
        const modal = document.getElementById('responseModal');
        modal.classList.remove('active');
        this.currentSuggestionId = null;
        this.announce('Response dialog closed');
    }

    // Submit response
    submitResponse() {
        const response = document.getElementById('adminResponse').value.trim();
        const status = document.getElementById('responseStatus').value;
        
        if (!response) {
            this.showNotification('Please enter a response before submitting.', 'error');
            return;
        }
        
        const suggestionIndex = this.suggestions.findIndex(s => s.id === this.currentSuggestionId);
        if (suggestionIndex !== -1) {
            this.suggestions[suggestionIndex].response = response;
            this.suggestions[suggestionIndex].status = status;
            this.suggestions[suggestionIndex].respondedDate = new Date().toISOString().split('T')[0];
            
            // Save to localStorage (compatible with student system)
            const success = this.saveSuggestions();
            
            if (success) {
                this.refreshCurrentView();
                this.updateStudentSystemStats(); // Update student system
                this.showNotification('Response submitted successfully!', 'success');
            }
        }
        
        this.closeResponseModal();
    }

    // Open delete confirmation modal
    openDeleteModal(id) {
        const suggestion = this.suggestions.find(s => s.id === id);
        if (!suggestion) return;
        
        this.currentSuggestionId = id;
        
        document.getElementById('deletePreviewDepartment').textContent = suggestion.department;
        document.getElementById('deletePreviewText').textContent = suggestion.text;
        
        const modal = document.getElementById('deleteModal');
        modal.classList.add('active');
        
        this.announce('Delete confirmation dialog opened');
    }

    // Close delete modal
    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('active');
        this.currentSuggestionId = null;
        this.announce('Delete dialog closed');
    }

    // Confirm and execute deletion
    confirmDelete() {
        if (this.currentSuggestionId) {
            const suggestion = this.suggestions.find(s => s.id === this.currentSuggestionId);
            this.suggestions = this.suggestions.filter(s => s.id !== this.currentSuggestionId);
            
            // Save to localStorage
            const success = this.saveSuggestions();
            
            if (success) {
                this.refreshCurrentView();
                this.updateStudentSystemStats(); // Update student system
                this.showNotification(`Suggestion from ${suggestion.department} deleted successfully`, 'success');
                this.announce('Suggestion deleted');
            }
        }
        
        this.closeDeleteModal();
    }

    // Update suggestion status
    updateStatus(id, status) {
        const suggestionIndex = this.suggestions.findIndex(s => s.id === id);
        if (suggestionIndex !== -1) {
            const oldStatus = this.suggestions[suggestionIndex].status;
            this.suggestions[suggestionIndex].status = status;
            
            // Save to localStorage
            const success = this.saveSuggestions();
            
            if (success) {
                this.refreshCurrentView();
                this.updateStudentSystemStats(); // Update student system
                this.showNotification(`Suggestion status updated to ${status}`, 'success');
                this.announce(`Status changed from ${oldStatus} to ${status}`);
            }
        }
    }

    // Refresh current view based on active filter
    refreshCurrentView() {
        switch(this.currentFilter) {
            case 'pending':
                this.loadPendingSuggestions();
                break;
            case 'responded':
                this.loadRespondedSuggestions();
                break;
            default:
                this.loadSuggestions();
        }
    }

    // Show dashboard overview
    showDashboard() {
        const suggestionsGrid = document.getElementById('suggestionsGrid');
        if (!suggestionsGrid) return;

        const stats = this.calculateStats();
        
        suggestionsGrid.innerHTML = `
            <div class="dashboard-overview">
                <div class="stats-grid">
                    <div class="stat-card-dashboard total">
                        <div class="stat-icon">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${stats.total}</h3>
                            <p>Total Suggestions</p>
                        </div>
                    </div>
                    
                    <div class="stat-card-dashboard pending">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${stats.pending}</h3>
                            <p>Pending Review</p>
                        </div>
                    </div>
                    
                    <div class="stat-card-dashboard implemented">
                        <div class="stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${stats.implemented}</h3>
                            <p>Implemented</p>
                        </div>
                    </div>
                    
                    <div class="stat-card-dashboard responded">
                        <div class="stat-icon">
                            <i class="fas fa-reply"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${stats.responded}</h3>
                            <p>Responded</p>
                        </div>
                    </div>
                </div>
                
                <div class="recent-activity">
                    <div class="activity-header">
                        <h3>Recent Activity</h3>
                        <button class="refresh-btn" onclick="adminDashboard.loadSuggestions()">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                    
                    <div class="activity-list">
                        ${this.getRecentActivityHTML()}
                    </div>
                </div>
                
                <div class="quick-actions">
                    <h3>Quick Actions</h3>
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="adminDashboard.updateContent('pending')">
                            <i class="fas fa-inbox"></i>
                            Review Pending
                        </button>
                        <button class="btn-secondary" onclick="adminDashboard.exportData()">
                            <i class="fas fa-download"></i>
                            Export Data
                        </button>
                        <button class="btn-secondary" onclick="adminDashboard.showSettings()">
                            <i class="fas fa-cog"></i>
                            Settings
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Calculate dashboard statistics
    calculateStats() {
        return {
            total: this.suggestions.length,
            pending: this.suggestions.filter(s => s.status === 'Pending').length,
            implemented: this.suggestions.filter(s => s.status === 'Implemented').length,
            responded: this.suggestions.filter(s => s.response && s.response.trim() !== '').length,
            rejected: this.suggestions.filter(s => s.status === 'Rejected').length
        };
    }

    // Get recent activity HTML
    getRecentActivityHTML() {
        const recent = [...this.suggestions]
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 5);
        
        if (recent.length === 0) {
            return '<p class="no-activity">No recent activity</p>';
        }
        
        return recent.map(suggestion => `
            <div class="activity-item">
                <div class="activity-icon status-${suggestion.status.toLowerCase().replace(' ', '-')}">
                    <i class="fas fa-${this.getSuggestionIcon(suggestion)}"></i>
                </div>
                <div class="activity-content">
                    <strong>${suggestion.department}</strong>
                    <p>${suggestion.text.substring(0, 80)}${suggestion.text.length > 80 ? '...' : ''}</p>
                    <span class="activity-date">${this.formatDate(suggestion.date)} • ${suggestion.status}</span>
                </div>
            </div>
        `).join('');
    }

    // Get icon for suggestion based on status
    getSuggestionIcon(suggestion) {
        switch(suggestion.status) {
            case 'Implemented': return 'check-circle';
            case 'Rejected': return 'times-circle';
            case 'In Review': return 'eye';
            default: return 'lightbulb';
        }
    }

    // Show settings page
    showSettings() {
        const suggestionsGrid = document.getElementById('suggestionsGrid');
        if (!suggestionsGrid) return;

        suggestionsGrid.innerHTML = `
            <div class="settings-container">
                <div class="settings-section">
                    <h3><i class="fas fa-sliders-h"></i> Dashboard Settings</h3>
                    <div class="setting-item">
                        <label for="notifications">Enable Notifications</label>
                        <input type="checkbox" id="notifications" checked>
                    </div>
                    <div class="setting-item">
                        <label for="autoRefresh">Auto-refresh (minutes)</label>
                        <select id="autoRefresh">
                            <option value="0">Off</option>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><i class="fas fa-database"></i> Data Management</h3>
                    <div class="setting-actions">
                        <button class="btn-primary" onclick="adminDashboard.exportData()">
                            <i class="fas fa-download"></i>
                            Export All Data
                        </button>
                        <button class="btn-secondary" onclick="adminDashboard.importData()">
                            <i class="fas fa-upload"></i>
                            Import Data
                        </button>
                        <button class="btn-danger" onclick="adminDashboard.clearAllData()">
                            <i class="fas fa-trash"></i>
                            Clear All Data
                        </button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><i class="fas fa-info-circle"></i> System Information</h3>
                    <div class="system-info">
                        <p><strong>Version:</strong> 2.1.0</p>
                        <p><strong>Last Updated:</strong> ${this.formatDate(new Date().toISOString())}</p>
                        <p><strong>Total Suggestions:</strong> ${this.suggestions.length}</p>
                        <p><strong>Storage Key:</strong> ${this.SUGGESTIONS_KEY}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Export data
    exportData() {
        const dataStr = JSON.stringify(this.suggestions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `muni-suggestions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!', 'success');
    }

    // Import data
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        if (Array.isArray(importedData)) {
                            this.suggestions = importedData.map(s => this.transformSuggestionFormat(s));
                            const success = this.saveSuggestions();
                            
                            if (success) {
                                this.refreshCurrentView();
                                this.updateStudentSystemStats();
                                this.showNotification('Data imported successfully!', 'success');
                            }
                        } else {
                            this.showNotification('Invalid data format', 'error');
                        }
                    } catch (error) {
                        this.showNotification('Error importing data', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.suggestions = [];
            const success = this.saveSuggestions();
            
            if (success) {
                this.refreshCurrentView();
                this.updateStudentSystemStats();
                this.showNotification('All data cleared successfully', 'success');
            }
        }
    }

    // Setup search functionality
    setupSearch() {
        // This can be extended with actual search implementation
        console.log('Search functionality ready to be implemented');
    }

    // Close all modals
    closeAllModals() {
        this.closeResponseModal();
        this.closeDeleteModal();
        
        // Close sidebar on mobile
        if (window.innerWidth <= 1024) {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.getElementById('sidebarToggle');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                this.handleSidebarOverlay(false);
            }
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Get notification icon based on type
    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    // Announce for screen readers
    announce(message) {
        const announcer = document.getElementById('announcer');
        if (announcer) {
            announcer.textContent = message;
        }
    }

    // Format date
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Escape HTML to prevent XSS
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Logout function
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.showNotification('Logging out...', 'info');
            // Clear admin session
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 1000);
        }
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Global functions for HTML onclick attributes
function logout() {
    if (window.adminDashboard) {
        window.adminDashboard.logout();
    }
}

function loadSuggestions() {
    if (window.adminDashboard) {
        window.adminDashboard.loadSuggestions();
        window.adminDashboard.showNotification('Suggestions refreshed', 'success');
    }
}

function openResponseModal(id) {
    if (window.adminDashboard) {
        window.adminDashboard.openResponseModal(id);
    }
}

function closeResponseModal() {
    if (window.adminDashboard) {
        window.adminDashboard.closeResponseModal();
    }
}

function submitResponse() {
    if (window.adminDashboard) {
        window.adminDashboard.submitResponse();
    }
}

function openDeleteModal(id) {
    if (window.adminDashboard) {
        window.adminDashboard.openDeleteModal(id);
    }
}

function closeDeleteModal() {
    if (window.adminDashboard) {
        window.adminDashboard.closeDeleteModal();
    }
}

function confirmDelete() {
    if (window.adminDashboard) {
        window.adminDashboard.confirmDelete();
    }
}

function updateStatus(id, status) {
    if (window.adminDashboard) {
        window.adminDashboard.updateStatus(id, status);
    }
}

// Export storage functions for compatibility with student system
window.readSuggestions = () => {
    if (window.adminDashboard) {
        return window.adminDashboard.suggestions;
    }
    return [];
};

window.saveSuggestions = (list) => {
    if (window.adminDashboard) {
        window.adminDashboard.suggestions = list;
        return window.adminDashboard.saveSuggestions();
    }
    return false;
};
