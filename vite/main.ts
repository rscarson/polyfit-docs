import './style.css'

import basis from './data/basis.json';

let currentPage = updateSidebar();
navigateTo(currentPage);

let basisData = loadBasis();

function navigateTo(path: string) {
    // We don't need to update the history - this is run on page load (static site)
    const app = document.querySelector<HTMLDivElement>('#app')!;
    fetch(path)
        .then(res => {
            if (!res.ok) throw new Error(`Could not load ${path}`);
            return res.text();
        })
        .then(html => {
            // Vite won't 404 so we check for a sentinel comment as the start of valid pages
            if (!html.includes('<!-- SENTINEL -->')) {
                throw new Error(`Page not found: ${path}`);
            }

            app.innerHTML = html;
            scrollToAnchor(window.location.hash);
        })
        .catch(err => {
            app.innerHTML = `
                <div class="d-flex flex-column justify-content-center align-items-center text-center py-5">
                <div class="alert alert-danger shadow-sm w-75" role="alert">
                    <h4 class="alert-heading"><i class="bi bi-exclamation-triangle-fill me-2"></i>Error loading page</h4>
                    <p>${err.message}</p>
                    <hr>
                    <p class="mb-0">Please try refreshing the page or check back later.</p>
                </div>
                <a href="/" class="btn btn-primary mt-3">Go Home</a>
                </div>
            `;

            console.error(err);
        });
}

function scrollToAnchor(anchor: string) {
    if (!anchor) return;

    let anchorElement = document.querySelector(anchor);

    // If the anchor has a parent with the 'accordion-collapse' class, expand it by adding the 'show' class
    if (anchorElement) {
        let parent = anchorElement.parentElement;
        while (parent) {
            if (parent.classList.contains('accordion-collapse') && !parent.classList.contains('show')) {
                parent.classList.add('show');
            }
            parent = parent.parentElement;
        }
    }

    anchorElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

    anchorElement?.classList.add('highlight');
}

// Updates the link status of the sidebar based on the current path
// Returns the filename of the current page
function updateSidebar(): string {
    const currentPath = window.location.pathname;

    document.querySelectorAll<HTMLAnchorElement>('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });

    let sectionFile = currentPath === '/' || currentPath === '/index.html' || currentPath === '' || currentPath === '/home'
        ? '/src/sections/home'
        : `/src/sections/${currentPath.split('/').pop()}`;

    return sectionFile;
}

function replaceContentLinks(input: string): string {
    // (page#tag)[Name] -> <a href="/page#tag">Name</a>
    // (page#tag) -> <a href="/page#tag">page#tag</a>
    const pageLinkRegex = /\((?<page>[a-zA-Z0-9_\-\/]+)#(?<anchor>[a-zA-Z0-9_\-\/]+)\)(\[(?<display>[^\]]+)\])?/g;
    input = input.replace(pageLinkRegex, (_, page, anchor, __, display) => {
        const linkText = display || `${page}#${anchor}`;
        return `<a href="/${page}#${anchor}">${linkText}</a>`;
    });

    // [CurveFit::spectral_energy_filter] -> https://docs.rs/polyfit/latest/polyfit/index.html?search=polyfit%3A%3ACurveFit%3A%3Aspectral_energy_filter
    const docsLinkRegex = /\[(?<path>[^\]]+)\]/g
    input = input.replace(docsLinkRegex, (_, path) => {
        path = path.trim().replace(/::/g, '%3A%3A');
        const url = `https://docs.rs/polyfit/latest/polyfit/index.html?search=polyfit%3A%3A${path}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${path.replace(/%3A%3A/g, '::')}</a>`;
    });

    return input;
}

function loadBasis() {
    // In desc, desc_full or any features, replace glossary terms with links
    basis.forEach((item: any) => {
        item.desc = item.desc.map((feature: string) => replaceContentLinks(feature));
        item.desc_full = item.desc_full.map((feature: string) => replaceContentLinks(feature));
        for (const key in item.features) {
            item.features[key] = replaceContentLinks(item.features[key]);
        }
    });

        console.log(document.querySelectorAll<HTMLElement>('.home-basis'));
    document.querySelectorAll<HTMLElement>('#home-basis').forEach(container => {
        // Clear existing content
        container.innerHTML = '';
        
        // Populate with basis data
        /*
        <li>
            <a class="card h-100 p-3 text-decoration-none d-block">
                <h3 class="h5 mb-2 placeholder-glow">
                    <span class="placeholder col-3"></span>
                </h3>
                <p class="text-muted small mb-0 placeholder-glow">
                    <span class="placeholder col-6"></span>
                </p>
                <p class="text-muted small mb-0 placeholder-glow">
                    <span class="placeholder col-6"></span>
                </p>
            </a>
        </li>
        */
        basis.forEach((item: any) => {
            const listItem = document.createElement('li');
            const cardLink = document.createElement('a');
            cardLink.className = 'card h-100 p-3 text-decoration-none d-block';
            cardLink.href = `/basis/${item.id}`;

            const title = document.createElement('h3');
            title.className = 'h5 mb-2';
            title.innerText = item.name;

            // Descriptions (short) one per entry in the desc array
            // theres no container just p
            for (const descText of item.desc) {
                const desc = document.createElement('p');
                desc.className = 'text-muted small mb-0';
                desc.innerHTML = descText;
                cardLink.appendChild(desc);
            }

            cardLink.prepend(title);
            listItem.appendChild(cardLink);
            container.appendChild(listItem);
        });
    });

    return basis;
}