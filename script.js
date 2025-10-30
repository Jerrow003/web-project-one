// Enhanced JavaScript with modern features
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Initialize all components
    initializeNavigation();
    initializeSuggestionForm();
    initializeFAQ();
    initializeContactForm();
    initializeScrollToTop();
    initializeAnimations();
    
    // Load initial data
    loadRecentSuggestions();
    updateHeroStats();
    
    // Add intersection observer for animations
    initScrollAnimations();
}

// Navigation functionality
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    // Close mobile menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        });
    });
}

// Enhanced Suggestion Form
function initializeSuggestionForm() {
    const suggestionForm = document.getElementById('suggestionForm');
    const suggestionTextarea = document.getElementById('suggestion');
    const charCount = document.getElementById('charCount');
    
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', handleSuggestionSubmit);
    }
    
    // Character counter
    if (suggestionTextarea && charCount) {
        suggestionTextarea.addEventListener('input', () => {
            const count = suggestionTextarea.value.length;
            charCount.textContent = count;
            
            if (count > 450) {
                charCount.style.color = '#e74c3c';
            } else if (count > 350) {
                charCount.style.color = '#f39c12';
            } else {
                charCount.style.color = '#27ae60';
            }
        });
    }
}

const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(e.target);
        const suggestion = {
            id: generateId(),
            department: formData.get('department'),
            suggestion_text: formData.get('suggestion'),
            tag: formData.get('tag'),
            status: 'New',
            timestamp: new Date().toISOString(),
            upvotes: Math.floor(Math.random() * 50) // Simulate engagement
        };

        // Validate form
        if (!suggestion.department || !suggestion.suggestion_text || !suggestion.tag) {
            throw new Error('Please fill in all fields');
        }

        if (suggestion.suggestion_text.length < 10) {
            throw new Error('Please provide a more detailed suggestion (minimum 10 characters)');
        }

        if (suggestion.suggestion_text.length > 500) {
            throw new Error('Suggestion must be less than 500 characters');
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        let suggestions = loadSuggestions();
        suggestions.unshift(suggestion);
        saveSuggestions(suggestions);

        // Show success message with animation
        showMessage('🎉 Thank you! Your suggestion has been submitted successfully. The administration will review it soon.', 'success');
        
        // Reset form
        e.target.reset();
        document.getElementById('charCount').textContent = '0';
        
        // Reload recent suggestions
        loadRecentSuggestions();
        updateHeroStats();
        
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        // Reset button state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

// Enhanced FAQ System
function initializeFAQ() {
    // Initialize FAQ data
    const faqData = {
        general: [
            {
                question: "What is the Student Suggestion System?",
                answer: "The Student Suggestion System is an official platform for Muni University students to submit ideas, suggestions, and feedback to help improve various aspects of university life. It serves as a direct communication channel between students and administration, covering academics, infrastructure, administration, and student welfare."
            },
            {
                question: "Who can use this system?",
                answer: "This system is exclusively available to all currently enrolled students of Muni University. Your active student status is required to access and use all features of the platform."
            },
            {
                question: "Are my suggestions anonymous?",
                answer: "While suggestions are linked to your student account for tracking and follow-up purposes, your identity remains confidential. Only authorized administrative staff can access submitter information when necessary for implementation or clarification."
            }
        ],
        submission: [
            {
                question: "How do I submit an effective suggestion?",
                answer: "To submit an effective suggestion:<br><br>1. <strong>Be Specific:</strong> Clearly describe the issue or idea<br>2. <strong>Provide Context:</strong> Explain why this change is needed<br>3. <strong>Offer Solutions:</strong> Propose practical implementation ideas<br>4. <strong>Consider Impact:</strong> Highlight benefits to the university community<br>5. <strong>Use Professional Language:</strong> Maintain respectful and constructive tone"
            },
            {
                question: "What types of suggestions are most likely to be implemented?",
                answer: "Suggestions that are:<br>• Feasible within university resources<br>• Beneficial to a significant number of students<br>• Aligned with university goals and values<br>• Well-researched and clearly explained<br>• Practical and implementable<br><br>Infrastructure and academic suggestions often see high implementation rates."
            },
            {
                question: "Can I include attachments with my suggestion?",
                answer: "Currently, the system supports text-based suggestions only. However, you can describe any supporting documents or references in your suggestion text. For complex proposals requiring attachments, please mention this in your submission and the review team may contact you for additional materials."
            }
        ],
        process: [
            {
                question: "What is the suggestion review process?",
                answer: "The review process follows these stages:<br><br>1. <strong>Initial Screening</strong> (1-3 days): Basic validation and categorization<br>2. <strong>Department Review</strong> (1-2 weeks): Relevant department assesses feasibility<br>3. <strong>Evaluation</strong> (1-3 weeks): Cost-benefit analysis and impact assessment<br>4. <strong>Decision</strong>: Implementation, modification, or rejection<br>5. <strong>Notification</strong>: You receive status updates throughout the process"
            },
            {
                question: "How long does the entire process take?",
                answer: "Typical timeline:<br>• Initial acknowledgment: Within 24 hours<br>• Preliminary review: 3-5 working days<br>• Complete evaluation: 2-4 weeks<br>• Implementation (if approved): 1-6 months depending on complexity<br><br>You can track your suggestion status through regular updates."
            },
            {
                question: "What happens if my suggestion is approved?",
                answer: "If approved:<br>• You'll receive an implementation notification<br>• The suggestion is assigned to relevant departments<br>• Progress updates are provided during implementation<br>• You may be consulted for clarification<br>• Once implemented, the suggestion status changes to 'Resolved'<br>• You'll receive final confirmation of implementation"
            }
        ],
        technical: [
            {
                question: "I'm having technical issues with the platform",
                answer: "If you experience technical difficulties:<br><br>1. <strong>Refresh the page</strong> and try again<br>2. <strong>Clear your browser cache</strong> and cookies<br>3. <strong>Try a different browser</strong> (Chrome, Firefox, Safari)<br>4. <strong>Check your internet connection</strong><br>5. <strong>Disable browser extensions</strong> that might interfere<br><br>If issues persist, contact ICT support at ictsupport@muni.ac.ug"
            },
            {
                question: "Can I access the system on mobile devices?",
                answer: "Yes! The Student Suggestion System is fully responsive and optimized for:<br>• Smartphones (iOS & Android)<br>• Tablets<br>• Desktop computers<br><br>For best performance, ensure your device is updated and use a stable internet connection. The mobile experience includes all features available on desktop."
            },
            {
                question: "My suggestion disappeared after submission",
                answer: "This is rare but could occur due to:<br>• Temporary network issues during submission<br>• Browser caching problems<br>• System maintenance periods<br><br>First, refresh the page and check your submission confirmation. If the issue persists, contact support with your suggestion details and approximate submission time for investigation."
            }
        ]
    };

    // Populate FAQ categories
    populateFAQ(faqData);
    
    // Category switching
    const categoryBtns = document.querySelectorAll('.category-btn, .help-card-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            switchFAQCategory(category);
        });
    });

    // FAQ item toggle
    document.addEventListener('click', (e) => {
        if (e.target.closest('.faq-question')) {
            const faqItem = e.target.closest('.faq-item');
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        }
    });
}

