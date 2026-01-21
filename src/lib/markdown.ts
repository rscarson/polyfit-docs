import { highlightRust } from "./highlight.ts";

import rawGlossary from '../data/glossary.json';
import rawBasis from '../data/basis.json';

import fs from 'fs';

import { loadCrate } from "cargo-json-docs";
import { Marked } from 'marked';

export const crate = loadCrate('../Repositories/crates_workspace/polyfit');

export function titleToId(title: string) {
    let id = title.toLowerCase().replace(/\s+/g, '-');

    // Strip out any non-alphanumeric or hyphen characters
    id = id.replace(/[^a-z0-9\-_]/g, '');

    return id;
}

export enum ItemKind {
    BlockQuote,
    Table,
    Hr,
    List,
    ListItem,
    Image,
    CodeBlock,
    CodeSpan,
    Paragraph,
    Heading,
    DocsLink,
    GlossaryLink,
    Link,
    Strong,
    Em,
    Text,
    Html,
    Br,
}

/**
 * Custom Marked extension to handle @[glossary-term]{optional text} links.
 * 
 * These are converted to links to the appropriate glossary page along with a tooltip.
 */
const GlossaryLinkExtension = {
    name: 'glossarylink',
    level: 'inline' as const,

    start(src: string) {
        const i = src.indexOf('@[');
        return i === -1 ? undefined : i;
    },

    tokenizer(src: string) {
        const rule = /^@\[([^\]]*?)\](\{(.+)\})?/;
        const match = rule.exec(src);
        if (!match) return;

        const raw = match[0];
        const term = match[1];
        const text = match[3] || null;

        let glossary: any = rawGlossary;
        let entry = glossary[term];
        let desc = entry ? entry.short_desc : null;

        if (!entry) {
            let basis: any = rawBasis;
            entry = basis[term];
            desc = entry ? entry.desc.join('\n\n') : null;
        }

        const name = entry?.name ?? term;
        const linkText = text ?? name;

        if (!entry) {
            console.warn(`Warning: could not find glossary entry for term: ${term}`);
            return {
                type: 'glossarylink',
                raw: raw,
                term: term,
                linkText: linkText,
                name: name,
                url: '#',
                desc: 'Missing Glossary Term - Please report this issue.',
            };
        }
        
        return {
            type: 'glossarylink',
            raw: raw,
            term: term,
            linkText: linkText,
            name: name,
            url: `/glossary#${term}`,
            desc: desc,
        };
    },

    renderer(token: any) {
        return `<a href="${token.url}" class="glossary-link" data-term="${token.term}" data-desc="${encodeURIComponent(token.desc)}">${token.name}</a>`;
    }
}

/**
 * Custom Marked extension to handle [[path::to::item]] links to Rust documentation.
 * These are converted to links to the appropriate documentation page if found in the crate data.
 */
const DocLinkExtension = {
    name: 'docslink',
    level: 'inline' as const,

    start(src: string) {
        const i = src.indexOf('[[');
        return i === -1 ? undefined : i;
    },

    tokenizer(src: string) {
        // Matches [[ (ident::)* ident ]] where ident are valid Rust identifiers (alphanumeric + _)
        const rule = /^\[\[(([a-zA-Z0-9_!]+::)*[a-zA-Z0-9_!]+)\]\]/;
        const match = rule.exec(src);
        if (!match) { return; }

        let raw = match[0];
        let path = match[1];

        let url = '#';
        try {
            let item = crate.get(path);
            url = item.url;
        } catch (e) {
            console.warn(`Warning: could not find docs item for path: ${e}`);
        }

        return {
            type: 'docslink',
            raw: raw,
            path: path,
            url: url
        };
    },

    renderer(token: any) {
        return `<a href="${token.url}">[${token.path}]</a>`;
    }
}

export class MdParser {
    parser: Marked;
    blocks: MdItem[] = [];
    sourceURL: string;

    public shouldExpandGlossaryLinks: boolean = true;

    constructor(sourceURL: string) {
        this.sourceURL = sourceURL;
        this.parser = new Marked({
            gfm: true,
            pedantic: false,
            breaks: false,
            
            extensions: [DocLinkExtension, GlossaryLinkExtension],
            hooks: {
                processAllTokens: (tokens: any) => {
                    for (let token of tokens) {
                        this.visit(token);
                    }

                    return tokens;
                }
            }
        });
    }

    visit(token: any) {
        let item = MdItem.parse(token);
        this.blocks.push(item);
    }

