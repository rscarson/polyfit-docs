import macros from '../data/macros.json';
import { highlightRust } from "./highlight.ts";
import { MdParser, crate } from './markdown.ts';

export function prepareMacros(sourceURL: string) {
    let macrosClone = JSON.parse(JSON.stringify(macros));

    // Convert the map into a list with a 'name' field
    const parser = new MdParser(sourceURL);
    const macrosList = Object.keys(macrosClone).map((name: any) => {
        let macro = macrosClone[name];
        macro.name = name;
        macro.desc = parser.parse(macro.desc);
        macro.example = highlightRust(macro.example.join('\n'));

        macro.docs = crate.get(name).url;
        
        let is_first_arg = true;
        const protoArgs = Object.keys(macro.args).map((name: any) => {
            let arg = macro.args[name];
            if (arg.optional) return `[, ${name}]`;
            if (is_first_arg) {
                is_first_arg = false;
                return name;
            };

            return `, ${name}`;
        }).join(' ');
        macro.prototype = `${name}!(${protoArgs})`;

        Object.keys(macro.args).forEach((name: any) => {
            let arg = macro.args[name];
            arg.desc = parser.parse(arg.desc);
        });

        return macro;
    });

    // Sort macros alphabetically
    macrosList.sort((a, b) => a.name.localeCompare(b.name));

    return macrosList;
}