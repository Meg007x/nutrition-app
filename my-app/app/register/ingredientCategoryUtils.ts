const OTHER_CATEGORY_NAMES = new Set(["อื่นๆ", "อื่น", "other", "others"]);

export function isOtherIngredientCategory(category: { id?: string; name?: string }) {
  const normalized = [category.name, category.id]
    .filter(Boolean)
    .map((value) => String(value).toLocaleLowerCase().replace(/\s/g, ""));

  return normalized.some((value) => OTHER_CATEGORY_NAMES.has(value));
}
