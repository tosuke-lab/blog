export type ImageInfo = {
  readonly aspect: number;
  readonly blurURL: string;
};

export type ImageInfoMap = Record<string, ImageInfo | undefined>;
