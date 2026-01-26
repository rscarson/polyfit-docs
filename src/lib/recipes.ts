import { general, testing } from '../data/recipes.json';
import { MdParser , titleToId} from './markdown.ts';

import fs from 'fs';
import path from 'path';

function prepareRecipes(recipes: any[], sourceURL: string, mdDir: string) {
    let recipesClone = JSON.parse(JSON.stringify(recipes));
    recipesClone.forEach((recipe: any) => {
        // Convert title into a lowercase snack-case ID
        recipe.id = titleToId(recipe.title);

        // if file doesn't exist, create an empty one
        const fullPath = path.resolve('./src', path.join(mdDir, recipe.mdfile));
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, `# ${recipe.title}\n\nContent coming soon!`);
        }

        const parser = new MdParser(sourceURL);
        recipe.content = parser.parseFile(fullPath);
    });
    
    return recipesClone;
}

export function includeRecipes(sourceURL: string) {
    return prepareRecipes(general, sourceURL, 'data/general_recipes');
}

export function includeTestingRecipes(sourceURL: string) {
    return prepareRecipes(testing, sourceURL, 'data/testing_recipes');
}