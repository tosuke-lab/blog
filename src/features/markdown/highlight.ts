import type * as mdast from "mdast";
import { lowlight } from "lowlight/lib/all";
import { map } from "unist-util-map";
import type { LowlightElementSpan, Text } from "lowlight/lib/core";

export type HighlightTree = ReadonlyArray<
  number | readonly [classNames: string, tree: HighlightTree]
>;

type HighlightTreeItem = HighlightTree[number];

function highlightCode(code: string, lang: string): HighlightTree {
  const root = lowlight.highlight(lang, code);
  const inner = (node: LowlightElementSpan | Text): HighlightTreeItem => {
    if (node.type === "text") return node.value.length;
    return [
      node.properties.className.join(" "),
      node.children.map(inner),
    ] as const;
  };
  return root.children.map(inner);
}

export function highlight(root: mdast.Root): mdast.Root {
  return map(root, (node) => {
    if (node.type !== "code") return node;
    const code = node as mdast.Code;
    if (code.lang == null) return node;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [lang] = code.lang.split(":");
    const tree = highlightCode(code.value, lang);
    return {
      ...node,
      data: {
        highlight: tree,
      },
    };
  }) as mdast.Root;
}
