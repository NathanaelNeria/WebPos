// src/utils/roleAccess.js
export const ROLE_ACCESS = {
  owner: ["owner", "admin", "kasir"],
  admin: ["admin", "kasir"],
  kasir: ["kasir"],
};

export const canAccess = (userRole, required) => {
  return ROLE_ACCESS[userRole]?.includes(required);
};
