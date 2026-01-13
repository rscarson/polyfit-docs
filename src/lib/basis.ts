import basis from '../data/basis.json';
import { MdParser} from './markdown.ts';

export function includeBasis(sourceURL: string) {
    const parser = new MdParser(sourceURL);

    // The glossary is stored as a dictionary, so we get an array of its values, and set id as a property
    let _basis: any[] = [];
    Object.keys(basis).forEach((key: any) => {
        let item = JSON.parse(JSON.stringify((basis as any)[key]));

        item.desc = parser.parse(item.desc.join('\n\n'));
        item.desc_full = parser.parse(item.desc_full.join('\n\n'));

        for (const key in item.features) {
            item.features[key] = parser.parse(item.features[key]);
        }

        item.id = key;
        _basis.push(item);
    });

    return _basis;
}