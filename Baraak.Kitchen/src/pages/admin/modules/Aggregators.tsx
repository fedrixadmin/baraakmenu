type Props = { search: string; };

export default function Aggregators({ }: Props) {
  return (
    <div className="card p-4">
      <div className="font-semibold mb-2">Aggregators</div>
      <div className="text-sm text-black/60">Zomato / Talabat / Deliveroo integrations (coming soon).</div>
    </div>
  );
}
