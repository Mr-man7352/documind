// Shared role constants — safe to import from both server and client code

export const VALID_ROLES = ["owner", "admin", "member", "viewer"] as const;

export const ROLE_HIERARCHY: Record<(typeof VALID_ROLES)[number], number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};
