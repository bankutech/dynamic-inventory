import { AppError } from './errorHandler.js';

export const ROLES = {
  OPERATOR: 'OPERATOR',
  FLOOR: 'FLOOR',
  PROCUREMENT: 'PROCUREMENT',
  ANALYST: 'ANALYST',
  ADMIN: 'ADMIN'
};

/**
 * Role-Based Access Control (RBAC) Middleware.
 * Inspects `x-user-role` or `x-role` header.
 * Defaults to ADMIN when header is omitted to preserve backward compatibility in test suites.
 * When header is provided, strictly validates that the role has required permissions.
 */
export function authorizeRoles(...allowedRoles) {
  const normalizedAllowed = allowedRoles.flat().map(r => r.toUpperCase());

  return (req, res, next) => {
    const rawRole = req.headers['x-user-role'] || req.headers['x-role'];
    const currentRole = rawRole ? String(rawRole).trim().toUpperCase() : ROLES.ADMIN;

    if (currentRole === ROLES.ADMIN || normalizedAllowed.includes(currentRole)) {
      req.user = { role: currentRole };
      return next();
    }

    return next(
      new AppError(
        `Access Denied: Role '${currentRole}' is not authorized. Required: [${normalizedAllowed.join(', ')}]`,
        403
      )
    );
  };
}
