export async function getUserWatchlist(userId: string) {
  return [];
}

export async function addToWatchlist(item: {
  userId: string;
  symbol: string;
  name: string;
  market?: string;
  targetBuyPrice?: string;
  targetSellPrice?: string;
  notes?: string;
}) {
  return {
    id: Date.now(),
    ...item,
    createdAt: new Date(),
  };
}

export async function removeFromWatchlist(id: number, userId: string) {
  return true;
}
