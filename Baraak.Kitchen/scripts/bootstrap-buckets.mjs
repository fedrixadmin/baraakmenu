import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function ensureBucket(name, opts) {
  const { error: cErr } = await admin.storage.createBucket(name, opts);
  if (cErr && !String(cErr.message || "").includes("already exists")) {
    console.error(`Create bucket ${name} failed:`, cErr.message);
    process.exit(1);
  }
  const { error: uErr } = await admin.storage.updateBucket(name, opts);
  if (uErr) {
    console.error(`Update bucket ${name} failed:`, uErr.message);
    process.exit(1);
  }
  console.log(`✓ Bucket ${name} ready (public=${opts.public})`);
}

const run = async () => {
  await ensureBucket("brand", { public: true });
  await ensureBucket("product-images", { public: true });
  await ensureBucket("receipts", { public: false });
};
run().catch((e) => { console.error(e); process.exit(1); });
