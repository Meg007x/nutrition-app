export const getWaterTargetRange = (weightKg: number) => {
  const calculated = Number.isFinite(weightKg) && weightKg > 0
    ? Math.round(weightKg * 33)
    : 2000;

  return {
    calculated,
    minimum: Math.min(4000, calculated),
    maximum: 4000,
    isCapped: calculated > 4000,
  };
};
