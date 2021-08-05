import type { NextPage, GetStaticProps, GetStaticPaths } from "next";
import { entriesParser } from "features/markdown/parser";
import { Entry } from "features/markdown/types";
import { removePosition } from "features/markdown/optimize";
import { Markdown } from "components/Markdown";
import clsx from "clsx";
import dayjs from "dayjs";
import { collectImageinfo } from "features/image/collectImageInfo";
import { transformHTML } from "features/markdown/transformHTML";
import { highlight } from "features/markdown/highlight";

type EntryPageParams = {
  readonly slug: string;
};

type EntryPageProps = {
  readonly entry: Entry;
  readonly imageInfo: Record<string, ImageInfo | undefined>;
};

export const getStaticPaths: GetStaticPaths<EntryPageParams> = async () => {
  const entries = await entriesParser.entries();
  return {
    paths: entries.map((e) => ({ params: { slug: e.slug } })),
    fallback: false,
  };
};

type ImageInfo = { readonly aspect: number };

export const getStaticProps: GetStaticProps<EntryPageProps, EntryPageParams> =
  async (ctx) => {
    if (ctx.params == null) {
      return {
        notFound: true,
      };
    }
    const { slug } = ctx.params;
    const entry = await entriesParser.entry(slug);
    if (entry == null) {
      return {
        notFound: true,
      };
    }
    const root = highlight(transformHTML(entry.node));

    const node = removePosition(root);

    const imageInfo: Record<string, ImageInfo | undefined> =
      await collectImageinfo(root);

    return {
      props: {
        entry: {
          ...entry,
          node,
        },
        imageInfo,
      },
    };
  };

const EntryPage: NextPage<EntryPageProps> = ({ entry, imageInfo }) => (
  <div className={clsx(["mx-auto", "max-w-screen-md"])}>
    <main>
      <div className={clsx("space-y-4")}>
        <p>
          <time dateTime={entry.createdAt}>
            {dayjs(entry.createdAt).format("YYYY年M月D日")}
          </time>
        </p>
        <h1 className={clsx("font-bold", "text-3xl")}>{entry.title}</h1>
      </div>
      <div className="mt-12">
        <Markdown imageInfoMap={imageInfo} root={entry.node} />
      </div>
    </main>
  </div>
);

export default EntryPage;
