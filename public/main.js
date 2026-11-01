document.addEventListener('DOMContentLoaded', () => {
    // Reveal animations on scroll
    const reveals = document.querySelectorAll('.reveal, .feature-card, .step, .how-it-works');
    
    // Add reveal class to cards and steps for consistent animation
    reveals.forEach(el => el.classList.add('reveal'));

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        reveals.forEach(el => {
            const revealTop = el.getBoundingClientRect().top;
            const revealPoint = 150;

            if (revealTop < windowHeight - revealPoint) {
                el.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    
    // Initial check
    revealOnScroll();

    // Skeleton mientras cargan las imágenes
    document.querySelectorAll('.product-img, .gallery-main, .why-image').forEach(box => {
        box.classList.add('skeleton');
        box.querySelectorAll('img').forEach(img => {
            const done = () => box.classList.remove('skeleton');
            if (img.complete && img.naturalWidth) {
                done();
            } else {
                img.addEventListener('load', done);
                img.addEventListener('error', done);
            }
        });
    });

    // Smooth header appearance
    const header = document.querySelector('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll <= 0) {
            header.style.boxShadow = 'none';
        } else {
            header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
        }
        lastScroll = currentScroll;
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all items
            faqItems.forEach(faq => faq.classList.remove('active'));
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
});
