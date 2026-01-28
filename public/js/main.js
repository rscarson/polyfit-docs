// Toggle sidebar visibility on button click
const toggleBtn = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('nav');
toggleBtn?.addEventListener('click', () => {
  sidebar?.classList.toggle('show');
});

const originalTitle = document.title;

/// On input in the glossary search box, filter glossary items
function glossarySearch(filterElement) {
    const filter = filterElement.value.toLowerCase();
    document.querySelectorAll('.accordion-item').forEach(item => {
        const accordionBody = item.querySelector('.accordion-collapse');
        const collapse = bootstrap.Collapse.getOrCreateInstance(accordionBody, {toggle: false});
        const cards = item.querySelectorAll('.card');
        const text = item.textContent.toLowerCase();

        if (!text.includes(filter) || filter.length < 3) {
            collapse.hide();

            // Remove borders from all cards
            cards.forEach(card => {
                card.style.border = '';
            });
        } else {
            collapse.show();

            // Highlight matching cards
            cards.forEach(card => {
                if (card.textContent.toLowerCase().includes(filter) && filter.length > 0) {
                    card.style.border = '2px solid orange';
                } else {
                    card.style.border = '';
                }
            });
        }
    });
}

// Glossary search event listener
document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('glossary-search');
    search?.addEventListener('keyup', (e) => glossarySearch(e.target));

    // On enter, scroll to first highlighted item
    search?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const firstHighlight = document.querySelector('.card[style*="border: 2px solid orange"]');
            if (firstHighlight) {
                firstHighlight.scrollIntoView({behavior: 'smooth', block: 'center'});
            }
        }
    }); 
});

// Scroll to anchor and highlight it
function scrollToAnchor(anchor, no_scroll = false) {
    if (!anchor) return;

    let anchorElement = document.querySelector(anchor);
    if (!anchorElement) return;

    // If the anchor has a parent with the 'accordion-collapse' class, expand it by adding the 'show' class
    if (anchorElement) {
        let parent = anchorElement;
        while (parent) {
            if (parent.classList.contains('accordion-collapse') && !parent.classList.contains('show')) {
                const collapse = bootstrap.Collapse.getOrCreateInstance(parent, {toggle: false});
                collapse.show();
            }

            const p = parent.parentElement;
            parent = p;
        }
    }

    document.querySelectorAll('.highlight').forEach(el => {
        el.classList.remove('highlight');
    });

    if (!anchorElement.classList.contains('no-highlight')) {
        anchorElement.classList.add('highlight');
    }

    let titlePrefix = anchorElement.getAttribute('data-title');
    if (titlePrefix) {
        document.title = `${titlePrefix} | Polyfit`;
    }

    // Set URL hash without jumping
    history.replaceState(null, '', anchor);

    // We actually want to scroll to slightly above the element, around 60px offset
    const elementPosition = anchorElement.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - 60;

    // Smooth scroll to the position after the animation finishes
    if (no_scroll) return;
    setTimeout(() => {
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }, 300);
}

function scrollToHighlight(e) {
    const target = e.target;
    const hash = `#${target.id}`;

    e.preventDefault();
    scrollToAnchor(hash);
}

function scrollToHash(no_scroll = false) {
    const hash = window.location.hash;
    if (!hash) return;
    return scrollToAnchor(hash, no_scroll);
}

// Highlight anchor from URL hash on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add a click listener to all elements with the 'can-highlight' class
    // This just makes same-page anchor refresh the page and re-scroll
    const search = document.getElementsByClassName('can-highlight');
    for (let i = 0; i < search.length; i++) {
        const element = search[i];
        element.addEventListener('click', scrollToHighlight);
    }

    // Link overide so that even same-page hash links activate the scroll and highlight function
    document.querySelectorAll('.pagelink').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            setTimeout(() => {
                scrollToHash();
            }, 100);
        });
    });

    // All loaded recipe cards need to be able to connect to the hash system too
    const accordions = document.querySelectorAll('.recipe-card');    
    accordions.forEach(btn => {
        const targetId = btn.getAttribute('data-bs-target')?.replace('#', '');
        if (!targetId) return;

        const sectionEl = document.getElementById(targetId);
        if (!sectionEl) return;

        sectionEl.addEventListener('shown.bs.collapse', () => {
            if (location.hash.startsWith('#' + targetId)) return;
            history.replaceState(null, '', '#' + targetId);

            let titlePrefix = sectionEl.getAttribute('data-title');
            if (titlePrefix) {
                document.title = `${titlePrefix} | Polyfit`;
            }
        });

        sectionEl.addEventListener('hidden.bs.collapse', () => {
            history.replaceState(null, '', ' ');
            document.title = originalTitle;
        });
    });

    const y = window.scrollY || document.documentElement.scrollTop;
    let no_scroll = y > 0;
    scrollToHash(no_scroll);
});

// Initialize Bootstrap tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

// Initialize Bootstrap popovers
document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
    let title = el.title;
    new bootstrap.Popover(el, {
        trigger: 'click',
        html: true,
        placement: 'auto',
    });

    // Add a hover tooltip to indicate clickability
    el.title = title ?? 'Click for more info';
});
document.addEventListener('click', (e) => {
document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
    const pop = bootstrap.Popover.getInstance(el);
    if (pop && !el.contains(e.target) && !document.querySelector('.popover')?.contains(e.target)) {
    pop.hide();
    }
});
});