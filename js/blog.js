/**
 * Blog System JavaScript v3
 * Features: search debounce, URL sync, bookmarks, TOC, filter state
 */

(function() {
    'use strict';

    // ===== Theme Toggle =====
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        themeToggle.addEventListener('click', () => {
            const isDark = body.getAttribute('data-theme') === 'dark';
            if (isDark) {
                body.removeAttribute('data-theme');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('theme', 'light');
            } else {
                body.setAttribute('data-theme', 'dark');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // ===== Mobile Menu =====
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }

    // ===== Reading Progress =====
    const progressContainer = document.querySelector('.reading-progress-container');
    const progressBar = document.querySelector('.reading-progress-bar');
    const articleNav = document.querySelector('.blog-article-nav');

    if (progressBar && progressContainer) {
        progressContainer.classList.add('visible');
        function updateProgress() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = Math.min(progress, 100) + '%';

            if (articleNav) {
                if (scrollTop > 200) {
                    articleNav.classList.add('scrolled');
                } else {
                    articleNav.classList.remove('scrolled');
                }
            }
        }
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    // ===== Toast =====
    function showToast(message) {
        let toast = document.querySelector('.blog-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'blog-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ===== Save for Later / Bookmarks =====
    function getSavedPosts() {
        try {
            return JSON.parse(localStorage.getItem('savedPosts') || '[]');
        } catch(e) { return []; }
    }

    function setSavedPosts(posts) {
        localStorage.setItem('savedPosts', JSON.stringify(posts));
    }

    function isSaved(slug) {
        return getSavedPosts().includes(slug);
    }

    function toggleBookmark(slug) {
        const saved = getSavedPosts();
        const idx = saved.indexOf(slug);
        if (idx === -1) {
            saved.push(slug);
            showToast('Saved to reading list');
        } else {
            saved.splice(idx, 1);
            showToast('Removed from reading list');
        }
        setSavedPosts(saved);
        return idx === -1;
    }

    function updateBookmarkButtons() {
        const saved = getSavedPosts();
        document.querySelectorAll('.bookmark-btn').forEach(btn => {
            const slug = btn.dataset.slug;
            if (saved.includes(slug)) {
                btn.classList.add('saved');
                btn.querySelector('i').classList.replace('far', 'fas');
            } else {
                btn.classList.remove('saved');
                btn.querySelector('i').classList.replace('fas', 'far');
            }
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.bookmark-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const slug = btn.dataset.slug;
        const saved = toggleBookmark(slug);
        if (saved) {
            btn.classList.add('saved');
            btn.querySelector('i').classList.replace('far', 'fas');
        } else {
            btn.classList.remove('saved');
            btn.querySelector('i').classList.replace('fas', 'far');
        }
    });

    // Initialize bookmark states on load
    updateBookmarkButtons();

    // ===== Reading List Page =====
    const readingListGrid = document.getElementById('readingListGrid');
    if (readingListGrid) {
        const saved = getSavedPosts();
        const readingCount = document.getElementById('readingCount');
        const readingEmpty = document.getElementById('readingEmpty');

        if (readingCount) {
            readingCount.innerHTML = `<i class="fas fa-bookmark"></i> ${saved.length} saved`;
        }

        if (saved.length === 0) {
            if (readingEmpty) readingEmpty.style.display = 'block';
        } else {
            if (readingEmpty) readingEmpty.style.display = 'none';
            // Fetch saved posts from the grid items on the main blog page
            // We need to build them from data attributes stored in the listing page
            // For simplicity, we fetch from the listing page or build from stored data
            // Since we can't fetch the listing synchronously, we'll store post data in localStorage
            // Or we can fetch the listing page and extract the data
            
            // Better approach: store minimal post data when bookmarking
            const allPostData = JSON.parse(localStorage.getItem('postData') || '{}');
            // Only allow simple slug characters in the URL path so an attacker
            // who pollutes localStorage cannot inject arbitrary URLs.
            const safeSlug = (s) => /^[a-zA-Z0-9_\-]+$/.test(s) ? s : null;
            saved.forEach(slug => {
                const data = allPostData[slug];
                const normSlug = safeSlug(slug);
                if (!data || !normSlug) return;

                const card = document.createElement('div');
                card.className = 'blog-grid-item';

                const article = document.createElement('article');
                article.className = 'blog-post-card';

                // header
                const header = document.createElement('div');
                header.className = 'card-header';
                const meta = document.createElement('div');
                meta.className = 'card-meta';
                const dateSpan = document.createElement('span');
                dateSpan.textContent = data.date || '';
                const timeSpan = document.createElement('span');
                timeSpan.className = 'reading-time';
                const clockIcon = document.createElement('i');
                clockIcon.className = 'far fa-clock';
                timeSpan.appendChild(clockIcon);
                timeSpan.appendChild(document.createTextNode(' ' + (data.reading_time || '')));
                meta.appendChild(dateSpan);
                meta.appendChild(timeSpan);
                const h2 = document.createElement('h2');
                const titleLink = document.createElement('a');
                titleLink.href = `/blog/${normSlug}/`;
                titleLink.textContent = data.title || '';
                h2.appendChild(titleLink);
                header.appendChild(meta);
                header.appendChild(h2);

                // excerpt
                const excerpt = document.createElement('p');
                excerpt.className = 'card-excerpt';
                excerpt.textContent = data.excerpt || '';

                // footer
                const footer = document.createElement('div');
                footer.className = 'card-footer';
                const tagsWrap = document.createElement('div');
                tagsWrap.className = 'card-tags';
                if (data.tags) {
                    String(data.tags).split(',').forEach(t => {
                        const tag = document.createElement('span');
                        tag.className = 'tag';
                        tag.textContent = t;
                        tagsWrap.appendChild(tag);
                    });
                }
                const actions = document.createElement('div');
                actions.className = 'card-actions';
                const bookmarkBtn = document.createElement('button');
                bookmarkBtn.className = 'bookmark-btn saved';
                bookmarkBtn.dataset.slug = normSlug;
                bookmarkBtn.title = 'Remove from saved';
                bookmarkBtn.setAttribute('aria-label', `Remove ${data.title || ''} from saved`);
                const bmIcon = document.createElement('i');
                bmIcon.className = 'fas fa-bookmark';
                bookmarkBtn.appendChild(bmIcon);
                const readLink = document.createElement('a');
                readLink.href = `/blog/${normSlug}/`;
                readLink.className = 'read-link';
                readLink.appendChild(document.createTextNode('Read '));
                const arrowIcon = document.createElement('i');
                arrowIcon.className = 'fas fa-arrow-right';
                readLink.appendChild(arrowIcon);
                actions.appendChild(bookmarkBtn);
                actions.appendChild(readLink);
                footer.appendChild(tagsWrap);
                footer.appendChild(actions);

                article.appendChild(header);
                article.appendChild(excerpt);
                article.appendChild(footer);
                card.appendChild(article);
                readingListGrid.appendChild(card);
            });
        }
    }

    // ===== Store post data when bookmarking =====
    document.querySelectorAll('.blog-grid-item').forEach(item => {
        const slug = item.dataset.slug;
        const title = item.querySelector('h2 a')?.textContent || '';
        const excerpt = item.querySelector('.card-excerpt')?.textContent || '';
        const date = item.dataset.date;
        const tags = item.dataset.tags;
        const reading_time = item.querySelector('.reading-time')?.textContent.replace('⏱ ', '') || '5 min';

        // Store for reading list
        const allData = JSON.parse(localStorage.getItem('postData') || '{}');
        allData[slug] = { title, excerpt, date, tags, reading_time };
        localStorage.setItem('postData', JSON.stringify(allData));
    });

    // ===== Search with Debounce + URL Sync =====
    const searchInput = document.getElementById('blogSearch');
    const sortBtns = document.querySelectorAll('.blog-filter-btn[data-sort]');
    const tagChips = document.querySelectorAll('.blog-tag-chip');
    const gridItems = document.querySelectorAll('.blog-grid-item');
    const emptyState = document.querySelector('.blog-empty-state');

    let currentSort = 'newest';
    let currentTag = 'all';
    let searchQuery = '';
    let searchTimeout = null;

    function filterAndSort() {
        let visibleCount = 0;
        const items = Array.from(gridItems);

        items.forEach(item => {
            const title = item.dataset.title || '';
            const excerpt = item.dataset.excerpt || '';
            const tags = (item.dataset.tags || '').split(',').filter(Boolean);

            const matchesSearch = !searchQuery ||
                title.toLowerCase().includes(searchQuery) ||
                excerpt.toLowerCase().includes(searchQuery);

            const matchesTag = currentTag === 'all' || tags.includes(currentTag);

            if (matchesSearch && matchesTag) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        const visibleItems = items.filter(item => item.style.display !== 'none');
        const grid = document.querySelector('.blog-grid');
        if (grid) {
            visibleItems.forEach(item => grid.appendChild(item));
            if (currentSort === 'oldest') {
                visibleItems.reverse();
                visibleItems.forEach(item => grid.appendChild(item));
            }
        }

        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        // Update URL without reloading
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (currentTag !== 'all') params.set('tag', currentTag);
        if (currentSort !== 'newest') params.set('sort', currentSort);
        
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = e.target.value.toLowerCase().trim();
                filterAndSort();
            }, 200);
        });
    }

    sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sortBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            filterAndSort();
        });
    });

    // Tag chips - allow direct href navigation or JS filtering
    // Only attach click handler if not navigating away
    tagChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            // Check if this is a category page (has href with /blog/?tag=)
            const href = chip.getAttribute('href');
            if (href && href.includes('?tag=')) {
                // Let the browser navigate
                return;
            }
            e.preventDefault();
            const tag = chip.dataset.tag;
            if (currentTag === tag) {
                currentTag = 'all';
                tagChips.forEach(c => c.classList.remove('active'));
                document.querySelector('.blog-tag-chip[data-tag="all"]')?.classList.add('active');
            } else {
                currentTag = tag;
                tagChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            }
            filterAndSort();
        });
    });

    // ===== Read URL params on load =====
    function readUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        const tag = params.get('tag');
        const sort = params.get('sort');

        if (q && searchInput) {
            searchInput.value = q;
            searchQuery = q.toLowerCase().trim();
        }

        if (tag) {
            currentTag = tag;
            tagChips.forEach(c => c.classList.remove('active'));
            const match = document.querySelector(`.blog-tag-chip[data-tag="${CSS.escape(tag)}"]`);
            if (match) match.classList.add('active');
        }

        if (sort) {
            currentSort = sort;
            sortBtns.forEach(b => b.classList.remove('active'));
            const match = document.querySelector(`.blog-filter-btn[data-sort="${CSS.escape(sort)}"]`);
            if (match) match.classList.add('active');
        }

        if (q || tag || sort) {
            filterAndSort();
        }
    }
    readUrlParams();

    // ===== Share Buttons =====
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const platform = btn.dataset.platform;
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title);

            if (platform === 'twitter') {
                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
            } else if (platform === 'linkedin') {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
            } else if (platform === 'copy') {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    showToast('Link copied to clipboard');
                }).catch(() => {
                    showToast('Failed to copy link');
                });
            }
        });
    });

    // ===== Scroll to Top =====
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }, { passive: true });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Navbar Scroll =====
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // ===== TOC Toggle (mobile) =====
    const tocToggle = document.querySelector('.toc-toggle');
    const tocPanel = document.querySelector('.toc-panel');
    if (tocToggle && tocPanel) {
        tocToggle.addEventListener('click', () => {
            const isOpen = tocPanel.classList.toggle('open');
            tocToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    // ===== Smooth scroll for TOC links =====
    document.querySelectorAll('.toc-sidebar a, .toc-panel a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offset = target.getBoundingClientRect().top + window.pageYOffset - 80;
                    window.scrollTo({ top: offset, behavior: 'smooth' });
                    // Close mobile TOC
                    if (tocPanel) tocPanel.classList.remove('open');
                    if (tocToggle) tocToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });

})();
