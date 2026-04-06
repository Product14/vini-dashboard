import { Client } from '@notionhq/client';
import type { SalesInboundStatuses, DeploymentStatus } from './ragLogic';
import { EMPTY_SALES_INBOUND_STATUSES } from './ragLogic';

export const notion = new Client({ auth: process.env.NOTION_TOKEN });
export const DB_ID = process.env.NOTION_DEPLOY_DB_ID!;

// Notion property name → SalesInboundStatuses key
const PROP_TO_KEY: Record<string, keyof SalesInboundStatuses> = {
  'SmartView':       'smartView',
  'STL':             'stl',
  'After-Hours':     'afterHours',
  'Overflow':        'overflow',
  'Full Day':        'fullDay',
  '14-Day Followup': 'followup14',
  'Daily':           'daily',
  'Weekly':          'weekly',
  'Monthly':         'monthly',
};

const KEY_TO_PROP = Object.fromEntries(
  Object.entries(PROP_TO_KEY).map(([p, k]) => [k, p])
) as Record<keyof SalesInboundStatuses, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToStatuses(page: any): SalesInboundStatuses {
  const props = page.properties;
  const result = { ...EMPTY_SALES_INBOUND_STATUSES };
  for (const [prop, key] of Object.entries(PROP_TO_KEY)) {
    const val = props[prop]?.select?.name ?? null;
    result[key] = val as DeploymentStatus;
  }
  return result;
}

export async function getAllStatuses(): Promise<Record<string, SalesInboundStatuses>> {
  const map: Record<string, SalesInboundStatuses> = {};
  let cursor: string | undefined;
  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion as any).databases.query({
      database_id: DB_ID,
      start_cursor: cursor,
      page_size: 100,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const page of res.results as any[]) {
      const key: string = page.properties['Rooftop Key']?.title?.[0]?.plain_text ?? '';
      if (key) map[key] = pageToStatuses(page);
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return map;
}

export async function upsertStatus(
  rooftopKey: string,
  rooftopName: string,
  enterprise: string,
  statuses: SalesInboundStatuses
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (notion as any).databases.query({
    database_id: DB_ID,
    filter: { property: 'Rooftop Key', title: { equals: rooftopKey } },
    page_size: 1,
  });

  // Build properties as any to avoid Notion SDK's overly strict types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: any = {
    'Rooftop Key':  { title: [{ text: { content: rooftopKey } }] },
    'Rooftop Name': { rich_text: [{ text: { content: rooftopName } }] },
    'Enterprise':   { rich_text: [{ text: { content: enterprise } }] },
  };
  for (const [key, propName] of Object.entries(KEY_TO_PROP)) {
    const val = statuses[key as keyof SalesInboundStatuses];
    props[propName] = val ? { select: { name: val } } : { select: null };
  }

  if (existing.results.length > 0) {
    await notion.pages.update({ page_id: existing.results[0].id, properties: props });
  } else {
    await notion.pages.create({ parent: { database_id: DB_ID }, properties: props });
  }
}