    finish() {
        let blocks = this.blocks;
        return blocks;
    }

    parse(src: string) {
        this.blocks = [];
        this.parser.parse(src);
        return this.finish();
    }

    parseFile(mdPath: string) {
        const mdContent = fs.readFileSync(mdPath, 'utf-8');
        return this.parse(mdContent);
    }
}

export class MdItem {
    kind: ItemKind;
    plaintext: string;

    constructor(plaintext: string, kind: ItemKind) {
        this.plaintext = plaintext;
        this.kind = kind;
    }

    static parse(token: any): MdItem {
        switch (token.type) {
            case 'blockquote': return MdBlockQuote.parse(token);
            case 'table': return MdTable.parse(token);
            case 'hr': return MdHorizontalRule.parse(token);
            case 'list': return MdList.parse(token);
            case 'image': return MdImage.parse(token);
            case 'code': return MdCodeBlock.parse(token);
            case 'codespan': return MdCodeSpan.parse(token);
            case 'paragraph': return MdParagraph.parse(token);
            case 'heading': return MdHeading.parse(token);
            case 'link': return MdLink.parse(token);
            case 'strong': return new MdStrong(token.text);
            case 'em': return new MdEm(token.text);
            case 'text': return MdText.parse(token);
            case 'space': return MdSpace.parse(token);
            case 'html': return MdLiteral.parse(token);
            case 'br': return MdBr.parse(token);
            case 'docslink': return MdDocsLink.parse(token);
            case 'glossarylink': return MdGlossaryLink.parse(token);

            default: throw new Error(`Unsupported token type: ${token.type}: ${JSON.stringify(token)}`);
        }
    }
}

export class MdLiteral extends MdItem {
    constructor(content: string) {
        super(content, ItemKind.Html);
    }

    static parse(token: any): MdLiteral {
        return new MdLiteral(token.text);
    }
}

export class MdSpace extends MdItem {
    constructor() {
        super(' ', ItemKind.Text);
    }

    static parse(_: any): MdSpace {
        return new MdSpace();
    }
}

export class MdText extends MdItem {
    content: MdItem[] | string;

    constructor(content: MdItem[]|string) {
        const plaintext = (typeof content === 'string') ? content : content.map(c => c.plaintext).join('');
        super(plaintext, ItemKind.Text);
        this.content = content;
    }

    static parse(token: any): MdText {
        if (token.tokens && token.tokens.length > 0) {
            let items: MdItem[] = token.tokens.map((t: any) => MdItem.parse(t));
            return new MdText(items);
        }

        return new MdText(token.text);
    }
}

export class MdStrong extends MdItem {
    content: string;

    constructor(content: string) {
        super(content, ItemKind.Strong);
        this.content = content;
    }

    static parse(token: any): MdStrong {
        return new MdStrong(token.text);
    }
}

export class MdEm extends MdItem {
    content: string;

    constructor(content: string) {
        super(content, ItemKind.Em);
        this.content = content;
    }

    static parse(token: any): MdEm {
        return new MdEm(token.text);
    }
}

export class MdBlockQuote extends MdItem {
    heading?: string;
    content: MdItem[];

    constructor(heading: string | undefined, content: MdItem[]) {
        let plaintext = heading ? heading + '\n' : '';
        plaintext += content.map(c => c.plaintext).join('\n');
        super(plaintext, ItemKind.BlockQuote);

        this.heading = heading;
        this.content = content;
    }

    static parse(token: any): MdBlockQuote {
        let quote = { type: 'blockquote', content: [], heading: undefined };
        let content_start = 0;
        if (token.tokens.length > 0 && token.tokens[0].type === 'heading') {
            quote.heading = token.tokens[0].text;
            content_start = 1;
        }

        quote.content = token.tokens.slice(content_start).map((t: any) => {
            return MdItem.parse(t);
        });

        return new MdBlockQuote(quote.heading, quote.content);
    }
}

export class MdTable extends MdItem {
    headers: string[];
    rows: MdItem[][];

    constructor(headers: string[], rows: MdItem[][]) {
        let plaintext = headers.join('\t') + '\n';
        plaintext += rows.map(r => r.join('\t')).join('\n');
        super(plaintext, ItemKind.Table);
        this.headers = headers;
        this.rows = rows;
    }

    static parse(token: any): MdTable {
        let headers = token.header.map((cell: any) => cell.text);
        let rows = token.rows.map((row: any) => row.map((cell: any) => MdItem.parse(cell.text)));
        return new MdTable(headers, rows);
    }
}


