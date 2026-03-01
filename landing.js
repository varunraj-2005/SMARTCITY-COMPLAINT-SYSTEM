/* ==========================================
   GENAI AUTORESQ - LANDING PAGE SCRIPT
   ========================================== */

// Navigation function
function navigateTo(page) {
    window.location.href = page;
}

// Smooth scroll effect for navigation links
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

// Add scroll animation effect
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all feature cards and sections
document.querySelectorAll('.feature-card, .about-section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Button hover glow effect
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 20px 50px rgba(245, 166, 35, 0.6)';
    });
    
    button.addEventListener('mouseleave', function() {
        if (this.classList.contains('btn-primary')) {
            this.style.boxShadow = '0 10px 30px rgba(245, 166, 35, 0.3)';
        }
    });
});

// Log page load
console.log('🚗 GenAI AutoResQ Landing Page Loaded');
console.log('Officer Portal: /officer.html');
console.log('Citizen Portal: /citizen.html');

// Dynamic wave animation adjustment based on scroll
let lastScrollY = 0;
window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    
    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && lastScrollY < window.innerHeight) {
        heroSection.style.backgroundPosition = `0 ${lastScrollY * 0.5}px`;
    }
});

// Add smooth fade in for page load
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.6s ease';
setTimeout(() => {
    document.body.style.opacity = '1';
}, 100);

// Active navigation link indicator
const navLinks = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.style.color = '#F5A623';
        } else {
            link.style.color = '';
        }
    });
});
