const base = (import.meta as any).env?.VITE_SUPABASE_URL?.replace(/\/+$/, "") || "";

export const brandLogoURL =
  base ? `${base}/storage/v1/object/public/brand/logo.png` : "/images/brand/logo.png";

export const productPlaceholderURL =
  base ? `${base}/storage/v1/object/public/product-images/default.png` : "/images/products/placeholder.svg";
