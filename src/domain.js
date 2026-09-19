export const SAMPLE_FOODS = [
  { id: 'oats', name: 'Flocons d’avoine', unit: 'g', kcal: 372, protein: 13, carbs: 60, fat: 7 },
  { id: 'apple', name: 'Pomme', unit: 'g', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { id: 'chicken', name: 'Blanc de poulet cuit', unit: 'g', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'rice', name: 'Riz cuit', unit: 'g', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'yogurt', name: 'Yaourt nature', unit: 'g', kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3 }
];

export const emptyState = () => ({
  targets: { kcal: '', protein: '', carbs: '', fat: '' },
  foods: SAMPLE_FOODS,
  logs: [],
  recipes: [],
  stock: [
    { id: 'stock-oats', foodId: 'oats', quantity: 250, minimum: 150 },
    { id: 'stock-rice', foodId: 'rice', quantity: 80, minimum: 200 }
  ],
  shopping: []
});

export function nutrientsFor(food, grams) {
  const ratio = Number(grams) / 100;
  return ['kcal', 'protein', 'carbs', 'fat'].reduce((result, key) => {
    result[key] = Number(((food[key] || 0) * ratio).toFixed(1));
    return result;
  }, {});
}

export function addNutrients(items) {
  return items.reduce((total, item) => ['kcal', 'protein', 'carbs', 'fat'].reduce((next, key) => {
    next[key] += Number(item[key] || 0);
    return next;
  }, total), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

export function recipeNutrients(recipe, foods) {
  return addNutrients(recipe.ingredients.map((ingredient) => {
    const food = foods.find((entry) => entry.id === ingredient.foodId);
    return food ? nutrientsFor(food, ingredient.grams) : {};
  }));
}

export function lowStock(state) {
  return state.stock.filter((item) => Number(item.quantity) <= Number(item.minimum));
}

export function foodName(state, foodId) {
  return state.foods.find((food) => food.id === foodId)?.name || 'Aliment supprimé';
}
