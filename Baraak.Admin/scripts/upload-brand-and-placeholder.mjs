import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function uploadFile(bucket, localPath, storagePath, contentType = "image/png") {
  const file = fs.readFileSync(localPath);
  const { error } = await admin.storage.from(bucket).upload(storagePath, file, {
    upsert: true,
    contentType,
  });
  if (error) {
    console.error(`Upload to ${bucket}/${storagePath} failed:`, error.message);
    process.exit(1);
  }
  console.log(`✓ Uploaded ${bucket}/${storagePath}`);
}

const run = async () => {
  const logoLocal = path.resolve("public/images/brand/logo.png");
  if (fs.existsSync(logoLocal)) {
    await uploadFile("brand", logoLocal, "logo.png", "image/png");
  } else {
    console.warn("Logo not found at public/images/brand/logo.png - skipping upload.");
  }

  const placeholderLocal = path.resolve("public/images/products/placeholder.svg");
  if (fs.existsSync(placeholderLocal)) {
    await uploadFile("product-images", placeholderLocal, "default.svg", "image/svg+xml");
  } else {
    console.warn("Placeholder not found at public/images/products/placeholder.svg - skipping upload.");
  }
};
run().catch((e) => { console.error(e); process.exit(1); });
