import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';

async function run() {
  await db.update(users).set({ role: 'SUPER_ADMIN' });
  console.log("Updated all existing users to SUPER_ADMIN");
  process.exit(0);
}
run();
