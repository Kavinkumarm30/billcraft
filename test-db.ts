import { Pool } from 'pg';

const regions = [
  'ap-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'eu-north-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'sa-east-1',
  'ca-central-1',
  'me-central-1',
  'af-south-1'
];

async function check() {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    const p = new Pool({
      host,
      port: 6543,
      user: 'postgres.ikdacyqhpwwxxxjkuicd',
      password: '#Akshay0107',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
    });

    try {
      const res = await p.query('SELECT 1 as val');
      console.log(`\n🎉🎉🎉 SUCCESSFUL REGION: ${r} (${host}) 🎉🎉🎉\n`);
      await p.end();
      return host;
    } catch (e: any) {
      console.log(`[${r}] ${e.message}`);
      await p.end();
    }
  }
}

check();
