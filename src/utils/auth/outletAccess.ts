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
 * - ADMIN / OWNER  -> may access ANY registered outlet, but is NOT aggregated
 *                     across all outlets by default. The outlet is taken from
 *                     the requested `outletId` (any outlet), falling back to
 *                     their own `outletId` when none is supplied.
 * - EMPLOYEE / STORE_MANAGER -> always forced to their own outletId,
 *                     any client supplied outletId is ignored.
 *
 * Note: this only returns `undefined` (i.e. "all outlets", no filter) for an
 * ADMIN/OWNER who has no own outlet AND supplied no `outletId`. Clients should
 * send a concrete `outletId` for such users to keep results scoped to one outlet.
 */
export function resolveOutletFilter(
  user: OutletAccessUser | undefined,
  requestedOutletId?: string,
): string | undefined {
  if (isAllOutletRole(user?.role)) {
    const requested = requestedOutletId?.trim();
    return requested ? requested : user?.outletId;
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
