type Props = { value: number; onInc: () => void; onDec: () => void };
export default function Quantity({ value, onInc, onDec }: Props) {
  return (
    <div className="inline-flex items-center gap-2">
      <button aria-label="Decrease" onClick={onDec} className="btn btn-ghost w-9">-</button>
      <span className="min-w-6 text-center">{value}</span>
      <button aria-label="Increase" onClick={onInc} className="btn btn-primary w-9">+</button>
    </div>
  );
}
