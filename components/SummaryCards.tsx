import type { RooftopScored } from '@/lib/ragLogic';

interface Props {
  rooftops: RooftopScored[];
}

export default function SummaryCards({ rooftops }: Props) {
  const total = rooftops.length;
  const tofuRed = rooftops.filter((r) => r.tofu.status === 'RED').length;
  const outcomeRed = rooftops.filter((r) => r.outcome.status === 'RED').length;
  const qualityRed = rooftops.filter((r) => r.quality.status === 'RED').length;

  const cards = [
    {
      label: 'Live Rooftops',
      value: total,
      sub: 'in this dataset',
      color: 'text-slate-800',
      border: 'border-slate-200',
      bg: 'bg-white',
    },
    {
      label: 'TOFU Red',
      value: tofuRed,
      sub: 'routing issues',
      color: 'text-red-600',
      border: 'border-red-200',
      bg: 'bg-red-50',
    },
    {
      label: 'Outcome Red',
      value: outcomeRed,
      sub: 'not converting',
      color: 'text-red-600',
      border: 'border-red-200',
      bg: 'bg-red-50',
    },
    {
      label: 'Quality Red',
      value: qualityRed,
      sub: 'call issues',
      color: 'text-red-600',
      border: 'border-red-200',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} ${card.bg} px-5 py-4`}
        >
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
          <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
