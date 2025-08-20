import { useEffect, useMemo, useState } from "react";
import { getStaffClient } from "../../../lib/supabaseClients";
import { CheckCircle2, CircleOff, Pencil, Save, XCircle, Plus } from "lucide-react";

type Props = { search: string };

type TableRow = {
  id: string;
  number: number;
  token: string;
  area: string | null;
  seats: number | null;
  status: "available" | "occupied" | "out_of_service";
  created_at?: string;
  updated_at?: string;
};

type RequestRow = { table_number: number | null; table_token: string | null };

export default function Tables({ search }: Props) {
  const sb = getStaffClient();
  const [rows, setRows] = useState<TableRow[]>([]);
  const [openReqs, setOpenReqs] = useState<RequestRow[]>([]);
  const [edit, setEdit] = useState<Record<string, Partial<TableRow>>>({});
  const [creating, setCreating] = useState<boolean>(false);
  const [createDraft, setCreateDraft] = useState<Partial<TableRow>>({
    number: 0,
    token: "",
    area: "",
    seats: 2,
    status: "available",
  });

  async function load() {
    const { data } = await sb.from("restaurant_tables").select("*").order("number");
    setRows((data ?? []) as unknown as TableRow[]);
    const { data: reqs } = await sb.from("v_open_service_requests").select("table_number,table_token");
    setOpenReqs((reqs ?? []) as RequestRow[]);
  }
  useEffect(() => { load(); }, []);

  // live request badge set (Busy)
  const engagedSet = useMemo(() => {
    const set = new Set<string>();
    for (const r of openReqs) {
      if (r.table_number != null) set.add(String(r.table_number));
      if (r.table_token) set.add(r.table_token.toUpperCase());
    }
    return set;
  }, [openReqs]);

  // search filter
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.number.toString().includes(s) ||
      (r.token || "").toLowerCase().includes(s) ||
      (r.area || "").toLowerCase().includes(s) ||
      (r.status || "").toLowerCase().includes(s)
    );
  }, [rows, search]);

  // edit helpers
  function startEdit(r: TableRow) {
    setEdit(e => ({ ...e, [r.id]: { ...r } }));
  }
  function cancelEdit(id: string) {
    setEdit(e => { const c = { ...e }; delete c[id]; return c; });
  }
  async function save(id: string) {
    const patch = edit[id];
    if (!patch) return;
    await sb.from("restaurant_tables").update({
      number: patch.number,
      token: (patch.token || "").toUpperCase(),
      area: patch.area,
      seats: patch.seats,
      status: patch.status,
      updated_at: new Date().toISOString()
    }).eq("id", id);
    cancelEdit(id);
    await load();
  }

  async function createTable() {
    const n = Number(createDraft.number || 0);
    const t = (createDraft.token || "").toUpperCase().trim();
    if (!n || !t) { alert("Table number and token are required"); return; }
    const { error } = await sb.from("restaurant_tables").insert({
      number: n,
      token: t,
      area: (createDraft.area || "") || null,
      seats: createDraft.seats ?? 2,
      status: (createDraft.status as any) || "available"
    });
    if (error) { alert(error.message); return; }
    setCreating(false);
    setCreateDraft({ number: 0, token: "", area: "", seats: 2, status: "available" });
    await load();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Tables</div>
        {!creating ? (
          <button className="px-3 py-1.5 rounded-lg bg-gold text-white text-sm inline-flex items-center gap-1"
                  onClick={() => setCreating(true)}>
            <Plus className="w-3.5 h-3.5" /> New Table
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input type="number" placeholder="No."
                   className="w-20 border rounded-lg px-2 py-1"
                   value={createDraft.number ?? 0}
                   onChange={e => setCreateDraft(d => ({ ...d, number: parseInt(e.target.value || "0") }))}/>
            <input placeholder="Token"
                   className="w-36 border rounded-lg px-2 py-1"
                   value={createDraft.token ?? ""}
                   onChange={e => setCreateDraft(d => ({ ...d, token: e.target.value }))}/>
            <input placeholder="Area"
                   className="w-28 border rounded-lg px-2 py-1"
                   value={createDraft.area ?? ""}
                   onChange={e => setCreateDraft(d => ({ ...d, area: e.target.value }))}/>
            <input type="number" placeholder="Seats"
                   className="w-20 border rounded-lg px-2 py-1"
                   value={createDraft.seats ?? 2}
                   onChange={e => setCreateDraft(d => ({ ...d, seats: parseInt(e.target.value || "0") }))}/>
            <select className="border rounded-lg px-2 py-1"
                    value={createDraft.status as any}
                    onChange={e => setCreateDraft(d => ({ ...d, status: e.target.value as any }))}>
              <option value="available">available</option>
              <option value="occupied">occupied</option>
              <option value="out_of_service">out_of_service</option>
            </select>
            <button className="px-3 py-1.5 rounded-lg bg-gold text-white text-sm" onClick={createTable}>Create</button>
            <button className="px-3 py-1.5 rounded-lg bg-black/10 text-sm" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(r => {
          const isEditing = !!edit[r.id];
          const e = edit[r.id] as TableRow | undefined;
          const engaged = engagedSet.has(String(r.number)) || engagedSet.has((r.token || "").toUpperCase());
          return (
            <div key={r.id} className="rounded-2xl border border-black/10 p-3">
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <input
                    type="number"
                    className="w-20 border rounded-lg px-2 py-1"
                    value={e?.number ?? r.number}
                    onChange={ev => setEdit(prev => ({ ...prev, [r.id]: { ...e!, number: parseInt(ev.target.value || "0") } }))}
                  />
                ) : (
                  <div className="font-semibold">Table {r.number}</div>
                )}
                <div>
                  {engaged ? (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      <CircleOff className="w-3 h-3" /> Busy
                    </span>
                  ) : r.status === "available" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Free
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-black/70 bg-black/10 px-2 py-0.5 rounded-full">
                      {r.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 text-xs text-black/60">Token</div>
              {isEditing ? (
                <input
                  className="w-full border rounded-lg px-2 py-1"
                  value={e?.token ?? r.token}
                  onChange={ev => setEdit(prev => ({ ...prev, [r.id]: { ...e!, token: ev.target.value } }))}
                />
              ) : (
                <div className="font-mono text-sm">{r.token}</div>
              )}

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-black/60">Area</div>
                  {isEditing ? (
                    <input
                      className="w-full border rounded-lg px-2 py-1"
                      value={e?.area ?? r.area ?? ""}
                      onChange={ev => setEdit(prev => ({ ...prev, [r.id]: { ...e!, area: ev.target.value } }))}
                    />
                  ) : (
                    <div className="text-sm">{r.area || "-"}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-black/60">Seats</div>
                  {isEditing ? (
                    <input
                      type="number"
                      className="w-full border rounded-lg px-2 py-1"
                      value={e?.seats ?? r.seats ?? 0}
                      onChange={ev => setEdit(prev => ({ ...prev, [r.id]: { ...e!, seats: parseInt(ev.target.value || "0") } }))}
                    />
                  ) : (
                    <div className="text-sm">{r.seats ?? "-"}</div>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <div className="text-xs text-black/60">Status</div>
                {isEditing ? (
                  <select
                    className="w-full border rounded-lg px-2 py-1"
                    value={e?.status ?? r.status}
                    onChange={ev => setEdit(prev => ({ ...prev, [r.id]: { ...e!, status: ev.target.value as any } }))}
                  >
                    <option value="available">available</option>
                    <option value="occupied">occupied</option>
                    <option value="out_of_service">out_of_service</option>
                  </select>
                ) : (
                  <div className="text-sm">{r.status}</div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                {!isEditing ? (
                  <button className="px-3 py-1 rounded-lg bg-black/5 text-sm inline-flex items-center gap-1" onClick={() => startEdit(r)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <>
                    <button className="px-3 py-1 rounded-lg bg-gold text-white text-sm inline-flex items-center gap-1" onClick={() => save(r.id)}>
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-black/10 text-sm inline-flex items-center gap-1" onClick={() => cancelEdit(r.id)}>
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
