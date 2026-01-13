import hljs from "highlight.js/lib/core";
import rust from "highlight.js/lib/languages/rust";

hljs.registerLanguage("rust", rust);
export function highlightRust(code: any) {
  return hljs.highlight(code, { language: "rust" }).value;
}
