'use client';

import { useState, useEffect, useMemo } from 'react';
import { Upload, Download, Clock, LayoutList, Kanban } from 'lucide-react';
import Papa from 'papaparse';
import RagFilterCards from '@/components/RagFilterCards';
import AgentTabs from '@/components/AgentTabs';
import FilterBar, { type Filters } from '@/components/FilterBar';
import RagLogicPanel from '@/components/RagLogicPanel';
import AccountTable from '@/components/AccountTable';
import BoardView from '@/components/BoardView';
import ImportModal from '@/components/ImportModal';
import { scoreRooftop, rooftopKey } from '@/lib/ragLogic';
import type { RooftopScored, RagStatus, SalesInboundStatuses, DeploymentStatus, } from '@/lib/ragLogic';
import { EMPTY_SALES_INBOUND_STATUSES } from '@/lib/ragLogic';
import { DEFAULT_ROOFTOPS, DEFAULT_LAST_UPDATED } from '@/lib/defaultData';

const STORAGE_KEY = 'vini_rag_data';
const STORAGE_TS_KEY = 'vini_rag_timestamp';
const STORAGE_DEPLOY_KEY = 'vini_deployment_statuses';

type ViewMode = 'table' | 'board';
type GroupBy = 'tofu' | 'outcome' | 'quality';

export default function DashboardPage() {
  const [rooftops, setRooftops] = useState<RooftopScored[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>(DEFAULT_LAST_UPDATED);
  const [deploymentStatuses, setDeploymentStatuses] = useState<Record<string, SalesInboundStatuses>>({});
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [boardGroupBy, setBoardGroupBy] = useState<GroupBy>('tofu');
  const [activeAgent, setActiveAgent] = useState<string>('Sales Inbound');
  const [accountRagFilter, setAccountRagFilter] = useState<RagStatus | 'ALL'>('ALL');
  const [filters, setFilters] = useState<Filters>({
    search: '', tofu: 'ALL', outcome: 'ALL', quality: 'ALL',
  });

  useEffect(() => {
    // Load rooftop RAG data from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const ts = localStorage.getItem(STORAGE_TS_KEY);
      if (stored) {
        setRooftops(JSON.parse(stored));
        if (ts) setLastUpdated(ts);
      } else {
        setRooftops(DEFAULT_ROOFTOPS.map(scoreRooftop));
      }
    } catch {
      setRooftops(DEFAULT_ROOFTOPS.map(scoreRooftop));
    }
    // Load deployment statuses from Notion API (with localStorage cache fallback)
    fetch('/api/statuses')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setDeploymentStatuses(data);
          try { localStorage.setItem(STORAGE_DEPLOY_KEY, JSON.stringify(data)); } catch {}
        } else {
          // Fall back to localStorage cache while API loads
          try {
            const cached = localStorage.getItem(STORAGE_DEPLOY_KEY);
            if (cached) setDeploymentStatuses(JSON.parse(cached));
          } catch {}
        }
      })
      .catch(() => {
        try {
          const cached = localStorage.getItem(STORAGE_DEPLOY_KEY);
          if (cached) setDeploymentStatuses(JSON.parse(cached));
        } catch {}
      });
  }, []);

  const handleStatusChange = (key: string, field: keyof SalesInboundStatuses, value: DeploymentStatus) => {
    setDeploymentStatuses((prev) => {
      const next = {
        ...prev,
        [key]: { ...EMPTY_SALES_INBOUND_STATUSES, ...prev[key], [field]: value },
      };
      // Optimistic local update
      try { localStorage.setItem(STORAGE_DEPLOY_KEY, JSON.stringify(next)); } catch {}
      // Find rooftop metadata for Notion record
      const r = rooftops.find((rt) => rooftopKey(rt) === key);
      fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rooftopKey: key,
          rooftopName: r?.rooftopName ?? key,
          enterprise: r?.enterpriseName ?? '',
          statuses: next[key],
        }),
      }).catch(console.error);
      return next;
    });
  };

  const handleImport = (scored: RooftopScored[], timestamp: string) => {
    setRooftops(scored);
    setLastUpdated(timestamp);
    setActiveAgent('ALL');
    setAccountRagFilter('ALL');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scored));
      localStorage.setItem(STORAGE_TS_KEY, timestamp);
    } catch {}
  };

  // Rooftops filtered by agent tab (applied before RAG filter cards + search)
  const agentFiltered = useMemo(() => {
    if (activeAgent === 'ALL') return rooftops;
    return rooftops.filter((r) => r.agentType === activeAgent);
  }, [rooftops, activeAgent]);

  const filtered = useMemo(() => {
    return agentFiltered.filter((r) => {
      if (accountRagFilter !== 'ALL' && r.accountRag !== accountRagFilter) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !r.rooftopName.toLowerCase().includes(q) &&
          !r.enterpriseName.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.tofu !== 'ALL' && r.tofu.status !== filters.tofu) return false;
      if (filters.outcome !== 'ALL' && r.outcome.status !== filters.outcome) return false;
      if (filters.quality !== 'ALL' && r.quality.status !== filters.quality) return false;
      return true;
    });
  }, [agentFiltered, accountRagFilter, filters]);

  const handleExport = () => {
    const rows = filtered.map((r, i) => ({
      '#': i + 1,
      Rooftop: r.rooftopName,
      Enterprise: r.enterpriseName,
      'Agent Type': r.agentType,
      'Account RAG': r.accountRag,
      'Total Leads': r.totalLeads,
      'Vini Interactions': r.viniInteractions,
      'Capture Rate': r.captureRate !== null ? `${Math.round(r.captureRate * 100)}%` : '',
      'TOFU RAG': r.tofu.status,
      'TOFU Value': r.tofu.value,
      'Avg Score': r.avgScore !== null ? `${Math.round(r.avgScore)}%` : '',
      'Quality RAG': r.quality.status,
      'Quality Value': r.quality.value,
      Appointments: r.appointments,
      'Appt Rate': r.apptRate !== null ? `${Math.round(r.apptRate * 100)}%` : '',
      'Outcome RAG': r.outcome.status,
      'Outcome Value': r.outcome.value,
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `vini-health-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vini Account Health</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live Rooftop RAG Status</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {lastUpdated}
            </div>
          )}
          <RagLogicPanel />
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Agent tabs — only rendered when multiple agent types exist */}
      <AgentTabs rooftops={rooftops} active={activeAgent} onChange={setActiveAgent} />

      {/* RAG filter cards — counts based on agent-filtered set */}
      <RagFilterCards
        rooftops={agentFiltered}
        active={accountRagFilter}
        onChange={setAccountRagFilter}
      />

      {/* Toolbar: filters + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden flex-shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Table
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-slate-200 ${
              viewMode === 'board' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Board
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400">
        Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of{' '}
        <span className="font-semibold text-slate-600">{rooftops.length}</span> rooftops
      </p>

      {/* View */}
      {viewMode === 'table' ? (
        <AccountTable
          rooftops={filtered}
          showDeploymentCols={activeAgent === 'Sales Inbound'}
          deploymentStatuses={deploymentStatuses}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <BoardView rooftops={filtered} groupBy={boardGroupBy} onGroupByChange={setBoardGroupBy} />
      )}

      {showImport && (
        <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}