function populateFAQ(faqData) {
    const container = document.getElementById('general-faq');
    if (!container) return;

    // Populate all categories
    Object.keys(faqData).forEach(category => {
        const categoryElement = document.getElementById(`${category}-faq`) || container;
        categoryElement.innerHTML = faqData[category].map((item, index) => `
            <div class="faq-item ${index === 0 ? 'active' : ''}">
                <div class="faq-question">
                    <h3>${item.question}</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">
                    <p>${item.answer}</p>
                </div>
            </div>
        `).join('');
    });
}

function switchFAQCategory(category) {
    // Update category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Update FAQ content
    document.querySelectorAll('.faq-category').forEach(cat => {
        cat.classList.remove('active');
    });
    document.getElementById(`${category}-faq`).classList.add('active');
}

// Contact Form
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
}

const handleContactFormSubmit = async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(e.target);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            timestamp: new Date().toISOString()
        };

        // Validate form
        if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
            throw new Error('Please fill in all fields');
        }

        if (!isValidEmail(contactData.email)) {
            throw new Error('Please enter a valid email address');
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success message
        showMessage('✅ Thank you for your message! We have received your inquiry and will get back to you within 24-48 hours.', 'success');
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        // Reset button state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

// Scroll to Top functionality
function initializeScrollToTop() {
    const scrollBtn = document.querySelector('.scroll-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Animations
function initializeAnimations() {
    // Add loading animation to hero stats
    animateValue('totalSuggestionsCount', 0, getTotalSuggestions(), 2000);
    animateValue('resolvedCount', 0, getResolvedSuggestions(), 2000);
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.suggestion-card, .help-card, .contact-card').forEach(el => {
        observer.observe(el);
    });
}

// Data Management
const loadSuggestions = () => {
    const existingSuggestionsJSON = localStorage.getItem('suggestions');
    return existingSuggestionsJSON ? JSON.parse(existingSuggestionsJSON) : [];
};

const saveSuggestions = (suggestions) => {
    localStorage.setItem('suggestions', JSON.stringify(suggestions));
};

// Enhanced Recent Suggestions
const loadRecentSuggestions = () => {
    const suggestions = loadSuggestions();
    displayRecentSuggestions(suggestions.slice(0, 6));
};

const displayRecentSuggestions = (suggestions) => {
    const previewContainer = document.getElementById('suggestionsPreview');
    if (!previewContainer) return;

    if (suggestions.length === 0) {
        previewContainer.innerHTML = `
            <div class="no-suggestions">
                <i class="fas fa-inbox"></i>
                <h3>No Suggestions Yet</h3>
                <p>Be the first to share your ideas and help improve Muni University!</p>
            </div>
        `;
        return;
    }

    previewContainer.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-card">
            <div class="suggestion-header">
                <span class="suggestion-department">
                    <i class="fas fa-building"></i>
                    ${suggestion.department}
                </span>
                <span class="suggestion-category">${suggestion.tag}</span>
            </div>
            <div class="suggestion-text">
                ${suggestion.suggestion_text}
            </div>
            <div class="suggestion-footer">
                <span class="suggestion-date">
                    <i class="far fa-clock"></i>
                    ${new Date(suggestion.timestamp).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}
                </span>
                <span class="suggestion-status status-${suggestion.status.toLowerCase().replace(' ', '')}">
                    ${suggestion.status}
                </span>
            </div>
        </div>
    `).join('');
};

// Statistics
function updateHeroStats() {
    const suggestions = loadSuggestions();
    const total = suggestions.length;
    const resolved = suggestions.filter(s => s.status === 'Resolved').length;
    
    animateValue('totalSuggestionsCount', parseInt(document.getElementById('totalSuggestionsCount').textContent) || 0, total, 1500);
    animateValue('resolvedCount', parseInt(document.getElementById('resolvedCount').textContent) || 0, resolved, 1500);
}

function getTotalSuggestions() {
    return loadSuggestions().length;
}

function getResolvedSuggestions() {
    return loadSuggestions().filter(s => s.status === 'Resolved').length;
}

// Utility Functions
const generateId = () => {
    return 'SUG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const showMessage = (text, type) => {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = text;
    
    // Insert at appropriate location
    const form = document.getElementById('suggestionForm') || document.getElementById('contactForm');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form);
    } else {
        document.querySelector('.submission-section .container').prepend(messageDiv);
    }
    
    // Auto-remove after delay
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(-10px)';
        setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const animateValue = (id, start, end, duration) => {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        obj.textContent = value.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Add some sample data on first load
window.addEventListener('load', () => {
    const suggestions = loadSuggestions();
    if (suggestions.length === 0) {
        const sampleSuggestions = [
            {
                id: generateId(),
                department: "Library",
                suggestion_text: "Extend library opening hours during exam periods to accommodate students who prefer studying late at night. Many students would benefit from having access to library resources until midnight.",
                tag: "Academic",
                status: "In Progress",
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                upvotes: 23
            },
            {
                id: generateId(),
                department: "ICT",
                suggestion_text: "Improve WiFi connectivity in student hostels and common areas. The current network is often slow and unreliable, affecting online learning and research activities.",
                tag: "Technology",
                status: "New",
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                upvotes: 45
            },
            {
                id: generateId(),
                department: "Administration",
                suggestion_text: "Install more water dispensers around campus, especially near lecture halls and the library. Students often struggle to find drinking water during busy days.",
                tag: "Infrastructure",
                status: "Resolved",
                timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                upvotes: 67
            }
        ];
        saveSuggestions(sampleSuggestions);
        loadRecentSuggestions();
        updateHeroStats();
    }
});