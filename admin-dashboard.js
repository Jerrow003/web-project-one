// Admin Dashboard JavaScript - Integrated with Firebase
import { auth, db } from './firebase.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy,
    where,
    onSnapshot
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

class AdminDashboard {
    constructor() {
        this.suggestions = [];
        this.currentSuggestionId = null;
        this.currentFilter = 'all';
        this.unsubscribe = null;
        this.init();
    }

    // Initialize the dashboard
    async init() {
        // Check authentication
        if (!this.checkAuth()) {
            window.location.href = 'admin-login.html';
            return;
        }

        this.setupEventListeners();
        await this.loadSuggestions();
        this.setupRealtimeListener();
        this.announce('Admin dashboard loaded successfully');
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

    // Load suggestions from Firebase
    async loadSuggestions() {
        try {
            const q = query(collection(db, 'suggestions'), orderBy('created', 'desc'));
            const querySnapshot = await getDocs(q);
            this.suggestions = [];
            
            querySnapshot.forEach((doc) => {
                this.suggestions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.displaySuggestions(this.suggestions);
        } catch (error) {
            console.error('Error loading suggestions:', error);
            this.showNotification('Error loading suggestions', 'error');
        }
    }

    // Setup real-time listener
    setupRealtimeListener() {
        const q = query(collection(db, 'suggestions'), orderBy('created', 'desc'));
        
        this.unsubscribe = onSnapshot(q, (querySnapshot) => {
            this.suggestions = [];
            querySnapshot.forEach((doc) => {
                this.suggestions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.refreshCurrentView();
        });
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
        const responded = this.suggestions.filter(s => s.adminResponse && s.adminResponse.trim() !== '');
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
                        <span>Submitted: ${this.formatDate(suggestion.created)}</span>
                        <span>ID: ${suggestion.id.substring(0, 8)}...</span>
                    </div>
                    
                    ${suggestion.adminResponse ? `
                    <div class="admin-response-display">
                        <div class="admin-response-header">
                            <div class="admin-response-title">
                                <i class="fas fa-reply"></i>
                                Admin Response
                            </div>
                            <div class="admin-response-date">Responded: ${this.formatDate(suggestion.created)}</div>
                        </div>
                        <p>${this.escapeHtml(suggestion.adminResponse)}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="suggestion-actions-admin">
                    <button type="button" class="action-btn-admin respond-btn" 
                            onclick="adminDashboard.openResponseModal('${suggestion.id}')"
                            data-tooltip="Respond to this suggestion">
                        <i class="fas fa-reply"></i>
                        <span>Respond</span>
                    </button>
                    <button type="button" class="action-btn-admin implement-btn" 
                            onclick="adminDashboard.updateStatus('${suggestion.id}', 'Implemented')"
                            data-tooltip="Mark as implemented">
                        <i class="fas fa-check"></i>
                        <span>Implement</span>
                    </button>
                    <button type="button" class="action-btn-admin reject-btn" 
                            onclick="adminDashboard.updateStatus('${suggestion.id}', 'Rejected')"
                            data-tooltip="Reject this suggestion">
                        <i class="fas fa-times"></i>
                        <span>Reject</span>
                    </button>
                    <button type="button" class="action-btn-admin delete-btn" 
                            onclick="adminDashboard.openDeleteModal('${suggestion.id}')"
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
        document.getElementById('adminResponse').value = suggestion.adminResponse || '';
        document.getElementById('responseStatus').value = suggestion.status;
        
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
    async submitResponse() {
        const response = document.getElementById('adminResponse').value.trim();
        const status = document.getElementById('responseStatus').value;
        
        if (!response) {
            this.showNotification('Please enter a response before submitting.', 'error');
            return;
        }
        
        try {
            const suggestionRef = doc(db, 'suggestions', this.currentSuggestionId);
            await updateDoc(suggestionRef, {
                adminResponse: response,
                status: status,
                respondedDate: new Date().toISOString()
            });
            
            this.showNotification('Response submitted successfully!', 'success');
            this.closeResponseModal();
        } catch (error) {
            console.error('Error updating suggestion:', error);
            this.showNotification('Failed to submit response. Please try again.', 'error');
        }
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
    async confirmDelete() {
        if (!this.currentSuggestionId) return;
        
        try {
            await deleteDoc(doc(db, 'suggestions', this.currentSuggestionId));
            this.showNotification('Suggestion deleted successfully', 'success');
            this.announce('Suggestion deleted');
        } catch (error) {
            console.error('Error deleting suggestion:', error);
            this.showNotification('Failed to delete suggestion. Please try again.', 'error');
        }
        
        this.closeDeleteModal();
    }

    // Update suggestion status
    async updateStatus(id, status) {
        try {
            const suggestionRef = doc(db, 'suggestions', id);
            await updateDoc(suggestionRef, {
                status: status
            });
            
            this.showNotification(`Suggestion status updated to ${status}`, 'success');
            this.announce(`Status changed to ${status}`);
        } catch (error) {
            console.error('Error updating status:', error);
            this.showNotification('Failed to update status. Please try again.', 'error');
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
            </div>
        `;
    }

    // Calculate dashboard statistics
    calculateStats() {
        return {
            total: this.suggestions.length,
            pending: this.suggestions.filter(s => s.status === 'Pending').length,
            implemented: this.suggestions.filter(s => s.status === 'Implemented').length,
            responded: this.suggestions.filter(s => s.adminResponse && s.adminResponse.trim() !== '').length
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
                    <span class="activity-date">${this.formatDate(suggestion.created)} • ${suggestion.status}</span>
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
                    <h3><i class="fas fa-info-circle"></i> System Information</h3>
                    <div class="system-info">
                        <p><strong>Backend:</strong> Firebase Firestore</p>
                        <p><strong>Authentication:</strong> Firebase Auth</p>
                        <p><strong>Total Suggestions:</strong> ${this.suggestions.length}</p>
                        <p><strong>Real-time Updates:</strong> Enabled</p>
                    </div>
                </div>
            </div>
        `;
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
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
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
    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.showNotification('Logging out...', 'info');
            
            // Unsubscribe from real-time listener
            if (this.unsubscribe) {
                this.unsubscribe();
            }
            
            // Clear admin session
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            
            // Sign out from Firebase
            try {
                await signOut(auth);
            } catch (error) {
                console.error('Error signing out:', error);
            }
            
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
