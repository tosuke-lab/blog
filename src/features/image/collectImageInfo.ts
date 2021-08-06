import type * as mdast from "mdast";
import sizeOf from "image-size";
import sharp from "sharp";
import { visit } from "unist-util-visit";
import type { ImageInfo } from "./types";
import imageDomains from "image-domains.json";

async function fetchImageData(url: string): Promise<ImageInfo | undefined> {
  if (!imageDomains.includes(new URL(url).hostname)) return undefined;
  const res = await fetch(url, {});
  const contentType = res.headers.get("content-type");
  const buf = await res.arrayBuffer().then((arrayBuf) => Buffer.from(arrayBuf));
  const { width, height } = await sizeOf(buf);
  if (width == null || height == null) return undefined;
  const aspect = width / height;

  if (["image/png", "image/jpeg", "image/webp"].includes(contentType ?? "")) {
    const transformer = sharp(buf);
    if (width >= height) {
      transformer.resize(8);
    } else {
      transformer.resize(null, 8);
    }
    const blurBuf = await transformer.png({ quality: 70 }).toBuffer();

    return {
      aspect,
      blurURL: `data:image/png;base64,${blurBuf.toString("base64")}`,
    };
  } else {
    return {
      aspect,
    };
  }
}

export async function collectImageinfo(root: mdast.Root): Promise<mdast.Root> {
  const promises: Promise<void>[] = [];
  visit(root, "image", (imageNode) => {
    const url = imageNode.url;

    promises.push(
      fetchImageData(url).then((data) => {
        if (data != null) {
          imageNode.data ??= {};
          Object.assign(imageNode.data, data);
        }
      })
    );
  });
  await Promise.all(promises);
  return root;
}
