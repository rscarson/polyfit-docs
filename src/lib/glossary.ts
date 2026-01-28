import glossary from '../data/glossary.json';
import { MdParser, crate } from './markdown.ts';

export function includeGlossary(sourceURL: string) {
    const parser = new MdParser(sourceURL);

    // The glossary is stored as a dictionary, so we get an array of its values, and set id as a property
    let glossaryClone: any[] = [];
    Object.keys(glossary).forEach((key: any) => {
        let item = JSON.parse(JSON.stringify((glossary as any)[key]));
        item.id = key;

        item.desc = parser.parse(item.desc.join('\n\n'));
        item.related = item.related.map((rel: string) => {
            return {
                url: crate.get(rel).url,
                text: rel
            };
        });

        item.links = [];
        if (item.refs.wikipedia) item.links.push({ url: item.refs.wikipedia, text: 'Wikipedia' });
        if (item.refs.mathworld) item.links.push({ url: item.refs.mathworld, text: 'Mathworld' });
        if (item.refs.khanacademy) item.links.push({ url: item.refs.khanacademy, text: 'Khan Academy' });

        glossaryClone.push(item);
    });

    // Sort alphabetically by name
    glossaryClone.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return glossaryClone;
}

export function glossaryHasTerm(term: string): boolean {
    /* if we start with basis-, it's a basis term, just return true */
    if (term.startsWith('basis-')) return true;
    
    return Object.keys(glossary).includes(term);
}