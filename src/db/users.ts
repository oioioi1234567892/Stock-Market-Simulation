import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}
