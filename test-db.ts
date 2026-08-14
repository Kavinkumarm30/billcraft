import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function run() {
  const allUsers = await db.select().from(users).where(eq(users.email, 'kavinkumar.m30@gmail.com'));
  console.log(allUsers);
  process.exit(0);
}
run();
