import { useState } from "react";
import { productPlaceholderURL } from "../lib/assets";

type Props = {
  src?: string | null;
  alt?: string;
  ratio?: "1/1" | "4/3" | "3/2" | "16/9";
  mode?: "cover" | "contain";
  rounded?: string;
  className?: string;
  border?: boolean;
};

export default function SmartImage({
  src,
  alt = "image",
  ratio = "1/1",
  mode = "cover",
  rounded = "rounded-xl",
  className = "",
  border = true
}: Props) {
  const [err, setErr] = useState(false);
  const url = !src || err ? productPlaceholderURL : src;

  const ratioClass =
    ratio === "1/1" ? "ratio-1-1" :
    ratio === "4/3" ? "ratio-4-3" :
    ratio === "3/2" ? "ratio-3-2" : "ratio-16-9";

  const fitClass = mode === "cover" ? "img-cover" : "img-contain";
  const borderClass = border ? "border border-black/5" : "";

  return (
    <div className={`img-wrap ${ratioClass} ${rounded} ${borderClass} ${className}`}>
      <img
        src={url}
        alt={alt}
        className={`img ${fitClass} ${rounded}`}
        loading="lazy"
        onError={() => setErr(true)}
      />
    </div>
  );
}
