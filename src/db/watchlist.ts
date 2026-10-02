import { db } from './index.ts';
import { watchlists } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export interface WatchlistInput {
  userId: string;
  symbol: string;
  name: string;
  market?: string;
  targetBuyPrice?: string;
  targetSellPrice?: string;
  notes?: string;
}

export async function getUserWatchlist(userId: string) {
  try {
    return await db.select().from(watchlists).where(eq(watchlists.userId, userId)).orderBy(desc(watchlists.createdAt));
  } catch (error) {
    console.error('Database getUserWatchlist failed:', error);
    throw new Error('Failed to fetch watchlist', { cause: error });
  }
}

export async function addToWatchlist(item: WatchlistInput) {
  try {
    // Check if already in watchlist for this user
    const existing = await db.select().from(watchlists).where(
      and(eq(watchlists.userId, item.userId), eq(watchlists.symbol, item.symbol))
    );

    if (existing.length > 0) {
      const updated = await db.update(watchlists)
        .set({
          name: item.name,
          market: item.market || 'TWSE',
          targetBuyPrice: item.targetBuyPrice || null,
          targetSellPrice: item.targetSellPrice || null,
          notes: item.notes || null,
        })
        .where(eq(watchlists.id, existing[0].id))
        .returning();
      return updated[0];
    }

    const inserted = await db.insert(watchlists)
      .values({
        userId: item.userId,
        symbol: item.symbol,
        name: item.name,
        market: item.market || 'TWSE',
        targetBuyPrice: item.targetBuyPrice || null,
        targetSellPrice: item.targetSellPrice || null,
        notes: item.notes || null,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database addToWatchlist failed:', error);
    throw new Error('Failed to save to watchlist', { cause: error });
  }
}

export async function removeFromWatchlist(id: number, userId: string) {
  try {
    return await db.delete(watchlists).where(
      and(eq(watchlists.id, id), eq(watchlists.userId, userId))
    ).returning();
  } catch (error) {
    console.error('Database removeFromWatchlist failed:', error);
    throw new Error('Failed to delete from watchlist', { cause: error });
  }
}
