const getWaterTargetRange = (weightKg) => {
  const calculated =
    Number.isFinite(Number(weightKg)) && Number(weightKg) > 0
      ? Math.round(Number(weightKg) * 33)
      : 2000;

  return {
    calculated,
    minimum: Math.min(4000, calculated),
    maximum: 4000,
    isCapped: calculated > 4000,
  };
};

module.exports = { getWaterTargetRange };
