export const familyKeys = {
  all: ["families"] as const,
  userFamilies: (userId: string) =>
    [...familyKeys.all, "user", userId] as const,
  detail: (familyId: string) => [...familyKeys.all, familyId] as const,
};
