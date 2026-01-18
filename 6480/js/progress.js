// Reading Progress Tracker
document.addEventListener('DOMContentLoaded', function () {
    // Only run on content pages (not homepage)
    if (!document.querySelector('.reading-progress')) return;

    const progressBar = document.querySelector('.reading-progress-bar');
    const percentageDisplay = document.querySelector('.reading-percentage');

    function updateProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const percentage = Math.min(Math.round((scrolled / documentHeight) * 100), 100);

        progressBar.style.width = percentage + '%';
        percentageDisplay.textContent = percentage + '% Read';

        // Change color when complete
        if (percentage >= 100) {
            percentageDisplay.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)';
            percentageDisplay.textContent = '✅ 100% Complete!';
        } else {
            percentageDisplay.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
    }

    // Update on scroll
    window.addEventListener('scroll', updateProgress);

    // Initial update
    updateProgress();
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Active navigation highlighting
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
