'use client';

import RagBadge, { RAG_TEXT } from './RagBadge';
import type { RooftopScored, RagStatus, SalesInboundStatuses, DeploymentStatus } from '@/lib/ragLogic';
import { DEPLOYMENT_STATUS_OPTIONS, EMPTY_SALES_INBOUND_STATUSES, rooftopKey } from '@/lib/ragLogic';

interface Props {
  rooftops: RooftopScored[];
  showDeploymentCols?: boolean;
  deploymentStatuses?: Record<string, SalesInboundStatuses>;
  onStatusChange?: (key: string, field: keyof SalesInboundStatuses, value: DeploymentStatus) => void;
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

const ACCT_BORDER: Record<RagStatus, string> = {
  GREEN: 'border-l-green-500',
  AMBER: 'border-l-amber-400',
  RED:   'border-l-red-500',
  'N/A': 'border-l-slate-200',
};

const DEPLOY_BG: Record<string, string> = {
  'Live':        'bg-green-50 text-green-700',
  'In Progress': 'bg-amber-50 text-amber-700',
  'Approval':    'bg-amber-50 text-amber-700',
  'Declined':    'bg-red-50 text-red-700',
  'Not Live':    'bg-red-50 text-red-700',
};

const TH = 'px-2 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide text-left whitespace-nowrap';
const TD = 'px-2 py-1.5 align-middle';

const TOFU_DEPLOY_COLS: { key: keyof SalesInboundStatuses; label: string }[] = [
  { key: 'smartView',  label: 'SmartView'  },
  { key: 'stl',        label: 'STL'        },
  { key: 'afterHours', label: 'After-Hours' },
  { key: 'overflow',   label: 'Overflow'   },
  { key: 'fullDay',    label: 'Full Day'   },
  { key: 'followup14', label: '14-Day'     },
];

const ROI_DEPLOY_COLS: { key: keyof SalesInboundStatuses; label: string }[] = [
  { key: 'daily',   label: 'Daily'   },
  { key: 'weekly',  label: 'Weekly'  },
  { key: 'monthly', label: 'Monthly' },
];

function StatusCell({
  value,
  onChange,
}: {
  value: DeploymentStatus;
  onChange: (v: DeploymentStatus) => void;
}) {
  const colorClass = value ? DEPLOY_BG[value] : 'text-slate-300';
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value as DeploymentStatus) || null)}
      className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border-0 outline-none cursor-pointer w-full min-w-[80px] ${colorClass} bg-transparent`}
      style={{ appearance: 'none' }}
    >
      <option value="">—</option>
      {DEPLOYMENT_STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.value}</option>
      ))}
    </select>
  );
}

export default function AccountTable({ rooftops, showDeploymentCols = false, deploymentStatuses = {}, onStatusChange }: Props) {
  if (rooftops.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 border border-slate-200 rounded-xl bg-white">
        <p className="text-sm">No rooftops match the current filters.</p>
      </div>
    );
  }

  const tofuColSpan = showDeploymentCols ? 4 + TOFU_DEPLOY_COLS.length : 4;
  const roiColSpan  = showDeploymentCols ? 3 + ROI_DEPLOY_COLS.length  : 3;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* Group header row */}
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-2 py-1 border-r border-slate-200" />
              <th colSpan={tofuColSpan} className="px-2 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wider text-center border-r border-slate-200 bg-blue-50">
                TOFU
              </th>
              <th colSpan={2} className="px-2 py-1 text-[10px] font-bold text-purple-700 uppercase tracking-wider text-center border-r border-slate-200 bg-purple-50">
                Quality
              </th>
              <th colSpan={roiColSpan} className="px-2 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider text-center bg-emerald-50">
                ROI
              </th>
            </tr>
            {/* Column header row */}
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className={`${TH} min-w-[160px] border-r border-slate-200`}>Rooftop</th>

              <th className={`${TH} bg-blue-50/50`}>Leads</th>
              <th className={`${TH} bg-blue-50/50`}>Interactions</th>
              <th className={`${TH} bg-blue-50/50`}>Capture</th>
              <th className={`${TH} bg-blue-50/50 ${showDeploymentCols ? '' : 'border-r border-slate-200'}`}>RAG</th>
              {showDeploymentCols && TOFU_DEPLOY_COLS.map((col, i) => (
                <th key={col.key} className={`${TH} bg-blue-50/50 ${i === TOFU_DEPLOY_COLS.length - 1 ? 'border-r border-slate-200' : ''}`}>
                  {col.label}
                </th>
              ))}

              <th className={`${TH} bg-purple-50/50`}>Score</th>
              <th className={`${TH} bg-purple-50/50 border-r border-slate-200`}>RAG</th>

              <th className={`${TH} bg-emerald-50/50`}>Appts</th>
              <th className={`${TH} bg-emerald-50/50`}>Rate</th>
              <th className={`${TH} bg-emerald-50/50 ${showDeploymentCols ? '' : ''}`}>RAG</th>
              {showDeploymentCols && ROI_DEPLOY_COLS.map((col) => (
                <th key={col.key} className={`${TH} bg-emerald-50/50`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooftops.map((r) => {
              const key = rooftopKey(r);
              const capturePct = r.captureRate !== null ? `${Math.round(r.captureRate * 100)}%` : '—';
              const statuses: SalesInboundStatuses = { ...EMPTY_SALES_INBOUND_STATUSES, ...deploymentStatuses[key] };

              return (
                <tr
                  key={key}
                  className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors ${
                    r.hasAnyRed ? 'bg-red-50/25' : ''
                  }`}
                >
                  {/* Rooftop name — left border color = accountRag */}
                  <td className={`${TD} border-l-4 ${ACCT_BORDER[r.accountRag]} min-w-[160px] border-r border-slate-100`}>
                    <p className="font-semibold text-slate-800 leading-tight">{r.rooftopName}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px] leading-tight mt-0.5">{r.enterpriseName}</p>
                  </td>

                  {/* TOFU */}
                  <td className={`${TD} bg-blue-50/20 text-slate-600`}>{fmt(r.totalLeads)}</td>
                  <td className={`${TD} bg-blue-50/20 text-slate-600`}>{fmt(r.viniInteractions)}</td>
                  <td className={`${TD} bg-blue-50/20`}>
                    <span className={`font-bold ${RAG_TEXT[r.tofu.status]}`}>{capturePct}</span>
                  </td>
                  <td className={`${TD} bg-blue-50/20 ${showDeploymentCols ? '' : 'border-r border-slate-100'}`}>
                    <RagBadge status={r.tofu.status} size="sm" />
                  </td>
                  {showDeploymentCols && TOFU_DEPLOY_COLS.map((col, i) => (
                    <td key={col.key} className={`${TD} bg-blue-50/10 ${i === TOFU_DEPLOY_COLS.length - 1 ? 'border-r border-slate-100' : ''}`}>
                      <StatusCell
                        value={statuses[col.key]}
                        onChange={(v) => onStatusChange?.(key, col.key, v)}
                      />
                    </td>
                  ))}

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
                  {showDeploymentCols && ROI_DEPLOY_COLS.map((col) => (
                    <td key={col.key} className={`${TD} bg-emerald-50/10`}>
                      <StatusCell
                        value={statuses[col.key]}
                        onChange={(v) => onStatusChange?.(key, col.key, v)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
