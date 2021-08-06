import type * as mdast from "mdast";
import sizeOf from "image-size";
import sharp from "sharp";
import { visit } from "unist-util-visit";
import type { ImageInfo, ImageInfoMap } from "./types";
import imageDomains from "image-domains.json";

async function fetchImageData(url: string): Promise<ImageInfo | undefined> {
  if (!imageDomains.includes(new URL(url).hostname)) return undefined;
  const buf = await fetch(url)
    .then((res) => res.arrayBuffer())
    .then((arrayBuf) => Buffer.from(arrayBuf));
  const { width, height } = await sizeOf(buf);
  if (width == null || height == null) return undefined;

  const transformer = sharp(buf);
  if (width >= height) {
    transformer.resize(8);
  } else {
    transformer.resize(null, 8);
  }
  const blurBuf = await transformer.jpeg({ quality: 70 }).toBuffer();

  return {
    aspect: width / height,
    blurURL: `data:image/jpeg;base64,${blurBuf.toString("base64")}`,
  };
}

export async function collectImageinfo(
  root: mdast.Root
): Promise<ImageInfoMap> {
  const imageInfoMap: ImageInfoMap = {};
  const imageUrlSet = new Set<string>();
  const promises: Promise<void>[] = [];
  visit(root, "image", (imageNode) => {
    const url = imageNode.url;
    if (imageUrlSet.has(url)) return;
    imageUrlSet.add(url);

    promises.push(
      fetchImageData(url).then((data) => {
        if (data != null) {
          imageInfoMap[url] = data;
        }
      })
    );
  });
  await Promise.all(promises);
  return imageInfoMap;
}
