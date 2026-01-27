import api from '../data/api.json';
import { MdParser, titleToId } from './markdown.ts';

import Tutorials from '../data/tutorials.json';
import Glossary from '../data/glossary.json';

import fs from 'fs';
import path from 'path';

export function includeAPI(sourceURL: string) {
    let apiClone = JSON.parse(JSON.stringify(api));
    const parser = new MdParser(sourceURL);

    for (let key in apiClone) {
        apiClone[key].id = key;
        
        let refs = apiClone[key].refs;
        let refLinks: any[] = [];
        for (let ref of apiClone[key].refs) {
            let md = `[[${ref}]]`;
            let link: any = parser.parse(md)[0];
            link = link.content[0];
            refLinks.push(link);
        }
        apiClone[key].refs = refLinks;

        let relatedTutorials: any[] = [];
        for (let tutorialKey of apiClone[key].tutorials) {
            let category = 'general';
            if (tutorialKey.startsWith('testing/')) {
                category = 'testing';
                tutorialKey = tutorialKey.replace('testing/', '');
            }

            let tutorial_src = Tutorials[category].find((r: any) => titleToId(r.title) === tutorialKey);
            let tutorial = {
                url: `/${category}#${tutorialKey}`,
                title: tutorial_src?.title || tutorialKey
            }
            relatedTutorials.push(tutorial);

            if (!tutorial_src) {
                console.warn(`Warning: Tutorial "${tutorialKey}" not found for API "${key}"`);
            }
        }
        apiClone[key].related_tutorials = relatedTutorials;

        let relatedGlossary: any[] = [];
        for (let termKey of apiClone[key].glossary_terms) {
            let term_src = Glossary[termKey];
            let term = {
                url: `/glossary#${termKey}`,
                term: term_src?.name || termKey
            }
            relatedGlossary.push(term);

            if (!term_src) {
                console.warn(`Warning: Glossary term "${termKey}" not found for API "${key}"`);
            }
        }
        apiClone[key].related_glossary = relatedGlossary;
    }

    Object.values(apiClone).forEach((section: any) => {
        // if file doesn't exist, create an empty one
        const fullPath = path.resolve('./src', path.join('data', 'api_docs', section.mdfile));
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, `# ${section.title}\n\nContent coming soon!`);
        }

        section.content = parser.parseFile(fullPath);
    });
    
    return Object.values(apiClone);
}