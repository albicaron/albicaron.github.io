document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const navLinks = document.querySelectorAll('.nav-links a');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    const backToTopBtn = document.getElementById('back-to-top');
    const sections = document.querySelectorAll('section');
    
    // --- Theme Management ---
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        body.setAttribute('data-theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
    }

    themeToggle.addEventListener('click', () => {
        if (body.getAttribute('data-theme') === 'dark') {
            body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // --- Navigation & Scroll Spy ---
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                // Remove active from all
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Mobile Menu
    mobileMenuBtn.addEventListener('click', () => {
        navLinksContainer.classList.toggle('open');
        mobileMenuBtn.textContent = navLinksContainer.classList.contains('open') ? '✕' : '☰';
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinksContainer.classList.contains('open')) {
                navLinksContainer.classList.remove('open');
                mobileMenuBtn.textContent = '☰';
            }
        });
    });

    // Back to Top
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Section Animations ---
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        threshold: 0.15
    });

    document.querySelectorAll('.fade-in-section').forEach(section => {
        revealObserver.observe(section);
    });

    // --- Publications Manager ---
    loadPublications();

    async function loadPublications() {
        const listContainer = document.getElementById('publication-list');
        if (!listContainer) return;

        try {
            const response = await fetch('data/publications.json');
            if (!response.ok) throw new Error('Failed to load publications');
            
            const publications = await response.json();
            
            // Initial Render
            renderPublications(publications);
            
            // Setup Filters
            setupFilters(publications);
            
        } catch (error) {
            console.error('Error:', error);
            listContainer.innerHTML = '<p>Error loading publications. Please try again later.</p>';
        }
    }

    function renderPublications(pubs) {
        const listContainer = document.getElementById('publication-list');
        listContainer.innerHTML = '';

        if (pubs.length === 0) {
            listContainer.innerHTML = '<p class="text-muted">No publications found matching your criteria.</p>';
            return;
        }

        pubs.forEach(pub => {
            const card = document.createElement('div');
            card.className = 'pub-card';
            
            const link = pub.url && pub.url !== '#' ? `<a href="${pub.url}" target="_blank" rel="noopener">Link ↗</a>` : `<span>(Link coming soon)</span>`;

            card.innerHTML = `
                <div class="pub-title">${pub.title}</div>
                <div class="pub-authors">${pub.authors.join(', ')}</div>
                <div class="pub-meta">
                    <span class="pub-venue">${pub.venue}</span>
                    <span class="pub-year">${pub.year}</span>
                    <div class="pub-links">${link}</div>
                </div>
            `;
            listContainer.appendChild(card);
        });
    }

    function setupFilters(allPubs) {
        const searchInput = document.getElementById('pub-search');
        const yearFilterContainer = document.getElementById('year-filter');
        
        // Extract unique years
        const years = [...new Set(allPubs.map(p => p.year))].sort((a, b) => b - a);
        
        // Create All chip
        const allChip = document.createElement('button');
        allChip.className = 'year-chip active';
        allChip.textContent = 'All';
        allChip.dataset.year = 'all';
        yearFilterContainer.appendChild(allChip);
        
        // Create year chips
        years.forEach(year => {
            const chip = document.createElement('button');
            chip.className = 'year-chip';
            chip.textContent = year;
            chip.dataset.year = year;
            yearFilterContainer.appendChild(chip);
        });

        // Filter Logic
        let activeYear = 'all';
        let searchQuery = '';

        function filter() {
            const filtered = allPubs.filter(pub => {
                const matchesYear = activeYear === 'all' || pub.year === parseInt(activeYear);
                const query = searchQuery.toLowerCase();
                const matchesSearch = 
                    pub.title.toLowerCase().includes(query) || 
                    pub.authors.some(a => a.toLowerCase().includes(query)) ||
                    pub.venue.toLowerCase().includes(query);
                return matchesYear && matchesSearch;
            });
            renderPublications(filtered);
        }

        // Event Listeners
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            filter();
        });

        yearFilterContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('year-chip')) {
                // Update UI
                document.querySelectorAll('.year-chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update State
                activeYear = e.target.dataset.year;
                filter();
            }
        });
    }
});
