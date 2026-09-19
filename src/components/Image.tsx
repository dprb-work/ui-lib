import type { ComponentPropsWithRef, ReactNode } from "react";

import { Tooltip } from "./Interactions";

export type ImageProps = Omit<ComponentPropsWithRef<"img">, "alt" | "title"> & {
  alt: string;
  tooltip?: ReactNode | false;
};

export function Image({ alt, tooltip, ref, ...imageProps }: ImageProps) {
  const image = <img {...imageProps} ref={ref} alt={alt} />;

  return <Tooltip label={tooltip === undefined && alt ? alt : tooltip}>{image}</Tooltip>;
}
