export async function getOrCreateUser(uid: string, email?: string, displayName?: string | null) {
  return {
    uid,
    email: email || `${uid}@trader.app`,
    displayName: displayName || '操盤手會員',
    updatedAt: new Date(),
  };
}