export class MdHorizontalRule extends MdItem {
    constructor() {
        super('---', ItemKind.Hr);
    }

    static parse(_: any): MdHorizontalRule {
        return new MdHorizontalRule();
    }
}

export class MdList extends MdItem {
    ordered: boolean
    items: MdListItem[];

    constructor(ordered: boolean, items: MdListItem[]) {
        let plaintext = items.map(itemList => itemList.plaintext).join('\n');
        super(plaintext, ItemKind.List);
        this.ordered = ordered;
        this.items = items;
    }

    static parse(token: any): MdList {
        let items: MdListItem[] = token.items.map((itemToken: any) => {
            let item = MdListItem.parse(itemToken);
            return item;
        });
        return new MdList(token.ordered, items);
    }
}

export class MdListItem extends MdItem {
    content: MdItem[];

    constructor(content: MdItem[]) {
        super(content.map(c => c.plaintext).join(' '), ItemKind.ListItem);
        this.content = content;
    }

    static parse(token: any): MdListItem {
        let innerTokens: any[] = [];
        for (let t of token.tokens) {
            innerTokens.push(MdItem.parse(t));
        }

        return new MdListItem(innerTokens); 
    }
}

export class MdImage extends MdItem { 
    url: string;
    alt: string;

    constructor(url: string, alt: string) {
        super(alt, ItemKind.Image);
        this.url = url;
        this.alt = alt;
    }

    static parse(token: any): MdImage {
        return new MdImage(token.href, token.text);
    }
}

export class MdCodeBlock extends MdItem {
    lang: string | null;
    content: string;

    constructor(lang: string | null, content: string) {
        super(content, ItemKind.CodeBlock);
        this.lang = lang;

        if (lang === 'rust') {
            content = highlightRust(content);
        }
        this.content = content;
    }

    static parse(token: any): MdCodeBlock {
        let code = token.text;

        return new MdCodeBlock(token.lang, code);
    }
}

export class MdCodeSpan extends MdItem {
    content: string;

    constructor(content: string) {
        super(content, ItemKind.CodeSpan);
        this.content = content;
    }

    static parse(token: any): MdCodeSpan {
        return new MdCodeSpan(highlightRust(token.text));
    }
}

export class MdHeading extends MdItem {
    level: number;
    id: string;
    content: MdItem[];

    constructor(content: MdItem[], level: number = 1) {
        super(content.map(c => c.plaintext).join('\n'), ItemKind.Heading);
        this.content = content;
        this.id = titleToId(this.plaintext);
        this.level = level;
    }

    static parse(token: any): MdHeading {
        return new MdHeading(token.tokens.map((t: any) => MdItem.parse(t)), token.depth);
    }
}

export class MdParagraph extends MdItem {
    content: MdItem[];

    constructor(content: MdItem[]) {
        super(content.map(c => c.plaintext).join('\n'), ItemKind.Paragraph);
        this.content = content;
    }

    static parse(token: any): MdParagraph {
        return new MdParagraph(token.tokens.map((t: any) => MdItem.parse(t)));
    }
}

export class MdLink extends MdItem {
    url: string;
    text: string;

    constructor(url: string, text: string) {
        super(text, ItemKind.Link);
        this.url = url;
        this.text = text;
    }

    static parse(token: any): MdLink {
        let url = token.href;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/') && !url.startsWith('#')) {
            url = `/${url}`;
        }

        return new MdLink(url, token.text);
    }
}

export class MdDocsLink extends MdItem {
    path: string;
    url: string;

    constructor(path: string, url: string) {
        super(path, ItemKind.DocsLink);
        this.url = url;
        this.path = path;
    }

    static parse(token: any): MdDocsLink {
        return new MdDocsLink(token.path, token.url);
    }
}

export class MdGlossaryLink extends MdItem {
    term: string;
    linkText: string;
    name: string;
    url: string;
    desc: string;
    
    constructor(term: string, linkText: string, name: string, url: string, desc: string) {
        super(desc, ItemKind.GlossaryLink);
        this.term = term;
        this.linkText = linkText;
        this.name = name;
        this.url = url;
        this.desc = desc;
    }

    static parse(token: any): MdGlossaryLink {
        return new MdGlossaryLink(token.term, token.linkText, token.name, token.url, token.desc);
    }
}

export class MdBr extends MdItem {
    constructor() {
        super('\n', ItemKind.Br);
    }

    static parse(_: any): MdBr {
        return new MdBr();
    }
}