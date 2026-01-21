import api from '../data/api.json';
import { MdParser, titleToId } from './markdown.ts';

import Recipes from '../data/recipes.json';
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

        let relatedRecipes: any[] = [];
        for (let recipeKey of apiClone[key].recipes) {
            let recipe_src = Recipes['general'].find((r: any) => titleToId(r.title) === recipeKey);
            let recipe = {
                url: `/recipes#${recipeKey}`,
                title: recipe_src?.title || recipeKey
            }
            relatedRecipes.push(recipe);
        }
        apiClone[key].related_recipes = relatedRecipes;

        let relatedGlossary: any[] = [];
        for (let termKey of apiClone[key].glossary_terms) {
            let term_src = Glossary[termKey];
            let term = {
                url: `/glossary#${termKey}`,
                term: term_src?.name || termKey
            }
            relatedGlossary.push(term);
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