import type * as mdast from "mdast";

export function collectString(node: mdast.Content): string | undefined {
  if ("value" in node) return node.value;
  if ("children" in node)
    return (node.children as mdast.Content[]).reduce(
      (pre, n) => pre + (collectString(n) ?? ""),
      ""
    );
  return undefined;
}
