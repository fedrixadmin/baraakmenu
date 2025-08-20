import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseClientURL = process.env.CLIENT_BASE_URL || "http://localhost:5173";

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const outDir = path.resolve("qr");
fs.mkdirSync(outDir, { recursive: true });

const { data, error } = await supabase.from("dining_tables")
  .select("table_number, qr_token").order("table_number");

if (error) throw error;

for (const row of data) {
  const link = `${baseClientURL}/?t=${row.qr_token}`;
  const file = path.join(outDir, `table-${row.table_number}.png`);
  await QRCode.toFile(file, link, { width: 512, margin: 2 });
  console.log("Generated", file, "→", link);
}
