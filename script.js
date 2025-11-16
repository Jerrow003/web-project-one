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

(function(){
  const preview = document.getElementById('suggestionsPreview');
  const template = document.getElementById('suggestionTemplate');

  if (!preview || !template) return;

  // Utility: load stored suggestions (expects array of {id, department, tag, text, date})
  function loadSuggestions(){
    try{
      const raw = localStorage.getItem('suggestions');
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }

  // Utility: load resolutions map { id: { text, implemented } }
  function loadResolutions(){
    try{
      const raw = localStorage.getItem('resolutions');
      return raw ? JSON.parse(raw) : {};
    }catch(e){ return {}; }
  }

  function saveResolutions(map){
    localStorage.setItem('resolutions', JSON.stringify(map));
  }

  function render(){
    const items = loadSuggestions();
    const resolutions = loadResolutions();
    preview.innerHTML = '';
    if (!items.length){
      preview.innerHTML = '<p>No suggestions yet. Be the first to submit.</p>';
      return;
    }

    items.forEach(s => {
      const node = template.content.cloneNode(true);
      const card = node.querySelector('.suggestion-card');
      const dept = node.querySelector('.suggestion-department');
      const tag = node.querySelector('.suggestion-tag');
      const date = node.querySelector('.suggestion-date');
      const text = node.querySelector('.suggestion-text');

      card.dataset.id = s.id ?? String(Date.now()) ;
      dept.textContent = s.department || 'General';
      tag.textContent = s.tag || '';
      date.textContent = s.date || '';
      text.textContent = s.suggestion || s.text || '';

      // Apply resolution if exists
      const res = resolutions[card.dataset.id];
      const existingResEl = node.querySelector('.existing-resolution');
      const resTextEl = node.querySelector('.resolution-text');
      const editorEl = node.querySelector('.resolution-editor');
      const textarea = node.querySelector('.resolution-input');

      if (res && res.text){
        existingResEl.hidden = false;
        resTextEl.textContent = res.text;
        // hide editor after saved
        editorEl.style.display = res.implemented ? 'none' : 'block';
      }

      preview.appendChild(node);
    });
  }

  // Handle clicks inside preview (delegation)
  preview.addEventListener('click', (e) => {
    const toggle = e.target.closest('.suggestion-toggle');
    if (toggle){
      const card = toggle.closest('.suggestion-card');
      const body = card.querySelector('.suggestion-body');
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded){
        body.hidden = true;
        toggle.setAttribute('aria-expanded','false');
        toggle.textContent = '+';
      } else {
        body.hidden = false;
        toggle.setAttribute('aria-expanded','true');
        toggle.textContent = '−';
      }
      return;
    }

    const saveBtn = e.target.closest('.save-resolution');
    if (saveBtn){
      const card = saveBtn.closest('.suggestion-card');
      const id = card.dataset.id;
      const textarea = card.querySelector('.resolution-input');
      const text = textarea.value.trim();
      if (!text) return alert('Please type a resolution before saving.');
      const resolutions = loadResolutions();
      resolutions[id] = resolutions[id] || {};
      resolutions[id].text = text;
      resolutions[id].implemented = resolutions[id].implemented || false;
      saveResolutions(resolutions);
      // update UI: show existing-resolution and hide editor
      const existing = card.querySelector('.existing-resolution');
      existing.hidden = false;
      card.querySelector('.resolution-text').textContent = text;
      // hide editor (still allow mark implemented separately)
      card.querySelector('.resolution-editor').style.display = 'none';
      return;
    }

    const markBtn = e.target.closest('.mark-implemented');
    if (markBtn){
      const card = markBtn.closest('.suggestion-card');
      const id = card.dataset.id;
      const resolutions = loadResolutions();
      resolutions[id] = resolutions[id] || {};
      resolutions[id].implemented = true;
      saveResolutions(resolutions);
      // Visual feedback: hide editor and mark resolution area
      card.querySelector('.resolution-editor').style.display = 'none';
      const existing = card.querySelector('.existing-resolution');
      existing.hidden = false;
      const resText = card.querySelector('.resolution-text');
      if (!resText.textContent) resText.textContent = 'Marked as implemented.';
      // Add small implemented badge
      if (!card.querySelector('.implemented-badge')){
        const badge = document.createElement('span');
        badge.className = 'implemented-badge';
        badge.textContent = 'Implemented';
        badge.style.marginLeft = '0.6rem';
        badge.style.color = '#16a34a';
        badge.style.fontWeight = '700';
        card.querySelector('.suggestion-meta').appendChild(badge);
      }
      return;
    }
  });

  // Render initially
  render();

  // If your app already saves suggestions via the form, this will pick them up.
  // If not, provide a tiny fallback to add form submissions to storage:
  const form = document.getElementById('suggestionForm');
  if (form){
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const dept = form.department?.value || '';
      const tag = form.tag?.value || '';
      const suggestion = form.suggestion?.value || '';
      const items = loadSuggestions();
      const id = String(Date.now());
      items.unshift({ id, department: dept, tag, suggestion, date: new Date().toLocaleString() });
      localStorage.setItem('suggestions', JSON.stringify(items));
      form.reset();
      render();
      // auto-open first item (the newly added)
      const firstToggle = preview.querySelector('.suggestion-toggle');
      if (firstToggle){ firstToggle.click(); }
    });
  }
})();


