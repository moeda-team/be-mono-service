export interface OutletAccessUser {
  userId?: string;
  outletId?: string;
  role?: string;
}

/**
 * Roles that are allowed to access data across every outlet.
 */
export function isAllOutletRole(role?: string): boolean {
  return role === 'ADMIN' || role === 'OWNER';
}

/**
 * Resolve the outlet filter for READ operations (list / detail / report).
 *
 * - ADMIN / OWNER  -> use the outletId requested via query (if any),
 *                     otherwise `undefined` which means "all outlets"
 *                     (Prisma treats `outletId: undefined` as no filter).
 * - EMPLOYEE / STORE_MANAGER -> always forced to their own outletId,
 *                     any client supplied outletId is ignored.
 */
export function resolveOutletFilter(
  user: OutletAccessUser | undefined,
  requestedOutletId?: string,
): string | undefined {
  if (isAllOutletRole(user?.role)) {
    const requested = requestedOutletId?.trim();
    return requested ? requested : undefined;
  }
  return user?.outletId;
}

/**
 * Resolve the outletId for WRITE operations (create / update).
 *
 * Unlike reads, a written row must always belong to a concrete outlet, so this
 * never returns `undefined`.
 *
 * - ADMIN / OWNER  -> may target any outlet via the supplied outletId
 *                     (falls back to their own outletId when omitted).
 * - EMPLOYEE / STORE_MANAGER -> always their own outletId.
 *
 * Returns `undefined` only when no outlet can be determined at all, letting the
 * caller decide how to handle the missing-outlet case.
 */
export function resolveOutletForWrite(
  user: OutletAccessUser | undefined,
  requestedOutletId?: string,
): string | undefined {
  if (isAllOutletRole(user?.role)) {
    const requested = requestedOutletId?.trim();
    return requested ? requested : user?.outletId;
  }
  return user?.outletId;
}
