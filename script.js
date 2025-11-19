// Student Suggestion System - Main JavaScript
const SUGGESTIONS_KEY = 'muni_suggestions_v1';
const MAX_CHARS = 500;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSuggestionSystem();
    initializeNavigation();
    initializeFAQ();
    initializeSampleData();
});

function initializeSuggestionSystem() {
    // Initial render
    const suggestions = readSuggestions();
    renderSuggestions(suggestions);
    updateStats(suggestions);

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

function initializeSampleData() {
    // Add sample data if no suggestions exist
    const suggestions = readSuggestions();
    if (suggestions.length === 0) {
        const sampleSuggestions = [
            {
                id: Date.now() - 86400000 * 5,
                department: "Faculty of Technoscience",
                tag: "Technology",
                text: "Upgrade computer lab equipment to support the latest software required for programming courses. Many computers are outdated and cannot run modern development tools efficiently.",
                status: "In Review",
                adminResponse: "We appreciate this suggestion. The IT department is currently conducting an assessment of all computer labs and will present an upgrade proposal in the next budget cycle.",
                created: Date.now() - 86400000 * 5,
                submittedBy: "Computer Science Student"
            },
            {
                id: Date.now() - 86400000 * 3,
                department: "Library",
                tag: "Academic",
                text: "Extend library hours during exam periods to accommodate students who prefer studying late at night. Current closing time of 8 PM is too early during finals.",
                status: "Implemented",
                adminResponse: "Great suggestion! Starting next semester, the library will remain open until 11 PM during the two weeks of final examinations. Security arrangements have been made.",
                created: Date.now() - 86400000 * 3,
                submittedBy: "Student Union"
            },
            {
                id: Date.now() - 86400000 * 1,
                department: "Administration",
                tag: "Student Welfare",
                text: "Install more water dispensers around campus, especially near lecture halls and the student center. Staying hydrated is important for concentration.",
                status: "Pending",
                adminResponse: "",
                created: Date.now() - 86400000 * 1,
                submittedBy: "Health Science Student"
            }
        ];
        
        sampleSuggestions.forEach(suggestion => {
            suggestions.push(suggestion);
        });
        
        saveSuggestions(suggestions);
        renderSuggestions(suggestions);
        updateStats(suggestions);
    }
}

function handleFormSubmission(e) {
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
        id: Date.now(),
        department,
        tag,
        text,
        status: 'Pending',
        adminResponse: '',
        created: Date.now(),
        submittedBy: 'Student'
    };

    const list = readSuggestions();
    list.unshift(newSuggestion);
    const success = saveSuggestions(list);

    if (success) {
        renderSuggestions(list);
        updateStats(list);
        form.reset();
        
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.textContent = '0';
            charCount.classList.remove('warning');
        }
        
        showNotification('Suggestion submitted successfully!', 'success');
        
        // Refocus on department select
        setTimeout(() => {
            form.department.focus();
        }, 100);
    }
}

// Storage functions
function readSuggestions() {
    try {
        const stored = localStorage.getItem(SUGGGESTIONS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to parse suggestions', e);
    }
    return [];
}

function saveSuggestions(list) {
    try {
        localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(list));
        return true;
    } catch (e) {
        console.error('Failed to save suggestions', e);
        showNotification('Failed to save suggestion. Please try again.', 'error');
        return false;
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
                    <span>ID: #${s.id}</span>
                </footer>
            </article>
        `;
    }).join('');
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
function formatDate(timestamp) {
    const date = new Date(timestamp);
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

// Make functions available globally for admin dashboard compatibility
window.readSuggestions = readSuggestions;
window.saveSuggestions = saveSuggestions;
window.showNotification = showNotification;
