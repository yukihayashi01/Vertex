document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.innerHTML = navLinks.classList.contains('active') ? '&times;' : '&#9776;';
        });
    }

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.innerHTML = '&#9776;';
            }
        });
    });

    // Sticky Navbar Effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth Scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // SCROLL ANIMATIONS
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    // PORTFOLIO FILTERING
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                projectCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                        card.style.display = 'block';
                        // Re-trigger animation
                        setTimeout(() => {
                            card.classList.add('show');
                        }, 100);
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('show');
                    }
                });
            });
        });
    }

    // CUSTOM CURSOR
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows immediately
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Outline follows with slight lag (animation handled by CSS transition usually, but can also use animate)
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Hover Effect
        const hoverables = document.querySelectorAll('a, button, .btn, .filter-btn, input, textarea');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.classList.remove('cursor-hover');
            });
        });
    }

    // PRELOADER
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
        });
    }

    // TYPEWRITER EFFECT
    const typeWriterElement = document.getElementById('typewriter');
    if (typeWriterElement) {
        const textArray = ["Web Design", "Branding", "UI/UX Design", "Motion Graphics"];
        const typingDelay = 100;
        const erasingDelay = 50;
        const newTextDelay = 2000;
        let textArrayIndex = 0;
        let charIndex = 0;

        function type() {
            if (charIndex < textArray[textArrayIndex].length) {
                if (!document.querySelector('.cursor').classList.contains('typing')) document.querySelector('.cursor').classList.add('typing');
                typeWriterElement.textContent += textArray[textArrayIndex].charAt(charIndex);
                charIndex++;
                setTimeout(type, typingDelay);
            } else {
                document.querySelector('.cursor').classList.remove('typing');
                setTimeout(erase, newTextDelay);
            }
        }

        function erase() {
            if (charIndex > 0) {
                if (!document.querySelector('.cursor').classList.contains('typing')) document.querySelector('.cursor').classList.add('typing');
                typeWriterElement.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
                charIndex--;
                setTimeout(erase, erasingDelay);
            } else {
                document.querySelector('.cursor').classList.remove('typing');
                textArrayIndex++;
                if (textArrayIndex >= textArray.length) textArrayIndex = 0;
                setTimeout(type, typingDelay + 1100);
            }
        }

        if (textArray.length) setTimeout(type, newTextDelay + 250);
    }

    // --- NEW: Button Ripple Effect ---
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            let x = e.clientX - e.target.getBoundingClientRect().left;
            let y = e.clientY - e.target.getBoundingClientRect().top;

            let ripples = document.createElement('span');
            ripples.style.left = x + 'px';
            ripples.style.top = y + 'px';
            ripples.classList.add('ripple');
            this.appendChild(ripples);

            setTimeout(() => {
                ripples.remove();
            }, 1000);
        });
    });

    // STATS COUNTER ANIMATION (With Live Data)
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    // Fetch live stats if DB is available
    if (typeof db !== 'undefined') {
        db.collection('site_stats').doc('global').get().then(doc => {
            if (doc.exists) {
                const data = doc.data();

                // Use IDs if available, fallback to legacy attributes for existing pages if needed (or just IDs)
                const projects = document.getElementById('counter-projects') || document.querySelector('.counter[data-target="150"]');
                if (projects) projects.setAttribute('data-target', data.projects ?? 150);

                const satisfaction = document.getElementById('counter-satisfaction') || document.querySelector('.counter[data-target="98"]');
                if (satisfaction) satisfaction.setAttribute('data-target', data.satisfaction ?? 98);

                // Fix mismatch: check for ID first, or legacy 12/15 values
                const awards = document.getElementById('counter-awards') || document.querySelector('.counter[data-target="12"]') || document.querySelector('.counter[data-target="15"]');
                if (awards) awards.setAttribute('data-target', data.awards ?? 15);

                const experience = document.getElementById('counter-experience');
                if (experience) experience.setAttribute('data-target', data.experience ?? 5);

                startCounters();
            } else {
                startCounters();
            }
        }).catch(err => {
            console.log("Could not load stats", err);
            startCounters();
        });
    } else {
        startCounters();
    }

    function startCounters() {
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = +counter.getAttribute('data-target');

                    const updateCount = () => {
                        const count = +counter.innerText.replace(/\D/g, '');
                        const inc = Math.ceil(target / speed);

                        if (count < target) {
                            let displayVal = count + inc;
                            if (displayVal > target) displayVal = target;
                            counter.innerText = displayVal;
                            setTimeout(updateCount, 20);
                        } else {
                            counter.innerText = target;
                            if (counter.closest('.stat-item').innerText.includes('Satisfaction')) counter.innerText += "%";
                            if (counter.closest('.stat-item').innerText.includes('Projects')) counter.innerText += "+";
                        }
                    };
                    updateCount();
                    observer.unobserve(counter);
                }
                // (Carousel logic removed from here)

            });
        }, { threshold: 0.5 });

        counters.forEach(counter => counterObserver.observe(counter));
    }

    // --- Testimonial Carousel Logic (Global) ---
    // document.addEventListener logic merged with main listener
    const track = document.querySelector('.testimonial-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.querySelector('.carousel-btn.next');
        const prevButton = document.querySelector('.carousel-btn.prev');
        const dotsNav = document.querySelector('.carousel-nav');
        const dots = Array.from(dotsNav.children);

        // Adjust for styling: "Waiting to come" peek effect
        // We will show 3 slides? Or just rely on smooth transition.
        // User requested: "sliding animation like the other two reviews should be like waiting to come"
        // This usually means a "center mode" or "peek" where you see edges.
        // CSS in index.html should handle the `flex-basis`.
        // Here we just ensure logic supports arbitrary width.

        let slideWidth = slides[0].getBoundingClientRect().width;

        // Update width on resize
        window.addEventListener('resize', () => {
            slideWidth = slides[0].getBoundingClientRect().width;
            // Re-center current slide?
        });

        const moveToSlide = (track, currentSlide, targetSlide) => {
            const targetIndex = slides.indexOf(targetSlide);
            // TranslateX calculation depends on if we want center mode.
            // For simple full-width or strictly configured peek:
            track.style.transform = 'translateX(-' + targetIndex * 100 + '%)';

            currentSlide.classList.remove('current-slide');
            targetSlide.classList.add('current-slide');
        };

        const updateDots = (currentDot, targetDot) => {
            currentDot.classList.remove('current-slide');
            currentDot.style.background = 'rgba(255,255,255,0.3)';
            targetDot.classList.add('current-slide');
            targetDot.style.background = 'var(--accent-color)';
        };

        slides[0].classList.add('current-slide');
        dots[0].classList.add('current-slide');

        // Handlers
        nextButton.addEventListener('click', () => {
            const currentSlide = track.querySelector('.current-slide');
            const nextSlide = currentSlide.nextElementSibling || slides[0];
            const currentDot = dotsNav.querySelector('.current-slide');
            const nextDot = dots[slides.indexOf(nextSlide)];
            moveToSlide(track, currentSlide, nextSlide);
            updateDots(currentDot, nextDot);
            resetAutoPlay();
        });

        prevButton.addEventListener('click', () => {
            const currentSlide = track.querySelector('.current-slide');
            const prevSlide = currentSlide.previousElementSibling || slides[slides.length - 1];
            const currentDot = dotsNav.querySelector('.current-slide');
            const prevDot = dots[slides.indexOf(prevSlide)];
            moveToSlide(track, currentSlide, prevSlide);
            updateDots(currentDot, prevDot);
            resetAutoPlay();
        });

        dotsNav.addEventListener('click', e => {
            const targetDot = e.target.closest('button');
            if (!targetDot) return;
            const currentSlide = track.querySelector('.current-slide');
            const currentDot = dotsNav.querySelector('.current-slide');
            const targetIndex = dots.findIndex(dot => dot === targetDot);
            const targetSlide = slides[targetIndex];
            moveToSlide(track, currentSlide, targetSlide);
            updateDots(currentDot, targetDot);
            resetAutoPlay();
        });

        let autoPlayInterval = setInterval(autoAdvance, 5000);

        function autoAdvance() {
            const currentSlide = track.querySelector('.current-slide');
            const nextSlide = currentSlide.nextElementSibling || slides[0];
            const currentDot = dotsNav.querySelector('.current-slide');
            const nextDot = dots[slides.indexOf(nextSlide)];
            moveToSlide(track, currentSlide, nextSlide);
            updateDots(currentDot, nextDot);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(autoAdvance, 5000);
        }
    }
});
