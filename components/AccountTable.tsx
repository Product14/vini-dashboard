'use client';

import RagBadge, { RAG_TEXT } from './RagBadge';
import type { RooftopScored } from '@/lib/ragLogic';

interface Props {
  rooftops: RooftopScored[];
}

function fmt(n: number | null): string {
  if (n === null) return '—';
  return n.toLocaleString('en-US');
}
function fmtPct(n: number | null): string {
  if (n === null) return '—';
  return `${Math.round(n * 100)}%`;
}
function fmtScore(n: number | null): string {
  if (n === null) return '—';
  return `${Math.round(n)}%`;
}

const TH = 'px-2 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide text-left whitespace-nowrap';
const TD = 'px-2 py-1.5 align-middle';

export default function AccountTable({ rooftops }: Props) {
  if (rooftops.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 border border-slate-200 rounded-xl bg-white">
        <p className="text-sm">No rooftops match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* Group header row */}
            <tr className="bg-slate-50 border-b border-slate-200">
              <th colSpan={2} className="px-2 py-1 border-r border-slate-200" />
              <th colSpan={4} className="px-2 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wider text-center border-r border-slate-200 bg-blue-50">
                TOFU
              </th>
              <th colSpan={2} className="px-2 py-1 text-[10px] font-bold text-purple-700 uppercase tracking-wider text-center border-r border-slate-200 bg-purple-50">
                Quality
              </th>
              <th colSpan={3} className="px-2 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider text-center bg-emerald-50">
                ROI
              </th>
            </tr>
            {/* Column header row */}
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className={`${TH} min-w-[140px]`}>Rooftop</th>
              <th className={`${TH} border-r border-slate-200`}>Account RAG</th>

              <th className={`${TH} bg-blue-50/50`}>Leads</th>
              <th className={`${TH} bg-blue-50/50`}>Interactions</th>
              <th className={`${TH} bg-blue-50/50`}>Capture</th>
              <th className={`${TH} bg-blue-50/50 border-r border-slate-200`}>RAG</th>

              <th className={`${TH} bg-purple-50/50`}>Score</th>
              <th className={`${TH} bg-purple-50/50 border-r border-slate-200`}>RAG</th>

              <th className={`${TH} bg-emerald-50/50`}>Appts</th>
              <th className={`${TH} bg-emerald-50/50`}>Rate</th>
              <th className={`${TH} bg-emerald-50/50`}>RAG</th>
            </tr>
          </thead>
          <tbody>
            {rooftops.map((r) => {
              const key = `${r.enterpriseName}::${r.rooftopName}`;
              const capturePct = r.captureRate !== null ? `${Math.round(r.captureRate * 100)}%` : '—';

              return (
                <tr
                  key={key}
                  className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors ${
                    r.hasAnyRed ? 'bg-red-50/25' : ''
                  }`}
                >
                  <td className={`${TD} min-w-[140px]`}>
                    <p className="font-semibold text-slate-800 leading-tight">{r.rooftopName}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[180px] leading-tight mt-0.5">{r.enterpriseName}</p>
                  </td>

                  <td className={`${TD} border-r border-slate-100`}>
                    <RagBadge status={r.accountRag} size="sm" />
                  </td>

                  {/* TOFU */}
                  <td className={`${TD} bg-blue-50/20 text-slate-600`}>{fmt(r.totalLeads)}</td>
                  <td className={`${TD} bg-blue-50/20 text-slate-600`}>{fmt(r.viniInteractions)}</td>
                  <td className={`${TD} bg-blue-50/20`}>
                    <span className={`font-bold ${RAG_TEXT[r.tofu.status]}`}>{capturePct}</span>
                  </td>
                  <td className={`${TD} bg-blue-50/20 border-r border-slate-100`}>
                    <RagBadge status={r.tofu.status} size="sm" />
                  </td>

                  {/* Quality */}
                  <td className={`${TD} bg-purple-50/20`}>
                    <span className={`font-bold ${RAG_TEXT[r.quality.status]}`}>{fmtScore(r.avgScore)}</span>
                  </td>
                  <td className={`${TD} bg-purple-50/20 border-r border-slate-100`}>
                    <RagBadge status={r.quality.status} size="sm" />
                  </td>

                  {/* ROI */}
                  <td className={`${TD} bg-emerald-50/20 text-slate-600`}>{fmt(r.appointments)}</td>
                  <td className={`${TD} bg-emerald-50/20`}>
                    <span className={`font-bold ${RAG_TEXT[r.outcome.status]}`}>{fmtPct(r.apptRate)}</span>
                  </td>
                  <td className={`${TD} bg-emerald-50/20`}>
                    <RagBadge status={r.outcome.status} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
