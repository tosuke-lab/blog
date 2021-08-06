import type { NextPage, GetStaticProps, GetStaticPaths } from "next";
import type { Entry } from "features/markdown/types";
import { entriesParser } from "features/markdown/parser";
import { removePosition } from "features/markdown/optimize";
import { transformHTML } from "features/markdown/transformHTML";
import { highlight } from "features/markdown/highlight";
import { Markdown } from "components/Markdown";
import { collectImageinfo } from "features/image/collectImageInfo";
import clsx from "clsx";
import dayjs from "dayjs";

type EntryPageParams = {
  readonly slug: string;
};

type EntryPageProps = {
  readonly entry: Entry;
};

export const getStaticPaths: GetStaticPaths<EntryPageParams> = async () => {
  const entries = await entriesParser.entries();
  return {
    paths: entries.map((e) => ({ params: { slug: e.slug } })),
    fallback: false,
  };
};

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
    const node = removePosition(
      await collectImageinfo(highlight(transformHTML(entry.node)))
    );

    await collectImageinfo(node);

    return {
      props: {
        entry: {
          ...entry,
          node,
        },
      },
    };
  };

const EntryPage: NextPage<EntryPageProps> = ({ entry }) => (
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
        <Markdown root={entry.node} />
      </div>
    </main>
  </div>
);

export default EntryPage;
