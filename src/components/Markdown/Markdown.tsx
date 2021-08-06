import React, { createContext, Fragment, useContext, useMemo } from "react";
import clsx from "clsx";
import { tw } from "tailwind-variant.macro";
import Image from "next/image";
import type * as mdast from "mdast";
import { ImageInfoMap } from "features/image/types";
import { collectString } from "features/markdown/utils/collectString";
import { HighlightTree } from "features/markdown/highlight";
import styles from "./Markdown.module.css";

const ImageInfoMapContext = createContext<ImageInfoMap>({});

export const Markdown: React.VFC<{
  readonly root: mdast.Root;
  readonly imageInfoMap: ImageInfoMap;
}> = ({ root, imageInfoMap }) => (
  <ImageInfoMapContext.Provider value={imageInfoMap}>
    <div className={clsx(styles.markdown, "space-y-4")}>
      <MDContent contents={root.children} />
    </div>
  </ImageInfoMapContext.Provider>
);

const DEFAULT_IMAGE_WIDTH = 560;

const MDImage: React.VFC<
  Readonly<{
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  }>
> = ({ src, alt, width = DEFAULT_IMAGE_WIDTH, height }) => {
  const imageInfoMap = useContext(ImageInfoMapContext);
  const info = imageInfoMap[src];
  return info != null ? (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height ?? width / info.aspect}
      placeholder="blur"
      blurDataURL={info.blurURL}
    />
  ) : (
    // eslint-disable-next-line
    <img loading="lazy" src={src} alt={alt} width={width} height={height} />
  );
};

const MDCode: React.VFC<{ readonly code: mdast.Code }> = ({ code }) => {
  const [lang, name] = (code.lang?.split(":") ?? []) as
    | []
    | [string]
    | [string, string];
  const title = name ?? lang;

  const value = code.value;
  const tree = code.data?.highlight as HighlightTree | undefined;
  const content = useMemo(() => {
    let i = 0;
    const inner = (t: HighlightTree) => (
      <>
        {t.map((item) => {
          if (typeof item === "number") {
            const el = <Fragment key={i}>{value.slice(i, i + item)}</Fragment>;
            i += item;
            return el;
          } else {
            const [className, children] = item;
            return (
              <span key={i} className={className}>
                {inner(children)}
              </span>
            );
          }
        })}
      </>
    );
    if (tree == null) return <>{value}</>;
    return inner(tree);
  }, [value, tree]);

  return (
    <pre
      className={clsx(
        ["flex", "flex-col"],
        "leading-relaxed",
        "bg-[color:var(--surface-color)]"
      )}
    >
      {title && (
        <span
          className={clsx(
            "self-start",
            "text-sm",
            "rounded-sm",
            ["mt-2", "ml-2"],
            ["px-1", "py-0.5"],
            [
              tw("text-gray-100", "bg-blue-500"),
              tw.dark("text-gray-900", "bg-blue-300"),
            ]
          )}
        >
          {title}
        </span>
      )}
      <code className={clsx("hljs", "!bg-[color:inherit]")}>{content}</code>
    </pre>
  );
};

const MDContent: React.VFC<{ readonly contents: mdast.Content[] }> = ({
  contents,
}) => (
  <>
    {contents.map((content, i) => {
      switch (content.type) {
        // block
        case "heading": {
          const id = collectString(content);
          return React.createElement(
            `h${content.depth}`,
            { key: i, id },
            <a
              data-content={"#".repeat(content.depth)}
              href={id != null ? `#${id}` : undefined}
            >
              <MDContent contents={content.children} />
            </a>
          );
        }
        case "paragraph":
          return (
            <p key={i}>
              <MDContent contents={content.children} />
            </p>
          );
        case "blockquote":
          return (
            <blockquote key={i}>
              <MDContent contents={content.children} />
            </blockquote>
          );
        case "list":
          return React.createElement(
            content.ordered ? "ol" : "ul",
            { key: i },
            <MDContent contents={content.children} />
          );
        case "listItem":
          return (
            <li key={i}>
              {content.children.map((node, i) =>
                node.type === "paragraph" ? (
                  <MDContent key={i} contents={node.children} />
                ) : (
                  <MDContent key={i} contents={[node]} />
                )
              )}
            </li>
          );
        case "image":
          return (
            <MDImage
              key={i}
              src={content.url}
              alt={content.alt}
              width={content.data?.width as number}
              height={content.data?.height as number}
            />
          );
        case "thematicBreak":
          return (
            <div
              key={i}
              aria-hidden
              className={clsx(
                "w-full",
                "h-0.5",
                "bg-gray-400",
                "dark:bg-gray-600"
              )}
            />
          );
        case "code":
          return <MDCode key={i} code={content} />;

        // inline
        case "text":
          return <Fragment key={i}>{content.value}</Fragment>;
        case "strong":
          return (
            <strong key={i}>
              <MDContent contents={content.children} />
            </strong>
          );
        case "emphasis":
          return (
            <em key={i}>
              <MDContent contents={content.children} />
            </em>
          );
        case "delete":
          return (
            <del key={i}>
              <MDContent contents={content.children} />
            </del>
          );
        case "inlineCode":
          return <code key={i}>{content.value}</code>;
        case "link":
          return (
            <a
              key={i}
              className={clsx(
                ["text-blue-500", "dark:text-blue-300"],
                "hover:underline"
              )}
              href={content.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <MDContent contents={content.children} />
            </a>
          );
        default:
          return null;
      }
    })}
  </>
);
