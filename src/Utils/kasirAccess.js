export const canKasirDiGudang = (user, gudangId) => {
  if (!user || !gudangId) return false;
  return user.kasirGudangIds?.includes(gudangId);
};
