import test from 'node:test';
import assert from 'node:assert/strict';
import { addNutrients, emptyState, lowStock, nutrientsFor, recipeNutrients, SAMPLE_FOODS } from '../src/domain.js';

test('inclut une sélection de fruits, protéines, légumes et produits laitiers', () => {
  assert.ok(SAMPLE_FOODS.length >= 25);
  assert.ok(SAMPLE_FOODS.some((food) => food.id === 'banana'));
  assert.ok(SAMPLE_FOODS.some((food) => food.id === 'broccoli'));
  assert.ok(SAMPLE_FOODS.some((food) => food.id === 'greek-yogurt'));
});

test('contient les valeurs de la whey configurée à partir du paquet', () => {
  const whey = SAMPLE_FOODS.find((food) => food.id === 'whey');
  assert.deepEqual({ kcal: whey.kcal, protein: whey.protein, carbs: whey.carbs, fat: whey.fat }, { kcal: 384, protein: 72, carbs: 8.4, fat: 6.4 });
});

test('calcule les nutriments au prorata', () => {
  assert.deepEqual(nutrientsFor({ kcal: 100, protein: 10, carbs: 20, fat: 5 }, 150), { kcal: 150, protein: 15, carbs: 30, fat: 7.5 });
});
test('additionne les apports', () => {
  assert.deepEqual(addNutrients([{ kcal: 10, protein: 2 }, { kcal: 20, carbs: 3, fat: 1 }]), { kcal: 30, protein: 2, carbs: 3, fat: 1 });
});
test('signale les stocks au seuil ou en dessous', () => {
  const state = emptyState();
  state.stock[0].quantity = state.stock[0].minimum;
  assert.equal(lowStock(state).length, 1);
});
test('calcule une recette à plusieurs ingrédients à partir du catalogue', () => {
  const state = emptyState();
  assert.deepEqual(recipeNutrients({ ingredients: [{ foodId: 'oats', grams: 50 }, { foodId: 'apple', grams: 100 }] }, state.foods), { kcal: 238, protein: 6.8, carbs: 44, fat: 3.7 });
});
