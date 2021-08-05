import type * as mdast from "mdast";

/**
 * FrontmatterやAPIから得られる情報
 */
export type EntryInfo = {
  /** esaではtitle */
  readonly slug: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  /** esaでのid */
  readonly number: number;
};

/**
 * Markdownを解析して得た情報も含まれる情報
 */
export type EntryItem = EntryInfo & {
  readonly title: string;
  readonly description: string;
};

export type Entry = EntryItem & {
  readonly node: mdast.Root;
};
