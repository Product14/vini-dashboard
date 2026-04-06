import type { SalesInboundStatuses, DeploymentStatus } from './ragLogic';
import { EMPTY_SALES_INBOUND_STATUSES } from './ragLogic';

const TOKEN = process.env.NOTION_TOKEN!;
const DB_ID = process.env.NOTION_DEPLOY_DB_ID!;
const NOTION_VERSION = '2022-06-28';

function notionHeaders() {
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

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
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Notion query failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const page of data.results as any[]) {
      const key: string = page.properties['Rooftop Key']?.title?.[0]?.plain_text ?? '';
      if (key) map[key] = pageToStatuses(page);
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return map;
}

function buildProperties(
  rooftopKey: string,
  rooftopName: string,
  enterprise: string,
  statuses: SalesInboundStatuses
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {
    'Rooftop Key':  { title: [{ text: { content: rooftopKey } }] },
    'Rooftop Name': { rich_text: [{ text: { content: rooftopName } }] },
    'Enterprise':   { rich_text: [{ text: { content: enterprise } }] },
  };
  for (const [key, propName] of Object.entries(KEY_TO_PROP)) {
    const val = statuses[key as keyof SalesInboundStatuses];
    props[propName] = val ? { select: { name: val } } : { select: null };
  }
  return props;
}

export async function upsertStatus(
  rooftopKey: string,
  rooftopName: string,
  enterprise: string,
  statuses: SalesInboundStatuses
): Promise<void> {
  // Find existing page
  const queryRes = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      filter: { property: 'Rooftop Key', title: { equals: rooftopKey } },
      page_size: 1,
    }),
  });

  if (!queryRes.ok) {
    const err = await queryRes.text();
    throw new Error(`Notion query failed: ${queryRes.status} ${err}`);
  }

  const queryData = await queryRes.json();
  const properties = buildProperties(rooftopKey, rooftopName, enterprise, statuses);

  if (queryData.results.length > 0) {
    const pageId = queryData.results[0].id;
    const updateRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: notionHeaders(),
      body: JSON.stringify({ properties }),
    });
    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`Notion update failed: ${updateRes.status} ${err}`);
    }
  } else {
    const createRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify({
        parent: { database_id: DB_ID },
        properties,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Notion create failed: ${createRes.status} ${err}`);
    }
  }
}
