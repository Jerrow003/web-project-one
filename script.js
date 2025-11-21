// Student Suggestion System - Main JavaScript with Firebase Integration
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

const MAX_CHARS = 500;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSuggestionSystem();
    initializeNavigation();
    initializeFAQ();
    initializeFirebaseAuth();
});

// Firebase Authentication
function initializeFirebaseAuth() {
    // You can add authentication features here if needed
    console.log('Firebase Auth initialized');
}

function initializeSuggestionSystem() {
    // Initial render from Firebase
    loadSuggestionsFromFirebase();
    updateStatsFromFirebase();

    // Character counter
    const textarea = document.getElementById('suggestion');
    const charCount = document.getElementById('charCount');
    
    if (textarea && charCount) {
        charCount.textContent = textarea.value.length;
        textarea.addEventListener('input', function() {
            const len = textarea.value.length;
            charCount.textContent = len;
            
            // Add warning class when approaching limit
            if (len > MAX_CHARS - 50) {
                charCount.classList.add('warning');
            } else {
                charCount.classList.remove('warning');
            }
        });
    }

    // Form submission
    const form = document.getElementById('suggestionForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
    }
}

function initializeNavigation() {
    // Mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const primaryNav = document.getElementById('primary-navigation');
    
    if (navToggle && primaryNav) {
        navToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', String(!isExpanded));
            primaryNav.classList.toggle('open');
            this.classList.toggle('open');
            
            // Change icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Close menu when clicking on nav links (mobile)
        const navLinks = primaryNav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navToggle.setAttribute('aria-expanded', 'false');
                    primaryNav.classList.remove('open');
                    navToggle.classList.remove('open');
                    
                    const icon = navToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            });
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const toggle = item.querySelector('.faq-toggle');
        
        if (question && toggle) {
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        otherItem.querySelector('.faq-toggle').textContent = '+';
                    }
                });
                
                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                    toggle.textContent = '-';
                } else {
                    item.classList.remove('active');
                    toggle.textContent = '+';
                }
            });
        }
    });
}

// Firebase Functions
async function loadSuggestionsFromFirebase() {
    try {
        const q = query(collection(db, 'suggestions'), orderBy('created', 'desc'));
        const querySnapshot = await getDocs(q);
        const suggestions = [];
        
        querySnapshot.forEach((doc) => {
            suggestions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderSuggestions(suggestions);
        return suggestions;
    } catch (error) {
        console.error('Error loading suggestions:', error);
        showNotification('Error loading suggestions. Please try again.', 'error');
        return [];
    }
}

// Real-time listener for suggestions
function setupRealtimeListener() {
    const q = query(collection(db, 'suggestions'), orderBy('created', 'desc'));
    
    onSnapshot(q, (querySnapshot) => {
        const suggestions = [];
        querySnapshot.forEach((doc) => {
            suggestions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderSuggestions(suggestions);
        updateStats(suggestions);
    });
}

async function handleFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const department = form.department?.value?.trim() || 'Other';
    const tag = form.tag?.value?.trim() || 'Other';
    const text = form.suggestion?.value?.trim();
    
    if (!text) {
        showNotification('Please enter a suggestion.', 'error');
        return;
    }
    
    if (text.length > MAX_CHARS) {
        showNotification(`Suggestion exceeds ${MAX_CHARS} characters. Please shorten your suggestion.`, 'error');
        return;
    }

    const newSuggestion = {
        department,
        tag,
        text,
        status: 'Pending',
        adminResponse: '',
        created: new Date().toISOString(),
        submittedBy: 'Student',
        priority: 'Medium'
    };

    try {
        const docRef = await addDoc(collection(db, 'suggestions'), newSuggestion);
        showNotification('Suggestion submitted successfully!', 'success');
        form.reset();
        
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.textContent = '0';
            charCount.classList.remove('warning');
        }
        
        // Refocus on department select
        setTimeout(() => {
            form.department.focus();
        }, 100);
    } catch (error) {
        console.error('Error adding suggestion:', error);
        showNotification('Failed to submit suggestion. Please try again.', 'error');
    }
}

// Display functions
function renderSuggestions(list) {
    const container = document.getElementById('suggestionsPreview');
    if (!container) return;

    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="no-suggestions">
                <i class="fas fa-lightbulb"></i>
                <h3>No Suggestions Yet</h3>
                <p>Be the first to submit a suggestion and help improve our university!</p>
            </div>
        `;
        return;
    }

    // Show only latest 6 suggestions on homepage
    const recentSuggestions = list.slice(0, 6);

    container.innerHTML = recentSuggestions.map(s => {
        const statusClass = `status-${(s.status || 'pending').toString().toLowerCase().replace(/\s+/g,'-')}`;
        const statusLabel = escapeHtml((s.status || 'Pending').toString());
        const adminHTML = s.adminResponse ? `
            <div class="admin-response">
                <h4>Response from Admin</h4>
                <div>${escapeHtml(s.adminResponse)}</div>
                <small><strong>Status:</strong> ${statusLabel}</small>
            </div>
        ` : '';
        
        return `
            <article class="suggestion-card" data-id="${s.id}">
                <header class="suggestion-meta">
                    <strong class="suggestion-tag">${escapeHtml(s.tag || 'Other')}</strong>
                    <span class="suggestion-dept">${escapeHtml(s.department || 'General')}</span>
                    <span class="suggestion-status ${statusClass}">${statusLabel}</span>
                </header>
                <p class="suggestion-text">${escapeHtml(s.text)}</p>
                ${adminHTML}
                <footer class="suggestion-footer">
                    <span class="suggestion-date">
                        <i class="far fa-clock"></i>
                        ${formatDate(s.created)}
                    </span>
                    <span>ID: ${s.id.substring(0, 8)}...</span>
                </footer>
            </article>
        `;
    }).join('');
}

async function updateStatsFromFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, 'suggestions'));
        const list = [];
        querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
        });
        
        updateStats(list);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStats(list) {
    const totalEl = document.getElementById('totalSuggestionsCount');
    const implementedEl = document.getElementById('resolvedCount');
    const deptEl = document.getElementById('departmentsCount');

    const total = list.length;
    const implemented = list.filter(s => 
        (s.status || '').toLowerCase() === 'implemented' || 
        (s.status || '').toLowerCase() === 'resolved'
    ).length;
    
    const uniqueDepartments = new Set(list.map(s => s.department)).size;

    if (totalEl) totalEl.textContent = total;
    if (implementedEl) implementedEl.textContent = implemented;
    if (deptEl) deptEl.textContent = Math.max(uniqueDepartments, 1);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Setup real-time listener when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        setupRealtimeListener();
    }, 1000);
});

// Make functions available globally
window.showNotification = showNotification;
window.loadSuggestionsFromFirebase = loadSuggestionsFromFirebase;
