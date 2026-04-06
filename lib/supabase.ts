import { createClient } from '@supabase/supabase-js';
import type { SalesInboundStatuses, DeploymentStatus } from './ragLogic';
import { EMPTY_SALES_INBOUND_STATUSES } from './ragLogic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const TABLE = 'deployment_statuses';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStatuses(row: any): SalesInboundStatuses {
  return {
    smartView:  (row.smart_view  ?? null) as DeploymentStatus,
    stl:        (row.stl         ?? null) as DeploymentStatus,
    afterHours: (row.after_hours ?? null) as DeploymentStatus,
    overflow:   (row.overflow    ?? null) as DeploymentStatus,
    fullDay:    (row.full_day    ?? null) as DeploymentStatus,
    followup14: (row.followup14  ?? null) as DeploymentStatus,
    daily:      (row.daily       ?? null) as DeploymentStatus,
    weekly:     (row.weekly      ?? null) as DeploymentStatus,
    monthly:    (row.monthly     ?? null) as DeploymentStatus,
  };
}

function statusesToRow(
  rooftopKey: string,
  rooftopName: string,
  enterprise: string,
  statuses: SalesInboundStatuses
) {
  return {
    rooftop_key:  rooftopKey,
    rooftop_name: rooftopName,
    enterprise,
    smart_view:  statuses.smartView,
    stl:         statuses.stl,
    after_hours: statuses.afterHours,
    overflow:    statuses.overflow,
    full_day:    statuses.fullDay,
    followup14:  statuses.followup14,
    daily:       statuses.daily,
    weekly:      statuses.weekly,
    monthly:     statuses.monthly,
    updated_at:  new Date().toISOString(),
  };
}

export async function getAllStatuses(): Promise<Record<string, SalesInboundStatuses>> {
  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) throw new Error(`Supabase select failed: ${error.message}`);

  const map: Record<string, SalesInboundStatuses> = {};
  for (const row of data ?? []) {
    map[row.rooftop_key] = rowToStatuses(row);
  }
  return map;
}

export async function upsertStatus(
  rooftopKey: string,
  rooftopName: string,
  enterprise: string,
  statuses: SalesInboundStatuses
): Promise<void> {
  const row = statusesToRow(rooftopKey, rooftopName, enterprise, {
    ...EMPTY_SALES_INBOUND_STATUSES,
    ...statuses,
  });

  const { error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'rooftop_key' });

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
}
