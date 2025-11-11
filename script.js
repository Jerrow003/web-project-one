document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initializeNavigation();
    initializeSuggestionForm();
    initializeFAQ();
    loadRecentSuggestions();
    updateHeroStats();
    
    if (loadSuggestions().length === 0) {
        addSampleData();
    }
}

function initializeNavigation() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            const isVisible = navLinks.style.display === 'flex';
            navLinks.style.display = isVisible ? 'none' : 'flex';
        });
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        });
    });
}

function initializeSuggestionForm() {
    const form = document.getElementById('suggestionForm');
    const textarea = document.getElementById('suggestion');
    const charCount = document.getElementById('charCount');
    
    if (form) {
        form.addEventListener('submit', handleSuggestionSubmit);
    }
    
    if (textarea && charCount) {
        textarea.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            // Change color when approaching limit
            if (count > 450) {
                charCount.style.color = '#ff0000';
            } else if (count > 350) {
                charCount.style.color = '#ff9900';
            } else {
                charCount.style.color = '#666666';
            }
        });
    }
}

function handleSuggestionSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        const formData = new FormData(e.target);
        const suggestion = {
            id: Date.now(),
            department: formData.get('department'),
            suggestion_text: formData.get('suggestion'),
            tag: formData.get('tag'),
            status: 'New',
            timestamp: new Date().toISOString()
        };

        if (!suggestion.department || !suggestion.suggestion_text || !suggestion.tag) {
            alert('Please fill in all fields');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        if (suggestion.suggestion_text.length < 10) {
            alert('Please provide a more detailed suggestion (minimum 10 characters)');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        if (suggestion.suggestion_text.length > 500) {
            alert('Suggestion must be less than 500 characters');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        let suggestions = loadSuggestions();
        suggestions.unshift(suggestion);
        saveSuggestions(suggestions);
        
        alert('Thank you! Your suggestion has been submitted successfully. The administration will review it soon.');
        
        e.target.reset();
        document.getElementById('charCount').textContent = '0';
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        loadRecentSuggestions();
        updateHeroStats();
    }, 1000);
}

function initializeFAQ() {
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const item = this.parentElement;
            const isActive = item.classList.contains('active');
            
            document.querySelectorAll('.faq-item').forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

function loadSuggestions() {
    const suggestions = localStorage.getItem('suggestions');
    return suggestions ? JSON.parse(suggestions) : [];
}

function saveSuggestions(suggestions) {
    localStorage.setItem('suggestions', JSON.stringify(suggestions));
}

function loadRecentSuggestions() {
    const suggestions = loadSuggestions();
    displayRecentSuggestions(suggestions.slice(0, 6));
}

function displayRecentSuggestions(suggestions) {
    const container = document.getElementById('suggestionsPreview');
    if (!container) return;

    if (suggestions.length === 0) {
        container.innerHTML = `
            <div class="no-suggestions" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666; font-style: italic;">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; color: #ccc;"></i>
                <h3>No Suggestions Yet</h3>
                <p>Be the first to share your ideas and help improve Muni University!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = suggestions.map(suggestion => `
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
                    ${new Date(suggestion.timestamp).toLocaleDateString()}
                </span>
                <span class="suggestion-status status-${suggestion.status.toLowerCase().replace(' ', '')}">
                    ${suggestion.status}
                </span>
            </div>
        </div>
    `).join('');
}

function updateHeroStats() {
    const suggestions = loadSuggestions();
    const total = suggestions.length;
    const resolved = suggestions.filter(s => s.status === 'Resolved').length;
    
    document.getElementById('totalSuggestionsCount').textContent = total;
    document.getElementById('resolvedCount').textContent = resolved;
}

function addSampleData() {
    const sampleSuggestions = [
        {
            id: 1,
            department: "Library",
            suggestion_text: "Extend library opening hours during exam periods to accommodate students who prefer studying late at night. Many students would benefit from having access to library resources until midnight.",
            tag: "Academic",
            status: "In Progress",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 2,
            department: "ICT",
            suggestion_text: "Improve WiFi connectivity in student hostels and common areas. The current network is often slow and unreliable, affecting online learning and research activities.",
            tag: "Technology",
            status: "New",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 3,
            department: "Administration",
            suggestion_text: "Install more water dispensers around campus, especially near lecture halls and the library. Students often struggle to find drinking water during busy days.",
            tag: "Infrastructure",
            status: "Resolved",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    saveSuggestions(sampleSuggestions);
    loadRecentSuggestions();
    updateHeroStats();
}

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

