import type { Node } from "unist";
import { map } from "unist-util-map";

export function removePosition<N extends Node>(node: N): N {
  return map(node, (n) => {
    const cloned = { ...n };
    delete cloned.position;
    return cloned;
  }) as N;
}
