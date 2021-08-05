import type { Entry, EntryInfo } from "./types";
import type * as mdast from "mdast";
import path from "path";
import { promises as fs } from "fs";
import { unified } from "unified";
import markdownParser from "remark-parse";
import gfmParser from "remark-gfm";
import frontmatterParser from "remark-frontmatter";
import yaml from "js-yaml";
import { z } from "zod";
import dayjs from "dayjs";
import { LazyPromise } from "utils/LazyPromise";

export function parseMarkdown(content: string): mdast.Root {
  return unified()
    .use(markdownParser)
    .use(gfmParser)
    .use(frontmatterParser, ["yaml"])
    .parse(content);
}

const iso8601string = z.string().refine((iso8601) => dayjs(iso8601).isValid(), {
  message: "String must be formatted with ISO8601",
});
const frontmatterSchema = z
  .object({
    title: z.string(),
    tags: z
      .string()
      .transform((tags) => tags.split(",").map((tag) => tag.trim())),
    created_at: iso8601string,
    updated_at: iso8601string,
    number: z.number().int({ message: "number must be an integer" }),
  })
  .transform(
    ({ title, tags, created_at, updated_at, number }): EntryInfo => ({
      slug: title,
      tags,
      createdAt: created_at,
      updatedAt: updated_at,
      number,
    })
  );
export function parseFrontmatter(root: mdast.Root): EntryInfo | undefined {
  const yamlNode = root.children.find(
    (node): node is mdast.YAML => node.type === "yaml"
  );
  if (yamlNode == null) return;
  const data = yaml.load(yamlNode.value);
  return frontmatterSchema.parse(data);
}

function parseTitleAndDescription(root: mdast.Root, content: string) {
  const children = [...root.children];

  const firstHeadingIndex = children.findIndex(
    (node): node is mdast.Heading => node.type === "heading"
  );
  if (firstHeadingIndex < 0) throw new Error("cannot find any headings");
  const firstHeading = children[firstHeadingIndex] as mdast.Heading;
  children.splice(firstHeadingIndex, 1);

  const firstHeadingPos = firstHeading.position;
  if (firstHeadingPos == null)
    throw new Error(`root > heading:first-of-type has no position`);
  const firstHeadingFirstItemPos = firstHeading.children[0].position;
  if (firstHeadingFirstItemPos == null)
    throw new Error(
      `root > heading:first-of-type > :first-child has no position`
    );

  const title = content.slice(
    firstHeadingFirstItemPos.start.offset,
    firstHeadingPos.end.offset
  );

  const leadingParagraph = children.find(
    (node): node is mdast.Paragraph => node.type === "paragraph"
  );
  if (leadingParagraph == null)
    throw new Error(
      "root > heading:first-of-type ~ paragraph:first-of-type is not found"
    );
  const leadingParagraphPos = leadingParagraph.position;
  if (leadingParagraphPos == null)
    throw new Error(
      "root > heading:first-of-type ~ paragraph:first-of-type has no position"
    );

  const description = content.slice(
    leadingParagraphPos.start.offset,
    leadingParagraphPos.end.offset
  );

  const viewRoot = {
    ...root,
    children,
  };

  return {
    title,
    description,
    viewRoot,
  } as const;
}

export class Parser {
  private slugToEntryPromise: PromiseLike<Map<string, Entry>>;

  constructor() {
    this.slugToEntryPromise = new LazyPromise(async () => {
      const slugToEntry = new Map<string, Entry>();

      const sourceDir = "source";

      const files = await fs.readdir(sourceDir);
      await Promise.all(
        files.map(async (filePath) => {
          const content = await fs.readFile(path.join(sourceDir, filePath), {
            encoding: "utf8",
          });

          const parsed = parseMarkdown(content);
          const entryInfo = parseFrontmatter(parsed);
          if (entryInfo == null) return;
          const {
            title,
            description,
            viewRoot: root,
          } = parseTitleAndDescription(parsed, content);
          slugToEntry.set(entryInfo.slug, {
            ...entryInfo,
            title,
            description,
            node: root,
          });
        })
      );

      return slugToEntry;
    });
  }

  async entries(): Promise<Entry[]> {
    const slugToEntry = await this.slugToEntryPromise;
    const entries = [...slugToEntry.values()];
    entries.sort((a, b) => dayjs(a.createdAt).diff(b.createdAt));
    return entries;
  }

  async entry(slug: string): Promise<Entry | undefined> {
    const slugToEntry = await this.slugToEntryPromise;
    return slugToEntry.get(slug);
  }
}

export const entriesParser = new Parser();
