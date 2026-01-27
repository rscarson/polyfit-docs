import { general, testing } from '../data/tutorials.json';
import { MdParser , titleToId} from './markdown.ts';

import fs from 'fs';
import path from 'path';

function prepareTutorials(tutorials: any[], sourceURL: string, mdDir: string) {
    let tutorialsClone = JSON.parse(JSON.stringify(tutorials));
    tutorialsClone.forEach((tutorial: any) => {
        // Convert title into a lowercase snack-case ID
        tutorial.id = titleToId(tutorial.title);

        // if file doesn't exist, create an empty one
        const fullPath = path.resolve('./src', path.join(mdDir, tutorial.mdfile));
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, `# ${tutorial.title}\n\nContent coming soon!`);
        }

        const parser = new MdParser(sourceURL);
        tutorial.content = parser.parseFile(fullPath);
    });
    
    return tutorialsClone;
}

export function includeGeneralTutorials(sourceURL: string) {
    return prepareTutorials(general, sourceURL, 'data/general_tutorials');
}

export function includeTestingTutorials(sourceURL: string) {
    return prepareTutorials(testing, sourceURL, 'data/testing_tutorials');
}