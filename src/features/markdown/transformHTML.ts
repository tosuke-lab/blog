import type * as mdast from "mdast";
import { unified } from "unified";
import { map } from "unist-util-map";
import parseHTML from "rehype-parse";

export function transformHTML(root: mdast.Root): mdast.Root {
  return map(root, (node) => {
    if (node.type !== "html") return node;
    const htmlNode = node as mdast.HTML;

    const parsed = unified()
      .use(parseHTML, { fragment: true })
      .parse(htmlNode.value);

    if (parsed.children.length === 1) {
      const el = parsed.children[0];
      if (el.type === "element" && el.tagName === "img") {
        return {
          ...node,
          type: "image",
          url: el.properties?.src ?? "",
          alt: el.properties?.alt ?? "",
          data: {
            width: el.properties?.width ?? null,
            height: el.properties?.height ?? null,
          },
        };
      }
    }

    return node;
  }) as mdast.Root;
}
