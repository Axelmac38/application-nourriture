import { addNutrients, emptyState, foodName, lowStock, nutrientsFor, recipeNutrients, SAMPLE_FOODS } from './domain.js?v=20260919-43';

const STORAGE_KEY = 'repas-stock-v1';
const TEST_MEAL_VERSION = 'eggs-cheese-mayo-20260919';
const SAMPLE_RECIPES_VERSION = 'sample-recipes-20260920-v2';
const STOCK_VERSION = 'stock-axel-20260919-v4';
const PRICE_HISTORY_VERSION = 'lidl-prices-20260919-v3';
const PRICE_RECORDS = [
  ['Flocons d’avoine', '2025-11-26', 0.85, 3], ['Flocons d’avoine', '2026-05-23', 0.79, 2],
  ['Lentilles vertes', '2025-11-26', 1.63, 3], ['Coquillettes 1 kg', '2025-11-26', 1.05, 2], ['Coquillettes 1 kg', '2025-12-01', 1.03, 3], ['Coquillettes 1 kg', '2026-01-30', 0.97, 3],
  ['Mayonnaise', '2025-12-01', 1.60, 1], ['Mayonnaise', '2026-01-30', 1.52, 1],
  ['Fromage blanc', '2025-11-26', 1.79, 6], ['Fromage blanc', '2026-01-30', 1.79, 4],
  ['Emmental râpé', '2025-11-26', 3.74, 1], ['Emmental râpé', '2026-01-30', 1.22, 1],
  ['Pain de mie', '2025-11-26', 1.51, 1], ['Pain de mie', '2026-01-30', 1.48, 1],
  ['Crème fraîche épaisse', '2025-11-26', 1.72, 2], ['Crème fraîche épaisse', '2026-01-30', 1.72, 1],
  ['Pesto rosso', '2025-11-26', 1.33, 2], ['Pesto genovese', '2025-11-26', 1.33, 1],
  ['Côtes de porc échine', '2025-11-26', 5.29, 1], ['Lardons nature', '2025-11-26', 1.20, 1],
  ['Chipolatas / saucisses de Toulouse', '2025-11-26', 3.99, 1], ['Fromage bleu 55 % MG', '2025-11-26', 2.29, 1],
  ['Kaki', '2025-11-26', 0.69, 4], ['Cuisses de poulet blanc', '2026-01-30', 6.93, 1],
  ['Jus d’orange', '2026-01-30', 2.78, 1], ['Ail 250 g', '2026-01-30', 1.89, 1],
  ['Salade de céleri', '2026-01-30', 1.50, 1], ['Sauce tomate variée', '2026-01-30', 1.38, 1],
  ['Citron 500 g', '2026-01-30', 0.99, 1], ['Moutarde de Dijon', '2026-01-30', 0.84, 1],
  ['Colossus Energy Drink', '2026-09-11', 0.69, 2], ['Sac isotherme', '2026-09-11', 1.39, 1],
  ['Banane 4 fruits', '2026-09-11', 0.79, 1], ['Salade de concombres', '2026-09-11', 2.49, 1],
  ['Salade de céleri', '2026-09-11', 1.58, 1], ['Sandwich poulet', '2026-09-11', 1.15, 1],
  ['Sandwich jambon', '2026-09-11', 1.15, 1], ['Saucisse de Toulouse', '2026-09-11', 5.89, 1],
  ['Crème fraîche épaisse', '2026-09-11', 1.72, 1], ['Allumettes de porc', '2026-09-11', 1.69, 1],
  ['Oignon rouge', '2026-09-11', 0.95, 1],
  ['Filtre à eau classe A', '2026-03-16', 4.40, 1]
].map(([name, date, price, quantity]) => ({ name, date, price, quantity }));
const NON_FOOD_ITEMS = ['Filtre à eau classe A'];
const PRICE_MEASURES = {
  'Flocons d’avoine': 1000, 'Coquillettes 1 kg': 1000, 'Lentilles vertes': 500,
  'Fromage blanc': 1000, 'Emmental râpé': 500, 'Mayonnaise': 500,
  'Ail 250 g': 250, 'Citron 500 g': 500
};
const STOCK_PURCHASE_QUANTITIES = { rice: 1000, pasta: 1000, 'lentils-red': 450, 'lentils-green': 500, oats: 1000, flour: 1000, emmental: 500, mayonnaise: 500, egg: 20 };
const app = document.querySelector('#app');
let state = loadState();
state.unitPreferences = state.unitPreferences || {};
state.water = state.water || {};
state.waterBottleSize = Number(state.waterBottleSize) || 600;
state.shoppingUnitPreferences = state.shoppingUnitPreferences || {};
state.defaultMeal = state.defaultMeal || 'Petit-déjeuner';
let view = 'journal';
let toast = '';
let journalComposerOpen = false;
let openShoppingCategories = new Set();
let recipeEditorId = null;
const MEAL_DISPLAY_ORDER = { Dîner: 0, Repas: 1, Collation: 2, Déjeuner: 3, 'Petit-déjeuner': 4 };

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved?.foods) {
      const next = emptyState();
      next.unitPreferences = {};
      next.logs = testMealLogs(next.foods);
      next.recipes = sampleRecipes();
      next.testMealVersion = TEST_MEAL_VERSION;
      next.sampleRecipesVersion = SAMPLE_RECIPES_VERSION;
      next.stockVersion = STOCK_VERSION;
      next.priceHistoryVersion = PRICE_HISTORY_VERSION;
      next.priceRecords = PRICE_RECORDS.filter((item) => !NON_FOOD_ITEMS.includes(item.name));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    }
    const knownIds = new Set(saved.foods.map((food) => food.id));
    const next = { ...saved, foods: [...saved.foods, ...SAMPLE_FOODS.filter((food) => !knownIds.has(food.id))] };
    next.unitPreferences = next.unitPreferences || {};
    next.foods.forEach((food) => { const catalogFood = SAMPLE_FOODS.find((item) => item.id === food.id); if (catalogFood?.price) Object.assign(food, { price: catalogFood.price, priceQuantity: catalogFood.priceQuantity, priceUnit: catalogFood.priceUnit }); });
    if (next.sampleRecipesVersion !== SAMPLE_RECIPES_VERSION) {
      next.recipes = [...(next.recipes || []), ...sampleRecipes().filter((recipe) => !(next.recipes || []).some((item) => item.id === recipe.id))];
      next.sampleRecipesVersion = SAMPLE_RECIPES_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    if (next.stockVersion !== STOCK_VERSION) {
      next.stock = emptyState().stock;
      next.stockVersion = STOCK_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    if (next.priceHistoryVersion !== PRICE_HISTORY_VERSION) { next.priceHistoryVersion = PRICE_HISTORY_VERSION; next.priceRecords = PRICE_RECORDS.filter((item) => !NON_FOOD_ITEMS.includes(item.name)); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    const currentWhey = next.foods.find((food) => food.id === 'whey');
    const packageWhey = SAMPLE_FOODS.find((food) => food.id === 'whey');
    if (currentWhey?.name.includes('valeur générique')) Object.assign(currentWhey, packageWhey);
    const currentEmmental = next.foods.find((food) => food.id === 'emmental');
    const packageEmmental = SAMPLE_FOODS.find((food) => food.id === 'emmental');
    if (currentEmmental && packageEmmental) Object.assign(currentEmmental, packageEmmental);
    const currentRedLentils = next.foods.find((food) => food.id === 'lentils-red');
    const packageRedLentils = SAMPLE_FOODS.find((food) => food.id === 'lentils-red');
    if (currentRedLentils && packageRedLentils) Object.assign(currentRedLentils, packageRedLentils);
    ['egg', 'lentils-green'].forEach((id) => { const current = next.foods.find((food) => food.id === id); const catalog = SAMPLE_FOODS.find((food) => food.id === id); if (current && catalog) Object.assign(current, catalog); });
    if (next.testMealVersion !== TEST_MEAL_VERSION) {
      next.logs = testMealLogs(next.foods);
      next.testMealVersion = TEST_MEAL_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  } catch { return emptyState(); }
}
function sampleRecipes() {
  return [
    { id: 'recipe-carbonara', name: 'Pâtes carbonara', ingredients: [{ foodId: 'pasta', grams: 250 }, { foodId: 'egg', grams: 100 }, { foodId: 'emmental', grams: 30 }] },
    { id: 'recipe-omelette-emmental', name: 'Omelette à l’emmental', ingredients: [{ foodId: 'egg', grams: 150 }, { foodId: 'emmental', grams: 30 }] },
    { id: 'recipe-oat-pancakes', name: 'Pancakes avoine', ingredients: [{ foodId: 'oats', grams: 60 }, { foodId: 'flour', grams: 40 }, { foodId: 'egg', grams: 50 }] },
    { id: 'recipe-rice-lentil-salad', name: 'Salade de riz et lentilles', ingredients: [{ foodId: 'rice', grams: 200 }, { foodId: 'lentils-green', grams: 100 }, { foodId: 'mayonnaise', grams: 15 }] },
    { id: 'recipe-red-lentil-patties', name: 'Galettes de lentilles corail', ingredients: [{ foodId: 'lentils-red', grams: 100 }, { foodId: 'flour', grams: 20 }, { foodId: 'egg', grams: 50 }, { foodId: 'emmental', grams: 20 }] },
    { id: 'recipe-rice-omelette', name: 'Riz aux œufs et emmental', ingredients: [{ foodId: 'rice', grams: 200 }, { foodId: 'egg', grams: 100 }, { foodId: 'emmental', grams: 20 }] }
  ];
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function preferredUnit(foodId, fallback = 'g') {
  const food = state.foods.find((item) => item.id === foodId);
  if (food?.stockUnit === 'unité') return 'unité';
  return state.unitPreferences?.[foodId] || fallback;
}
function quantityForDisplay(foodId, grams, fallback = 'g') {
  const unit = preferredUnit(foodId, fallback);
  const value = Number(grams) || 0;
  return { value: unit === 'kg' ? value / 1000 : value, unit };
}
function quantityFromDisplay(foodId, value, unit) {
  return Number(value) * (unit === 'kg' ? 1000 : 1);
}
function today() { return new Date().toISOString().slice(0, 10); }
function number(value) { return Math.round(Number(value || 0) * 10) / 10; }
function notify(message) { toast = message; render(); setTimeout(() => { toast = ''; render(); }, 2600); }
function totalToday() { return addNutrients(state.logs.filter((entry) => entry.date === today())); }
function journalExportText() {
  const totals = totalToday();
  return [['Énergie', 'kcal'], ['Protéines', 'protein'], ['Glucides', 'carbs'], ['Lipides', 'fat']].map(([label, keyOrUnit]) => {
    const key = keyOrUnit === 'kcal' ? 'kcal' : keyOrUnit;
    const unit = key === 'kcal' ? 'kcal' : 'g';
    const current = number(totals[key]);
    const target = Number(state.targets[key]);
    return `- ${label} : ${current} ${unit} / ${target ? `${number(target)} ${unit} (${number((current / target) * 100)} %)` : 'objectif non renseigné'}`;
  }).join('\n');
}
function waterTracker() {
  const consumed = Number(state.water[today()] || 0);
  const goal = 2000;
  const percent = Math.min(100, Math.round((consumed / goal) * 100));
  return `<section class="panel water-tracker"><div class="section-title"><h2>Eau</h2><span>${consumed} ml / ${goal} ml</span></div><label class="water-slider-label"><span>Avancement</span><div class="water-slider-wrap"><input type="range" min="0" max="5000" step="50" value="${consumed}" data-water-slider aria-label="Quantité d’eau bue aujourd’hui" /><i class="water-recommendation" aria-label="Repère à 2,5 litres recommandés pour un homme adulte"><b>2,5 L</b></i></div></label><div class="water-bottle-controls"><label><span>Taille de ma gourde (ml)</span><input type="number" min="50" step="50" value="${state.waterBottleSize}" data-water-bottle-size /></label><button class="small" type="button" data-add-water-bottle>＋ Ajouter une gourde</button></div><small>${percent}% de l’objectif quotidien indicatif</small></section>`;
}
function targetCard(label, key, value, suffix) {
  const target = Number(state.targets[key]);
  const actualPercent = target ? number((value / target) * 100) : null;
  const consumedPercent = target ? Math.min(100, Math.max(0, actualPercent)) : 0;
  const overflowPercent = target ? Math.min(100, Math.max(0, actualPercent - 100)) : 0;
  const donut = target
    ? `<div class="donut ${overflowPercent ? 'over-target' : ''}" style="--before:0%;--after:${consumedPercent}%;--overflow:${overflowPercent}%" aria-label="${label} : ${actualPercent} % de l’objectif"><span>${actualPercent}<small>%</small></span></div>`
    : '<div class="donut metric-empty-donut" aria-label="Objectif non renseigné"><span>—</span></div>';
  return `<article class="metric metric-donut-card">${donut}<span>${label}</span><strong>${number(value)}${suffix}</strong>${target ? `<small>${number(Math.abs(target - value))}${suffix} ${value > target ? 'au-dessus' : 'restant'}</small>` : '<small>Objectif non renseigné</small>'}</article>`;
}
function periodDonuts(average) {
  return [['kcal', 'Énergie', 'kcal'], ['protein', 'Protéines', 'g'], ['carbs', 'Glucides', 'g'], ['fat', 'Lipides', 'g']].map(([key, label, suffix]) => {
    const target = Number(state.targets[key]);
    const percent = target ? number((average[key] / target) * 100) : null;
    const fill = percent === null ? 0 : Math.min(100, Math.max(0, percent));
    return `<article class="donut-card period-donut-card"><div class="donut ${percent !== null && percent > 100 ? 'over-target' : ''}" style="--before:0%;--after:${fill}%;--overflow:0%"><span>${percent === null ? '—' : percent}<small>${percent === null ? '' : '%'}</small></span></div><b>${label}</b><strong>${number(average[key])} ${suffix}</strong><small>${percent === null ? 'Objectif non renseigné' : 'moyenne par jour'}</small></article>`;
  }).join('');
}
function periodDialog(days = 7) {
  const end = new Date(`${today()}T12:00:00`);
  const dates = Array.from({ length: days }, (_, index) => { const date = new Date(end); date.setDate(end.getDate() - index); return date.toISOString().slice(0, 10); });
  const daily = dates.map((date) => addNutrients(state.logs.filter((entry) => entry.date === date)));
  const recordedDays = daily.filter((item) => item.kcal || item.protein || item.carbs || item.fat).length;
  const averageDays = recordedDays || 1;
  const average = addNutrients(daily.map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, value / averageDays]))));
  return `<dialog open class="target-dialog period-dialog"><button class="close" type="button" data-close-period aria-label="Fermer">×</button><h2>Évolution de ta consommation</h2><label>Période<select name="period"><option value="7" ${days === 7 ? 'selected' : ''}>Cette semaine</option><option value="30" ${days === 30 ? 'selected' : ''}>Ce mois</option></select></label><p class="hint">Moyenne sur les ${recordedDays} jour${recordedDays > 1 ? 's' : ''} avec repas enregistré${recordedDays > 1 ? 's' : ''}.</p><div class="donut-grid period-donut-grid">${periodDonuts(average)}</div><p class="hint">Les jours sans repas ne sont pas pris en compte.</p></dialog>`;
}
function bindPeriodDialog(dialog) {
  if (!dialog) return;
  dialog.querySelector('[data-close-period]').addEventListener('click', () => { app.classList.remove('period-open'); dialog.remove(); });
  dialog.querySelector('select[name="period"]').addEventListener('change', (event) => { dialog.outerHTML = periodDialog(Number(event.target.value)); bindPeriodDialog(app.querySelector('.period-dialog')); });
}
function foodOptions(selectedFoodId = null) {
  const groups = new Map();
  state.foods.forEach((food) => groups.set(food.category || 'Autres', [...(groups.get(food.category || 'Autres') || []), food]));
  return [...groups.entries()].map(([category, foods]) => `<optgroup label="${category}">${foods.map((food) => `<option value="${food.id}" ${food.id === selectedFoodId ? 'selected' : ''}>${food.name}</option>`).join('')}</optgroup>`).join('');
}
function mealOptions(selectedMeal) {
  return ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation', 'Repas'].map((meal) => `<option ${meal === selectedMeal ? 'selected' : ''}>${meal}</option>`).join('');
}
function recipeOptions(selectedRecipeId) {
  return state.recipes.map((recipe) => `<option value="${recipe.id}" ${recipe.id === selectedRecipeId ? 'selected' : ''}>${recipe.name}</option>`).join('');
}
function foodAmountLabel(foodId, grams, fallbackName = null) {
  if (foodId === 'egg') {
    const eggs = number(Number(grams) / 50);
    return `${eggs} œuf${eggs === 1 ? '' : 's'}`;
  }
  const display = quantityForDisplay(foodId, grams);
  return `${fallbackName || foodName(state, foodId)} · ${number(display.value)} ${display.unit}`;
}
function removeFromStock(foodId, grams) {
  const food = state.foods.find((item) => item.id === foodId);
  const stock = state.stock.find((item) => item.foodId === foodId);
  if (!food || !stock) return;
  const consumed = food.stockUnit === 'unité' ? Number(grams) / 50 : Number(grams);
  stock.quantity = Math.max(0, Number(stock.quantity) - consumed);
}

function foodSearchOptions() {
  return state.foods.map((food) => `<option value="${food.name}" label="${food.category || 'Autres'}"></option>`).join('');
}
function foodPreview(foodId, grams) {
  const food = state.foods.find((item) => item.id === foodId);
  if (!food || !Number(grams)) return '';
  const addition = nutrientsFor(food, grams);
  const current = totalToday();
  const macroEnergy = addition.protein * 4 + addition.carbs * 4 + addition.fat * 9;
  const macroShare = macroEnergy ? { protein: Math.round((addition.protein * 4 / macroEnergy) * 100), fat: Math.round((addition.fat * 9 / macroEnergy) * 100), carbs: Math.round((addition.carbs * 4 / macroEnergy) * 100) } : null;
  const labels = { kcal: ['Énergie', ' kcal'], protein: ['Protéines', ' g'], carbs: ['Glucides', ' g'], fat: ['Lipides', ' g'] };
  const charts = Object.entries(labels).map(([key, [label, suffix]]) => {
    const target = Number(state.targets[key]);
    const after = number(current[key] + addition[key]);
    if (!target) return `<article class="donut-card no-target"><b>${label}</b><strong>+${number(addition[key])}${suffix}</strong><small>Objectif à renseigner</small></article>`;
    const beforePercent = Math.min(100, number((current[key] / target) * 100));
    const actualPercent = number((after / target) * 100);
    const afterPercent = Math.min(100, actualPercent);
    const overflowPercent = Math.min(100, Math.max(0, actualPercent - 100));
    const status = after > target ? `+${number(after - target)}${suffix} au-dessus` : `${number(target - after)}${suffix} restant`;
    return `<article class="donut-card"><div class="donut ${overflowPercent ? 'over-target' : ''}" style="--before:${beforePercent}%;--after:${afterPercent}%;--overflow:${overflowPercent}%" aria-label="${label} : ${actualPercent} % de l’objectif après ajout"><span>${actualPercent}<small>%</small></span></div><b>${label}</b><strong>+${number(addition[key])}${suffix}</strong><small>${status}</small></article>`;
  }).join('');
  const distribution = macroShare ? `<div class="macro-share"><b>Répartition de l’apport</b><div class="macro-bar"><i style="width:${macroShare.protein}%"></i><i style="width:${macroShare.fat}%"></i><i style="width:${macroShare.carbs}%"></i></div><small><span>Protéines ${macroShare.protein}%</span><span>Lipides ${macroShare.fat}%</span><span>Glucides ${macroShare.carbs}%</span></small></div>` : '';
 return `<aside id="food-preview" class="food-preview"><h3>Effet avant ajout</h3><p><b>${food.name}</b> · ${grams} g</p>${distribution}<div class="donut-grid">${charts}</div></aside>`;
}
function addLog(foodId, grams, meal = 'Petit-déjeuner', name = null) {
  const food = state.foods.find((item) => item.id === foodId);
  if (!food) return;
  state.logs.unshift({ id: crypto.randomUUID(), date: today(), meal, name: name || food.name, grams, foodId, ...nutrientsFor(food, grams) });
}
function testMealLogs(foods) {
  const entries = [
    ['egg', 250, 'Œufs entiers · 5 unités'],
    ['emmental', 30, 'Emmental râpé · 30 g (estimation)'],
    ['mayonnaise', 15, 'Mayonnaise · 1 cuillère à soupe (15 g, estimation)']
  ];
  return entries.map(([foodId, grams, name]) => {
    const food = foods.find((item) => item.id === foodId);
    return { id: crypto.randomUUID(), date: today(), meal: 'Petit-déjeuner', name, grams, foodId, ...nutrientsFor(food, grams) };
  });
}
function nav() {
  const labels = { journal: 'Journal', recettes: 'Recettes', stock: 'Stock', courses: 'Courses' };
  return `<nav>${Object.entries(labels).map(([id, label]) => `<button class="${view === id ? 'active' : ''}" data-view="${id}">${label}</button>`).join('')}</nav>`;
}
function exportPayload() {
  return { exportVersion: 1, exportedAt: new Date().toISOString(), app: 'repas-stock', data: state };
}
function jsonNomenclature() {
  return JSON.stringify({
    foods: [{ id: 'custom-identifiant', name: 'Nom de l’aliment', category: 'Céréales', unit: 'g', stockUnit: 'g', kcal: 350, protein: 10, carbs: 70, fat: 3, stock: { quantity: 500, minimum: 100 } }],
    recipes: [{ id: 'recipe-identifiant', name: 'Nom de la recette', ingredients: [{ foodId: 'custom-identifiant', grams: 100 }] }],
    targets: { kcal: 1950, protein: 97, carbs: 243, fat: 65 },
    _instructions: {
      foods: 'Apports pour 100 g. unit décrit la saisie alimentaire ; stockUnit peut être g, kg ou unité.',
      stock: 'Facultatif dans une entrée food grâce à stock, ou séparément avec foodId, quantity et minimum.',
      partialImport: 'Pour un ajout partiel, ne fournir que les rubriques à modifier : foods, stock, recipes, logs, targets ou préférences.'
    }
  }, null, 2);
}
function importObject(payload) {
  const imported = payload?.data || payload;
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw new Error('format');
  return imported;
}
function validatePartialData(imported, { full = false } = {}) {
  const required = full ? ['foods', 'stock', 'logs'] : [];
  required.forEach((key) => { if (!Array.isArray(imported[key])) throw new Error(`La rubrique ${key} est obligatoire.`); });
  ['foods', 'stock', 'logs', 'recipes'].forEach((key) => {
    if (imported[key] !== undefined && !Array.isArray(imported[key])) throw new Error(`La rubrique ${key} doit être un tableau.`);
  });
  if (imported.targets !== undefined && (typeof imported.targets !== 'object' || Array.isArray(imported.targets))) throw new Error('La rubrique targets doit être un objet.');
  if (Array.isArray(imported.foods)) imported.foods.forEach((food) => {
    if (!food || typeof food !== 'object' || !String(food.name || '').trim()) throw new Error('Chaque aliment doit avoir un nom.');
    ['kcal', 'protein', 'carbs', 'fat'].forEach((key) => { if (!Number.isFinite(Number(food[key])) || Number(food[key]) < 0) throw new Error(`Valeur nutritionnelle invalide : ${key}.`); });
  });
  if (Array.isArray(imported.stock)) imported.stock.forEach((item) => { if (!item?.foodId || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 0) throw new Error('Chaque stock doit avoir foodId et quantity.'); });
  if (Array.isArray(imported.recipes)) imported.recipes.forEach((recipe) => { if (!recipe || !String(recipe.name || '').trim() || !Array.isArray(recipe.ingredients)) throw new Error('Recette invalide.'); });
  return imported;
}
function mergeById(current, incoming, fallbackKey = 'id') {
  const result = [...current];
  incoming.forEach((item) => {
    const key = item.id || item[fallbackKey];
    const index = result.findIndex((existing) => (item.id && existing.id === item.id) || (!item.id && fallbackKey && existing[fallbackKey] === key));
    if (index >= 0) result[index] = { ...result[index], ...item, id: result[index].id || item.id };
    else result.push(item);
  });
  return result;
}
function normalizePartialFoods(foodEntries) {
  const foods = [];
  const stock = [];
  foodEntries.forEach((entry) => {
    const id = entry.id || `custom-${crypto.randomUUID()}`;
    const { stock: embeddedStock, quantity, minimum, ...foodData } = entry;
    foods.push({ ...foodData, id, name: String(foodData.name).trim(), category: foodData.category || 'Autres', unit: foodData.unit || 'g' });
    const stockData = embeddedStock && typeof embeddedStock === 'object' ? embeddedStock : (quantity !== undefined ? { quantity, minimum } : null);
    if (stockData) stock.push({ ...stockData, id: stockData.id || crypto.randomUUID(), foodId: id, quantity: Number(stockData.quantity) || 0, minimum: Number(stockData.minimum) || 0 });
  });
  return { foods, stock };
}
function applyPartialData(imported) {
  const normalized = { ...imported };
  if (Array.isArray(imported.foods)) {
    const prepared = normalizePartialFoods(imported.foods);
    normalized.foods = prepared.foods;
    normalized.stock = [...(Array.isArray(imported.stock) ? imported.stock : []), ...prepared.stock];
  }
  if (Array.isArray(normalized.foods)) state.foods = mergeById(state.foods, normalized.foods);
  if (Array.isArray(normalized.stock)) state.stock = mergeById(state.stock, normalized.stock, 'foodId');
  if (Array.isArray(normalized.recipes)) state.recipes = mergeById(state.recipes || [], normalized.recipes);
  if (Array.isArray(normalized.logs)) state.logs = mergeById(state.logs || [], normalized.logs);
  ['targets', 'unitPreferences', 'shoppingUnitPreferences', 'water'].forEach((key) => { if (normalized[key] && typeof normalized[key] === 'object' && !Array.isArray(normalized[key])) state[key] = { ...(state[key] || {}), ...normalized[key] }; });
  ['shopping', 'shoppingSelection', 'shoppingQuantities'].forEach((key) => { if (normalized[key] !== undefined) state[key] = normalized[key]; });
  if (normalized.waterBottleSize !== undefined) state.waterBottleSize = Number(normalized.waterBottleSize) || 600;
  if (normalized.defaultMeal) state.defaultMeal = normalized.defaultMeal;
}
function settings() {
  return `<section class="hero"><p>RÉGLAGES</p><h1>Gérer tes données</h1><span>Exporte une sauvegarde pour la conserver ou me l’envoyer afin que je t’aide à la modifier.</span></section><section class="panel settings-panel"><h2>Sauvegarde complète</h2><p>Le fichier contient ton stock, tes repas, tes recettes, tes courses et tes préférences.</p><div class="settings-actions"><button type="button" data-export-data>Exporter mes données</button><button type="button" class="secondary" data-import-data>Importer un fichier</button></div><input type="file" accept="application/json,.json" data-import-file hidden /><p class="hint">L’importation complète remplace les données actuellement enregistrées sur cet appareil.</p></section><section class="panel settings-json-panel"><h2>Modifier ou importer du JSON</h2><p>Modifie le texte directement, ou colle le JSON préparé par une IA.</p><textarea data-json-editor spellcheck="false" aria-label="Éditeur JSON"></textarea><div class="settings-actions"><button type="button" class="secondary" data-load-json>Charger mes données</button><button type="button" class="secondary" data-copy-json>Copier le JSON</button><button type="button" class="secondary" data-copy-json-schema>Copier la nomenclature</button><button type="button" data-apply-json>Remplacer toutes les données</button><button type="button" data-apply-partial-json>Importer seulement cette partie</button></div><p class="hint">L’importation partielle fusionne uniquement les rubriques présentes. Pour créer un aliment avec son stock, ajoute <code>stock</code> dans l’objet de l’aliment.</p></section>`;
}
function journal() {
  const totals = totalToday();
  const logs = state.logs.filter((entry) => entry.date === today()).sort((a, b) => (MEAL_DISPLAY_ORDER[a.meal] ?? 99) - (MEAL_DISPLAY_ORDER[b.meal] ?? 99));
  return `<section class="hero"><p>AUJOURD’HUI</p><h1>Ton journal alimentaire</h1><button class="date-button" data-open-period>${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())} ▾</button></section>
  <div class="journal-export-actions"><button class="small" type="button" data-copy-journal>Copier mes apports</button><button class="small" type="button" data-export-journal>Extraire mes apports</button></div><section class="metrics">${targetCard('Énergie', 'kcal', totals.kcal, ' kcal')}${targetCard('Protéines', 'protein', totals.protein, ' g')}${targetCard('Glucides', 'carbs', totals.carbs, ' g')}${targetCard('Lipides', 'fat', totals.fat, ' g')}</section>
  <button class="goals-button" data-action="open-targets"><span>Objectifs quotidiens</span><b>Définir ou modifier →</b></button>${waterTracker()}
  <section class="panel food-composer"><div class="section-title"><h2>Ajouter un aliment</h2><button class="link" type="button" data-toggle-food-composer aria-label="${journalComposerOpen ? 'Replier l’ajout d’aliment' : 'Afficher l’ajout d’aliment'}" title="${journalComposerOpen ? 'Replier' : 'Afficher'}">${journalComposerOpen ? '−' : '+'}</button></div>${journalComposerOpen ? `<form id="log-form" class="form-grid"><label>Repas<select name="meal">${mealOptions(state.defaultMeal)}</select></label><label>Aliment<input name="foodSearch" placeholder="Rechercher dans la liste…" autocomplete="off" /><select name="foodId">${foodOptions()}</select></label><label>Quantité (g)<input name="grams" type="number" min="1" value="100" required /></label><label class="checkbox-field"><input name="fromStock" type="checkbox" /> Prélevé du stock</label><button>Ajouter</button></form>${foodPreview(state.foods[0]?.id, 100)}` : ''}</section>
  <section class="panel"><h2>Repas enregistrés</h2>${logs.length ? `<div class="log-list">${logs.map((entry) => `<article data-log-row="${entry.id}" title="Double-cliquer pour modifier"><div><b>${entry.meal}</b><span>${foodAmountLabel(entry.foodId, entry.grams, entry.name)}</span></div><strong>${entry.kcal} kcal</strong><div class="log-actions"><button class="small" data-edit-log="${entry.id}">Modifier</button><button class="icon" data-remove-log="${entry.id}" aria-label="Supprimer">×</button></div></article>`).join('')}</div>` : '<p class="empty">Aucun repas enregistré pour aujourd’hui.</p>'}</section>`;
}
function recipes() {
  if (recipeEditorId) {
    const recipe = state.recipes.find((item) => item.id === recipeEditorId);
    if (recipe) return recipeEditor(recipe);
    recipeEditorId = null;
  }
  return `<section class="hero"><p>RECETTES</p><h1>Cuisiner, puis enregistrer</h1><span>Les ingrédients peuvent être déduits du stock.</span></section>
  <section class="panel"><h2>Nouvelle recette</h2><form id="recipe-form"><label class="recipe-name">Nom<input name="name" required placeholder="Ex. bol protéiné" /></label><div id="ingredient-lines">${ingredientLine()}</div><button class="add-line recipe-icon-button" type="button" data-add-ingredient aria-label="Ajouter un ingrédient" title="Ajouter un ingrédient">＋</button><button class="recipe-icon-button" aria-label="Créer la recette" title="Créer la recette">✓</button></form></section>
  <section class="panel"><h2>Mes recettes</h2>${state.recipes.length ? `<div class="cards">${state.recipes.map((recipe) => { const n = recipeNutrients(recipe, state.foods); return `<article class="recipe-card"><h3>${recipe.name}</h3><p>${recipe.ingredients.map((item) => foodAmountLabel(item.foodId, item.grams)).join(', ')}</p><strong>${number(n.kcal)} kcal · ${number(n.protein)} g prot.</strong><div class="recipe-actions"><button class="recipe-action" data-edit-recipe="${recipe.id}" aria-label="Modifier la recette" title="Modifier la recette">✎</button><button class="recipe-action" data-cook="${recipe.id}" aria-label="Cuisiner et ajouter au journal" title="Cuisiner et ajouter au journal">🍴</button></div></article>`; }).join('')}</div>` : '<p class="empty">Crée une recette pour la retrouver ici.</p>'}</section>`;
}
function recipeEditor(recipe) {
  return `<section class="hero"><p>RECETTE</p><h1>Modifier la recette</h1><span>Modifie le nom et les ingrédients.</span></section><section class="panel"><form id="recipe-edit-form" data-recipe-id="${recipe.id}"><label class="recipe-name">Nom<input name="name" required value="${recipe.name}" /></label><div id="recipe-edit-lines">${recipe.ingredients.map((item) => ingredientLine(item, true)).join('')}</div><button class="add-line recipe-icon-button" type="button" data-add-edit-ingredient aria-label="Ajouter un ingrédient" title="Ajouter un ingrédient">＋</button><div class="form-actions"><button type="button" class="secondary" data-close-recipe-editor>Annuler</button><button type="button" class="danger recipe-icon-button" data-delete-recipe="${recipe.id}" aria-label="Supprimer la recette" title="Supprimer la recette">🗑️</button><button class="recipe-icon-button" aria-label="Enregistrer la recette" title="Enregistrer la recette">✓</button></div></form></section>`;
}
function recipeCookDialog(recipe) {
  return `<dialog open class="target-dialog"><form id="recipe-cook-form" data-recipe-id="${recipe.id}"><button class="close" type="button" data-close-cook-dialog aria-label="Fermer">×</button><h2>Ajouter la recette</h2><p>${recipe.name} sera ajouté au journal ingrédient par ingrédient.</p><label>Repas<select name="meal">${mealOptions('Dîner')}</select></label><label class="checkbox-field"><input name="fromStock" type="checkbox" checked /> Prélevé du stock</label><div class="form-actions"><button type="button" class="secondary" data-close-cook-dialog>Annuler</button><button>Ajouter au journal</button></div></form></dialog>`;
}
function stockFormDefaults(foodId) {
  const food = state.foods.find((item) => item.id === foodId);
  const existing = state.stock.find((item) => item.foodId === foodId);
  const unit = preferredUnit(foodId, food?.stockUnit || 'g');
  const baseQuantity = existing?.quantity ?? STOCK_PURCHASE_QUANTITIES[foodId] ?? (unit === 'unité' ? 1 : 100);
  const baseMinimum = existing?.minimum ?? Math.max(1, Math.round(baseQuantity / 4));
  return { quantity: unit === 'kg' ? baseQuantity / 1000 : baseQuantity, minimum: unit === 'kg' ? baseMinimum / 1000 : baseMinimum, unit };
}
function stock() {
  const initial = stockFormDefaults(state.foods[0]?.id);
  const stockExportText = () => state.stock.map((item) => { const unit = preferredUnit(item.foodId, state.foods.find((food) => food.id === item.foodId)?.stockUnit || 'g'); const shown = quantityForDisplay(item.foodId, item.quantity, unit); return `- ${foodName(state, item.foodId)} : ${number(shown.value)} ${unit}`; }).join('\n');
  return `<section class="hero"><p>PLACARDS</p><h1>Ce qu’il reste à la maison</h1></section>
  <section class="panel"><button class="stock-create-button" type="button" data-open-custom-food>＋ Créer un nouvel aliment</button></section>
  <section class="panel"><h2>Ajouter au stock</h2><form id="stock-form" class="form-grid"><label>Aliment<select name="foodId">${foodOptions()}</select></label><label><span data-stock-quantity-label>Quantité (${initial.unit})</span><input name="quantity" type="number" min="0" value="${initial.quantity}" required /></label><label><span data-stock-minimum-label>Alerte sous (${initial.unit})</span><input name="minimum" type="number" min="0" value="${initial.minimum}" required /></label><button>Ajouter</button></form></section>
  <section class="panel"><div class="section-title"><h2>Stock actuel</h2><div class="shopping-export-actions"><button class="small" type="button" data-copy-stock>Copier</button><button class="small" type="button" data-export-stock>Extraire</button></div></div>${state.stock.length ? `<div class="stock-list">${state.stock.map((item) => { const food = state.foods.find((entry) => entry.id === item.foodId); const unit = preferredUnit(item.foodId, food?.stockUnit || 'g'); const shown = quantityForDisplay(item.foodId, item.quantity, unit); const threshold = quantityForDisplay(item.foodId, item.minimum, unit); const step = unit === 'unité' ? 1 : unit === 'kg' ? 0.05 : 50; const delta = unit === 'kg' ? step * 1000 : step; const unitPicker = unit === 'unité' ? '<span>unité</span>' : `<select data-stock-unit="${item.foodId}" aria-label="Unité de ${foodName(state, item.foodId)}"><option value="g" ${unit === 'g' ? 'selected' : ''}>g</option><option value="kg" ${unit === 'kg' ? 'selected' : ''}>kg</option></select>`; return `<article class="${Number(item.quantity) <= Number(item.minimum) ? 'low' : ''}" data-edit-stock="${item.id}" title="Double-cliquer pour modifier la quantité"><div><b>${foodName(state, item.foodId)}</b><span>${number(shown.value)} ${unit}${shown.value > 1 && unit === 'unité' ? 's' : ''} disponibles · seuil ${number(threshold.value)} ${unit}${threshold.value > 1 && unit === 'unité' ? 's' : ''}</span></div><div class="stock-actions">${unitPicker}<button class="small" data-adjust-stock="${item.id}" data-change="-${delta}">− ${step} ${unit}</button><button class="small" data-adjust-stock="${item.id}" data-change="${delta}">+ ${step} ${unit}</button></div></article>`; }).join('')}</div>` : '<p class="empty">Le stock est vide.</p>'}</section>`;
}
function stockEditor(item) {
  const food = state.foods.find((entry) => entry.id === item.foodId);
  const unit = preferredUnit(item.foodId, food?.stockUnit || 'g');
  const shown = quantityForDisplay(item.foodId, item.quantity, unit);
  return `<dialog open class="target-dialog"><form id="stock-editor-form" data-stock-id="${item.id}" data-stock-unit="${unit}" data-food-id="${item.foodId}"><button class="close" type="button" data-close-stock-editor aria-label="Fermer">×</button><h2>Modifier l’aliment et le stock</h2><label>Nom<input name="name" value="${food?.name || ''}" required /></label><label>Énergie pour 100 g<input name="kcal" type="number" min="0" step="0.1" value="${food?.kcal ?? 0}" required /></label><label>Protéines pour 100 g<input name="protein" type="number" min="0" step="0.1" value="${food?.protein ?? 0}" required /></label><label>Glucides pour 100 g<input name="carbs" type="number" min="0" step="0.1" value="${food?.carbs ?? 0}" required /></label><label>Lipides pour 100 g<input name="fat" type="number" min="0" step="0.1" value="${food?.fat ?? 0}" required /></label><label>Quantité disponible (${unit})<input name="quantity" type="number" min="0" step="${unit === 'unité' ? 1 : unit === 'kg' ? 0.1 : 1}" value="${shown.value}" required /></label><button class="save-targets">Enregistrer</button></form></dialog>`;
}
function customFoodDialog() {
  return `<dialog open class="target-dialog"><form id="custom-food-form" class="form-grid"><button class="close" type="button" data-close-custom-food aria-label="Fermer">×</button><h2>Créer un nouvel aliment</h2><label>Nom<input name="name" required placeholder="Ex. poudre d’amande" /></label><label>Catégorie<input name="category" value="Autres" required /></label><label>Énergie pour 100 g<input name="kcal" type="number" min="0" step="0.1" required /></label><label>Protéines pour 100 g<input name="protein" type="number" min="0" step="0.1" required /></label><label>Glucides pour 100 g<input name="carbs" type="number" min="0" step="0.1" required /></label><label>Lipides pour 100 g<input name="fat" type="number" min="0" step="0.1" required /></label><label>Quantité initiale (g)<input name="quantity" type="number" min="0" step="1" required /></label><label>Alerte sous (g)<input name="minimum" type="number" min="0" step="1" required /></label><button>Créer et ajouter au stock</button></form></dialog>`;
}
function priceMeasure(name) {
  const grams = PRICE_MEASURES[name];
  return grams ? { quantity: grams, unit: 'g' } : { quantity: 1, unit: 'unité' };
}
function normalisedPrice(name, price) {
  const measure = priceMeasure(name);
  return measure.unit === 'g' ? price * 1000 / measure.quantity : price;
}
function priceLabel(name, price) {
  const measure = priceMeasure(name);
  return measure.unit === 'g' ? `${normalisedPrice(name, price).toFixed(2)} €/kg` : `${price.toFixed(2)} €/unité`;
}
function priceChart(name, records) {
  if (records.length < 2) return '<p class="empty">Un seul relevé pour le moment.</p>';
  const prices = records.map((item) => normalisedPrice(name, item.price));
  const min = Math.min(...prices); const max = Math.max(...prices); const span = max - min || 1;
  const coordinates = records.map((item, index) => ({ x: (index / (records.length - 1)) * 228 + 34, y: 92 - ((prices[index] - min) / span) * 62 }));
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(' ');
  const suffix = priceMeasure(name).unit === 'g' ? ' €/kg' : ' €';
  return `<div class="price-chart-wrap"><svg class="price-chart" viewBox="0 0 280 120" role="img" aria-label="Évolution du prix"><line x1="34" y1="30" x2="262" y2="30"/><line x1="34" y1="61" x2="262" y2="61"/><line x1="34" y1="92" x2="262" y2="92"/><text x="3" y="34">${max.toFixed(2)}${suffix}</text><text x="3" y="96">${min.toFixed(2)}${suffix}</text><polyline points="${points}"/>${coordinates.map(({ x, y }) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}</svg><small>${prices[0].toFixed(2)}${suffix} → ${prices.at(-1).toFixed(2)}${suffix}</small></div>`;
}
function priceCategory(name) {
  if (['Sac isotherme'].includes(name)) return 'Non alimentaire';
  if (['Banane 4 fruits', 'Citron 500 g', 'Kaki', 'Jus d’orange', 'Oignon rouge', 'Ail 250 g', 'Salade de céleri', 'Salade de concombres'].includes(name)) return 'Fruits et légumes';
  if (['Coquillettes 1 kg', 'Flocons d’avoine', 'Lentilles vertes', 'Pain de mie'].includes(name)) return 'Féculents et céréales';
  if (['Fromage blanc', 'Emmental râpé', 'Fromage bleu 55 % MG', 'Crème fraîche épaisse'].includes(name)) return 'Produits laitiers';
  if (['Côtes de porc échine', 'Cuisses de poulet blanc', 'Lardons nature', 'Allumettes de porc', 'Chipolatas / saucisses de Toulouse', 'Saucisse de Toulouse'].includes(name)) return 'Viandes et charcuterie';
  if (['Pesto rosso', 'Pesto genovese', 'Mayonnaise', 'Moutarde de Dijon', 'Sauce tomate variée'].includes(name)) return 'Sauces et condiments';
  return 'Boissons et snacking';
}
function priceProductCard(name, history, selected) {
  const records = history.filter((item) => item.name === name).sort((a, b) => a.date.localeCompare(b.date));
  const latest = records.at(-1);
  const measure = priceMeasure(name);
  const details = records.length > 1 ? priceChart(name, records) : '<p class="empty">Un seul relevé.</p>';
  return `<article class="tracked-product"><label class="product-pick"><input type="checkbox" data-select-price="${name}" ${selected.includes(name) ? 'checked' : ''}/><span><b>${name}</b><small>Lidl · ${priceLabel(name, latest.price)}${measure.unit === 'g' ? ` · paquet ${latest.price.toFixed(2)} €` : ''} · ${records.length} relevé${records.length > 1 ? 's' : ''}</small></span></label><button class="product-toggle" data-price-product="${name}">Voir l’évolution <strong>⌄</strong></button><div class="price-details" hidden data-price-details="${name}">${details}<button class="small danger" data-remove-price-product="${name}">Supprimer ce produit</button></div></article>`;
}
function purchaseSpec(name) {
  const foodIds = {
    'Flocons d’avoine': 'oats', 'Coquillettes 1 kg': 'pasta-dry', 'Lentilles vertes': 'lentils-green',
    'Fromage blanc': 'fromage-blanc', 'Emmental râpé': 'emmental', 'Mayonnaise': 'mayonnaise',
    'Banane 4 fruits': 'banana', 'Citron 500 g': 'lemon', 'Ail 250 g': 'garlic', 'Pain de mie': 'wholewheat-bread'
  };
  const measure = priceMeasure(name);
  return { foodId: foodIds[name] || null, quantity: measure.quantity, unit: measure.unit };
}
function priceProductForFoodId(foodId) {
  return { oats: 'Flocons d’avoine', pasta: 'Coquillettes 1 kg', 'lentils-green': 'Lentilles vertes', emmental: 'Emmental râpé', mayonnaise: 'Mayonnaise', 'fromage-blanc': 'Fromage blanc' }[foodId] || null;
}
function selectedShoppingItems(history) {
  return (state.shoppingSelection || []).map((name) => {
    const records = history.filter((item) => item.name === name).sort((a, b) => a.date.localeCompare(b.date));
    const latest = records.at(-1);
    const spec = purchaseSpec(name);
    const quantity = Number(state.shoppingQuantities?.[name] || spec.quantity);
    const food = state.foods.find((item) => item.id === spec.foodId);
    const nutrients = food && spec.unit === 'g' ? nutrientsFor(food, quantity) : { kcal: 0, protein: 0, carbs: 0, fat: 0 };
     return { name, latest, quantity, baseQuantity: spec.quantity, unit: state.shoppingUnitPreferences[name] || spec.unit, food: food && spec.unit === 'g' ? food : null, nutrients };
  });
}
function shoppingQuantityDisplay(item) {
  const preferred = item.food ? preferredUnit(item.food.id, item.unit) : item.unit;
  if (preferred !== 'g') return { value: preferred === 'kg' ? item.quantity / 1000 : item.quantity, unit: preferred };
  return item.quantity >= 1000 ? { value: number(item.quantity / 1000), unit: 'kg' } : { value: item.quantity, unit: 'g' };
}
function shoppingExportText(items) {
  return items.map((item) => { const display = shoppingQuantityDisplay(item); return `- ${item.name} : ${display.value} ${display.unit}`; }).join('\n');
}
function stockExportText() {
  return state.stock.map((item) => { const unit = preferredUnit(item.foodId, state.foods.find((food) => food.id === item.foodId)?.stockUnit || 'g'); const shown = quantityForDisplay(item.foodId, item.quantity, unit); return `- ${foodName(state, item.foodId)} : ${number(shown.value)} ${unit}`; }).join('\n');
}
function stockExportDetailedText() {
  return state.stock.map((item) => { const food = state.foods.find((entry) => entry.id === item.foodId); const unit = preferredUnit(item.foodId, food?.stockUnit || 'g'); const shown = quantityForDisplay(item.foodId, item.quantity, unit); return `- ${foodName(state, item.foodId)} : ${number(shown.value)} ${unit}\n  Pour 100 g : ${number(food?.kcal)} kcal · ${number(food?.protein)} g protéines · ${number(food?.carbs)} g glucides · ${number(food?.fat)} g lipides`; }).join('\n');
}
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* fallback below */ }
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, area.value.length);
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { copied = false; }
  area.remove();
  return copied;
}
function cartMacroDonuts(nutritionTotal) {
  const labels = [['kcal', 'Énergie', 'kcal'], ['protein', 'Protéines', 'g'], ['carbs', 'Glucides', 'g'], ['fat', 'Lipides', 'g']];
  return labels.map(([key, label, suffix]) => {
    const target = Number(state.targets[key]);
    const percent = target ? number((nutritionTotal[key] / target) * 100) : null;
    const fill = percent === null ? 0 : Math.min(100, Math.max(0, percent));
    return `<article class="donut-card cart-donut-card" data-label="${label}" data-value="${number(nutritionTotal[key])} ${suffix}"><div class="donut ${percent !== null && percent > 100 ? 'over-target' : ''}" style="--before:0%;--after:${fill}%;--overflow:0%" aria-label="${label} : ${percent === null ? 'objectif non renseigné' : `${percent} % de l’objectif`}"><span>${percent === null ? '—' : percent}<small>${percent === null ? '' : '%'}</small></span></div><b>${label}</b><strong>${number(nutritionTotal[key])} ${suffix}</strong></article>`;
  }).join('');
}
function shopping() {
  const low = lowStock(state);
  const items = [...low.map((item) => ({ id: item.id, name: foodName(state, item.foodId), suggested: Math.max(0, Number(item.minimum) - Number(item.quantity)), linkedPriceProduct: priceProductForFoodId(item.foodId) })), ...state.shopping];
  const history = state.priceRecords || [];
  const products = [...new Set(history.map((item) => item.name))].sort((a, b) => a.localeCompare(b, 'fr'));
  const selected = state.shoppingSelection || [];
  const selectedItems = selectedShoppingItems(history);
  const total = selectedItems.reduce((sum, item) => sum + (item.latest?.price || 0) * (item.quantity / item.baseQuantity), 0);
  const nutritionTotal = addNutrients(selectedItems.map((item) => item.nutrients));
  const estimatedWeight = selectedItems.filter((item) => item.food && item.unit === 'g').reduce((sum, item) => sum + item.quantity, 0);
  const categories = ['Fruits et légumes', 'Féculents et céréales', 'Produits laitiers', 'Viandes et charcuterie', 'Sauces et condiments', 'Boissons et snacking', 'Non alimentaire'];
  return `<section class="hero"><p>LISTE DE COURSES</p><h1>À acheter quand tu veux</h1><span>Propositions fondées sur les seuils de stock.</span></section>
  <section class="panel"><h2>Ajouter un article</h2><form id="shopping-form" class="inline-form"><input name="name" required placeholder="Ex. œufs" /><button>Ajouter</button></form></section>
  <section class="panel"><h2>Mon panier</h2>${items.length ? `<div class="shopping-list">${items.map((item) => `<label><input type="checkbox" data-check-shopping="${item.id}" ${item.linkedPriceProduct ? `data-linked-price="${item.linkedPriceProduct}" ${selected.includes(item.linkedPriceProduct) ? 'checked' : ''}` : (item.done ? 'checked' : '')}/><span>${item.name}${item.suggested ? ` · au moins ${item.suggested} g` : ''}</span>${item.id.startsWith('stock-') ? '<em>stock faible</em>' : '<button class="icon" data-remove-shopping="' + item.id + '">×</button>'}</label>`).join('')}</div>` : ''}<h3 class="subheading">Produits suivis chez Lidl</h3>${categories.map((category) => { const names = products.filter((name) => priceCategory(name) === category); return names.length ? `<details class="product-category" data-product-category="${category}" ${openShoppingCategories.has(category) ? 'open' : ''}><summary>${category} <small>${names.length}</small></summary>${names.map((name) => priceProductCard(name, history, selected)).join('')}</details>` : ''; }).join('') || '<p class="empty">Aucun produit suivi.</p>'}${selectedItems.length ? `<section class="shopping-summary"><div class="section-title"><h3>Liste de courses</h3><div class="shopping-export-actions"><button class="small" type="button" data-copy-shopping>Copier</button><button class="small" type="button" data-export-shopping>Extraire</button></div></div>${selectedItems.map((item) => { const display = shoppingQuantityDisplay(item); return `<article><div><b>${item.name}</b><small>${item.food ? 'Aliment relié au catalogue' : 'Prix disponible, composition à renseigner'}</small></div><label>Quantité <span class="quantity-controls"><button type="button" class="quantity-step" data-shopping-step="-1" data-shopping-name="${item.name}" aria-label="Diminuer ${item.name}">▼</button><input type="number" min="1" step="${display.unit === 'kg' ? '0.1' : '1'}" value="${display.value}" data-shopping-quantity="${item.name}" /><button type="button" class="quantity-step" data-shopping-step="1" data-shopping-name="${item.name}" aria-label="Augmenter ${item.name}">▲</button>${item.unit === 'g' ? `<select data-shopping-unit="${item.name}"><option value="g" ${display.unit === 'g' ? 'selected' : ''}>g</option><option value="kg" ${display.unit === 'kg' ? 'selected' : ''}>kg</option></select>` : `<span>${item.unit}</span>`}</span></label><strong>${((item.latest?.price || 0) * item.quantity / item.baseQuantity).toFixed(2)} €</strong></article>`; }).join('')}<div class="cart-weight"><b>Poids estimé</b><strong>${estimatedWeight >= 1000 ? number(estimatedWeight / 1000) + ' kg' : number(estimatedWeight) + ' g'}</strong></div><div class="cart-total"><b>Total estimé</b><strong>${total.toFixed(2)} €</strong></div><div class="cart-macros"><div class="donut-grid">${cartMacroDonuts(nutritionTotal)}</div></div></section>` : ''}</section>`;
}
function rememberOpenShoppingCategories() {
  openShoppingCategories = new Set([...app.querySelectorAll('[data-product-category][open]')].map((details) => details.dataset.productCategory));
}
function targets() {
  return `<dialog open class="target-dialog"><form id="targets-form"><button class="close" type="button" data-close-targets aria-label="Fermer">×</button><h2>Objectifs quotidiens</h2><p>Facultatifs : ils servent seulement à afficher des pourcentages et ne constituent pas un conseil médical.</p><div class="target-fields">${[['kcal','Calories (kcal)'],['protein','Protéines (g)'],['carbs','Glucides (g)'],['fat','Lipides (g)']].map(([key,label]) => `<label>${label}<input type="number" min="0" name="${key}" value="${state.targets[key]}" /></label>`).join('')}</div><button class="save-targets">Enregistrer les objectifs</button></form></dialog>`;
}
function logEditor(entry) {
  const recipe = state.recipes.find((item) => item.id === entry.recipeId) || state.recipes.find((item) => item.name === entry.name);
  if (recipe) {
    return `<dialog open class="target-dialog"><form id="recipe-log-editor-form" data-log-id="${entry.id}"><button class="close" type="button" data-close-log-editor aria-label="Fermer">×</button><h2>Modifier le repas</h2><p>Cette entrée est une recette : elle reste donc liée à sa composition, et non à un aliment seul.</p><div class="target-fields"><label>Repas<select name="meal">${mealOptions(entry.meal)}</select></label><label>Recette<select name="recipeId">${recipeOptions(recipe.id)}</select></label><label>Quantité totale<input value="${entry.grams} g" disabled /></label></div><button class="save-targets">Enregistrer les modifications</button></form></dialog>`;
  }
  return `<dialog open class="target-dialog"><form id="log-editor-form" data-log-id="${entry.id}"><button class="close" type="button" data-close-log-editor aria-label="Fermer">×</button><h2>Modifier le repas</h2><p>Modifie le repas, l’aliment ou la quantité consommée.</p><div class="target-fields"><label>Repas<select name="meal"><option ${entry.meal === 'Petit-déjeuner' ? 'selected' : ''}>Petit-déjeuner</option><option ${entry.meal === 'Déjeuner' ? 'selected' : ''}>Déjeuner</option><option ${entry.meal === 'Dîner' ? 'selected' : ''}>Dîner</option><option ${entry.meal === 'Collation' ? 'selected' : ''}>Collation</option></select></label><label>Aliment<select name="foodId">${foodOptions(entry.foodId)}</select></label><label>Quantité (g)<input name="grams" type="number" min="1" value="${entry.grams}" required /></label></div><button class="save-targets">Enregistrer les modifications</button></form></dialog>`;
}
function ingredientLine(item = null, removable = false) {
  return `<div class="ingredient-line"><label>Ingrédient<select name="foodId">${foodOptions(item?.foodId)}</select></label><label>Quantité (g)<input name="grams" type="number" min="1" value="${item?.grams || 100}" required /></label>${removable ? '<button type="button" class="icon" data-remove-ingredient aria-label="Supprimer cet ingrédient">×</button>' : ''}</div>`;
}
function render() {
  const content = view === 'journal' ? journal() : view === 'recettes' ? recipes() : view === 'stock' ? stock() : view === 'courses' ? shopping() : settings();
  app.innerHTML = `<header><a href="#" class="brand">repas<span>&</span>stock</a><button class="settings-gear ${view === 'parametres' ? 'active' : ''}" type="button" data-view="parametres" aria-label="Ouvrir les paramètres" title="Paramètres">⚙</button></header>${content}${nav()}${toast ? `<div class="toast">${toast}</div>` : ''}`;
  bind();
}
function bind() {
  app.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { const nextView = button.dataset.view; if (nextView === view) return; view = nextView; history.pushState({ repasStock: true, view }, '', `#${view}`); render(); }));
  app.querySelector('[data-export-data]')?.addEventListener('click', () => { const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: 'application/json;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `repas-stock-sauvegarde-${today()}.json`; link.click(); URL.revokeObjectURL(link.href); notify('Données exportées.'); });
  app.querySelector('[data-import-data]')?.addEventListener('click', () => app.querySelector('[data-import-file]')?.click());
  app.querySelector('[data-import-file]')?.addEventListener('change', async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const imported = validatePartialData(importObject(JSON.parse(await file.text())), { full: true }); if (!confirm('Remplacer les données de cet appareil par celles du fichier ?')) return; state = { ...imported, unitPreferences: imported.unitPreferences || {}, shoppingUnitPreferences: imported.shoppingUnitPreferences || {}, water: imported.water || {}, waterBottleSize: Number(imported.waterBottleSize) || 600, defaultMeal: imported.defaultMeal || 'Petit-déjeuner' }; save(); render(); notify('Données importées.'); } catch (error) { notify(error.message === 'format' ? 'Fichier de données invalide.' : `Import impossible : ${error.message}`); } finally { event.target.value = ''; } });
  const jsonEditor = app.querySelector('[data-json-editor]');
  if (jsonEditor) {
    jsonEditor.value = JSON.stringify(exportPayload(), null, 2);
    app.querySelector('[data-load-json]')?.addEventListener('click', () => { jsonEditor.value = JSON.stringify(exportPayload(), null, 2); notify('JSON actuel chargé dans l’éditeur.'); });
    app.querySelector('[data-copy-json]')?.addEventListener('click', async () => { if (await copyText(jsonEditor.value)) notify('JSON copié.'); else notify('Copie impossible dans ce navigateur.'); });
    app.querySelector('[data-copy-json-schema]')?.addEventListener('click', async () => { if (await copyText(jsonNomenclature())) notify('Nomenclature JSON copiée.'); else notify('Copie impossible dans ce navigateur.'); });
    app.querySelector('[data-apply-json]')?.addEventListener('click', () => { try { const imported = validatePartialData(importObject(JSON.parse(jsonEditor.value)), { full: true }); if (!confirm('Remplacer toutes les données de cet appareil par le JSON édité ?')) return; state = { ...imported, unitPreferences: imported.unitPreferences || {}, shoppingUnitPreferences: imported.shoppingUnitPreferences || {}, water: imported.water || {}, waterBottleSize: Number(imported.waterBottleSize) || 600, defaultMeal: imported.defaultMeal || 'Petit-déjeuner' }; save(); render(); notify('JSON importé intégralement.'); } catch (error) { notify(`JSON invalide : ${error.message}`); } });
    app.querySelector('[data-apply-partial-json]')?.addEventListener('click', () => { try { const imported = validatePartialData(importObject(JSON.parse(jsonEditor.value))); if (!confirm('Ajouter ou modifier uniquement les rubriques présentes dans ce JSON ?')) return; applyPartialData(imported); save(); render(); notify('Partie de JSON importée.'); } catch (error) { notify(`JSON invalide : ${error.message}`); } });
  }
  app.querySelector('.food-composer .section-title')?.addEventListener('click', () => { journalComposerOpen = !journalComposerOpen; render(); });
  app.querySelector('[data-copy-journal]')?.addEventListener('click', async () => { if (await copyText(journalExportText())) notify('Apports journaliers copiés.'); else notify('Copie impossible dans ce navigateur.'); });
  app.querySelector('[data-export-journal]')?.addEventListener('click', () => { const blob = new Blob([journalExportText()], { type: 'text/plain;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'apports-journaliers.txt'; link.click(); URL.revokeObjectURL(link.href); notify('Apports journaliers extraits.'); });
  app.querySelector('[data-water-amount]')?.addEventListener('change', (event) => { state.water[today()] = Math.max(0, Number(event.target.value) || 0); save(); render(); });
  app.querySelector('[data-water-slider]')?.addEventListener('change', (event) => { state.water[today()] = Math.max(0, Number(event.target.value) || 0); save(); render(); });
  app.querySelector('[data-water-bottle-size]')?.addEventListener('change', (event) => { state.waterBottleSize = Math.max(50, Number(event.target.value) || 600); save(); render(); });
  app.querySelector('[data-add-water-bottle]')?.addEventListener('click', () => { state.water[today()] = Math.max(0, Number(state.water[today()] || 0) + state.waterBottleSize); save(); render(); });
  app.querySelectorAll('[data-water-change]').forEach((button) => button.addEventListener('click', () => { state.water[today()] = Math.max(0, Number(state.water[today()] || 0) + Number(button.dataset.waterChange)); save(); render(); }));
  app.querySelector('#log-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); const foodId = data.get('foodId'); const grams = Number(data.get('grams')); addLog(foodId, grams, data.get('meal')); if (data.get('fromStock')) removeFromStock(foodId, grams); save(); notify(data.get('fromStock') ? 'Aliment ajouté et stock diminué.' : 'Aliment ajouté au journal.'); });
  app.querySelector('#log-form select[name="meal"]')?.addEventListener('change', (event) => { state.defaultMeal = event.target.value; save(); });
  app.querySelector('#log-form input[name="foodSearch"]')?.addEventListener('input', updateFoodSearch);
  app.querySelector('#log-form select[name="foodId"]')?.addEventListener('change', updateFoodPreview);
  app.querySelector('#log-form input[name="grams"]')?.addEventListener('input', updateFoodPreview);
  const openLogEditor = (id) => { const entry = state.logs.find((item) => item.id === id); if (entry) { app.insertAdjacentHTML('beforeend', logEditor(entry)); bindLogEditor(); } };
  app.querySelectorAll('[data-remove-log]').forEach((button) => button.addEventListener('click', () => { state.logs = state.logs.filter((item) => item.id !== button.dataset.removeLog); save(); render(); }));
  app.querySelectorAll('[data-edit-log]').forEach((button) => button.addEventListener('click', () => openLogEditor(button.dataset.editLog)));
  app.querySelectorAll('[data-log-row]').forEach((article) => article.addEventListener('dblclick', () => openLogEditor(article.dataset.logRow)));
  app.querySelector('[data-action="open-targets"]')?.addEventListener('click', () => { app.insertAdjacentHTML('beforeend', targets()); bindTargets(); });
  app.querySelector('[data-open-period]')?.addEventListener('click', () => { app.classList.add('period-open'); app.insertAdjacentHTML('beforeend', periodDialog()); bindPeriodDialog(app.querySelector('.period-dialog')); });
  app.querySelector('[data-add-ingredient]')?.addEventListener('click', () => { app.querySelector('#ingredient-lines').insertAdjacentHTML('beforeend', ingredientLine()); });
  app.querySelector('#recipe-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); const foodIds = data.getAll('foodId'); const grams = data.getAll('grams'); state.recipes.unshift({ id: crypto.randomUUID(), name: data.get('name'), ingredients: foodIds.map((foodId, index) => ({ foodId, grams: Number(grams[index]) })) }); save(); notify('Recette créée.'); });
  app.querySelectorAll('[data-edit-recipe]').forEach((button) => button.addEventListener('click', () => { recipeEditorId = button.dataset.editRecipe; render(); }));
  app.querySelector('[data-close-recipe-editor]')?.addEventListener('click', () => { recipeEditorId = null; render(); });
  app.querySelector('[data-add-edit-ingredient]')?.addEventListener('click', () => { app.querySelector('#recipe-edit-lines').insertAdjacentHTML('beforeend', ingredientLine(null, true)); });
  app.querySelectorAll('[data-remove-ingredient]').forEach((button) => button.addEventListener('click', () => { const lines = app.querySelectorAll('#recipe-edit-lines .ingredient-line'); if (lines.length > 1) button.closest('.ingredient-line').remove(); }));
  app.querySelector('#recipe-edit-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); const foodIds = data.getAll('foodId'); const grams = data.getAll('grams'); const recipe = state.recipes.find((item) => item.id === event.target.dataset.recipeId); if (!recipe) return; recipe.name = data.get('name').trim(); recipe.ingredients = foodIds.map((foodId, index) => ({ foodId, grams: Number(grams[index]) })).filter((item) => item.foodId && item.grams > 0); save(); recipeEditorId = null; notify('Recette modifiée.'); });
  app.querySelector('[data-delete-recipe]')?.addEventListener('click', (event) => { if (!confirm('Supprimer définitivement cette recette ?')) return; state.recipes = state.recipes.filter((recipe) => recipe.id !== event.currentTarget.dataset.deleteRecipe); save(); recipeEditorId = null; notify('Recette supprimée.'); });
  app.querySelectorAll('[data-cook]').forEach((button) => button.addEventListener('click', () => { const recipe = state.recipes.find((item) => item.id === button.dataset.cook); if (!recipe) return; app.insertAdjacentHTML('beforeend', recipeCookDialog(recipe)); const dialog = app.querySelector('#recipe-cook-form')?.closest('dialog'); dialog?.querySelectorAll('[data-close-cook-dialog]').forEach((close) => close.addEventListener('click', () => dialog.remove())); dialog?.querySelector('#recipe-cook-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); const entries = recipe.ingredients.map((ingredient) => { const food = state.foods.find((item) => item.id === ingredient.foodId); const grams = Number(ingredient.grams); return food && Number.isFinite(grams) && grams > 0 ? { id: crypto.randomUUID(), date: today(), meal: data.get('meal'), name: foodAmountLabel(food.id, grams, food.name), foodId: food.id, grams, ...nutrientsFor(food, grams) } : null; }).filter(Boolean); state.logs.unshift(...entries); if (data.get('fromStock')) recipe.ingredients.forEach((ingredient) => removeFromStock(ingredient.foodId, ingredient.grams)); save(); dialog.remove(); view = 'journal'; notify(`${recipe.name} ajoutée par ingrédients au journal.`); }); }));
  app.querySelector('#stock-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); const foodId = data.get('foodId'); const unit = preferredUnit(foodId, 'g'); const quantity = quantityFromDisplay(foodId, Number(data.get('quantity')), unit); const minimum = quantityFromDisplay(foodId, Number(data.get('minimum')), unit); const existing = state.stock.find((item) => item.foodId === foodId); if (existing) { existing.quantity += quantity; existing.minimum = minimum; } else { state.stock.push({ id: crypto.randomUUID(), foodId, quantity, minimum }); } save(); notify('Stock mis à jour.'); });
  app.querySelector('#custom-food-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); const name = data.get('name').trim(); if (state.foods.some((food) => food.name.toLocaleLowerCase('fr') === name.toLocaleLowerCase('fr'))) { notify('Cet aliment existe déjà.'); return; } const foodId = `custom-${crypto.randomUUID()}`; state.foods.push({ id: foodId, name, category: data.get('category').trim() || 'Autres', unit: 'g', kcal: Number(data.get('kcal')), protein: Number(data.get('protein')), carbs: Number(data.get('carbs')), fat: Number(data.get('fat')) }); state.stock.push({ id: crypto.randomUUID(), foodId, quantity: Number(data.get('quantity')), minimum: Number(data.get('minimum')) }); save(); notify(`${name} créé et ajouté au stock.`); });
  app.querySelector('#stock-form select[name="foodId"]')?.addEventListener('change', updateStockFormDefaults);
  app.querySelector('[data-open-custom-food]')?.addEventListener('click', () => { app.insertAdjacentHTML('beforeend', customFoodDialog()); const dialog = app.querySelector('#custom-food-form')?.closest('dialog'); dialog?.querySelector('[data-close-custom-food]')?.addEventListener('click', () => dialog.remove()); dialog?.querySelector('#custom-food-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); const name = data.get('name').trim(); if (state.foods.some((food) => food.name.toLocaleLowerCase('fr') === name.toLocaleLowerCase('fr'))) { notify('Cet aliment existe déjà.'); return; } const foodId = `custom-${crypto.randomUUID()}`; state.foods.push({ id: foodId, name, category: data.get('category').trim() || 'Autres', unit: 'g', kcal: Number(data.get('kcal')), protein: Number(data.get('protein')), carbs: Number(data.get('carbs')), fat: Number(data.get('fat')) }); state.stock.push({ id: crypto.randomUUID(), foodId, quantity: Number(data.get('quantity')), minimum: Number(data.get('minimum')) }); save(); dialog.remove(); render(); notify(`${name} créé et ajouté au stock.`); }); });
  app.querySelectorAll('[data-stock-unit]').forEach((select) => select.addEventListener('change', (event) => { event.stopPropagation(); state.unitPreferences[select.dataset.stockUnit] = select.value; save(); render(); }));
  app.querySelectorAll('[data-adjust-stock]').forEach((button) => button.addEventListener('click', () => { const item = state.stock.find((stock) => stock.id === button.dataset.adjustStock); item.quantity = Math.max(0, Number(item.quantity) + Number(button.dataset.change)); save(); render(); }));
  app.querySelectorAll('[data-edit-stock]').forEach((article) => { let timer; const open = () => { const item = state.stock.find((stock) => stock.id === article.dataset.editStock); if (!item) return; app.insertAdjacentHTML('beforeend', stockEditor(item)); const dialog = app.querySelector('#stock-editor-form')?.closest('dialog'); dialog?.querySelector('[data-close-stock-editor]')?.addEventListener('click', () => dialog.remove()); dialog?.querySelector('#stock-editor-form')?.addEventListener('submit', (event) => { event.preventDefault(); const form = event.target; const data = new FormData(form); const unit = form.dataset.stockUnit; const food = state.foods.find((entry) => entry.id === item.foodId); if (!food) return; Object.assign(food, { name: data.get('name').trim(), kcal: Number(data.get('kcal')), protein: Number(data.get('protein')), carbs: Number(data.get('carbs')), fat: Number(data.get('fat')) }); item.quantity = Math.max(0, quantityFromDisplay(item.foodId, Number(data.get('quantity')), unit)); if (unit !== 'unité') state.unitPreferences[item.foodId] = unit; save(); dialog.remove(); render(); }); }; article.addEventListener('dblclick', open); article.addEventListener('pointerdown', () => { timer = setTimeout(open, 600); }); article.addEventListener('pointerup', () => clearTimeout(timer)); article.addEventListener('pointerleave', () => clearTimeout(timer)); });
  app.querySelector('#shopping-form')?.addEventListener('submit', (event) => { event.preventDefault(); const name = new FormData(event.target).get('name').trim(); state.shopping.push({ id: crypto.randomUUID(), name, done: false }); save(); notify('Article ajouté.'); });
  app.querySelectorAll('[data-check-shopping]').forEach((input) => input.addEventListener('change', () => { const linkedName = input.dataset.linkedPrice; if (linkedName) { rememberOpenShoppingCategories(); state.shoppingSelection = state.shoppingSelection || []; state.shoppingQuantities = state.shoppingQuantities || {}; if (input.checked && !state.shoppingQuantities[linkedName]) state.shoppingQuantities[linkedName] = purchaseSpec(linkedName).quantity; state.shoppingSelection = input.checked ? [...new Set([...state.shoppingSelection, linkedName])] : state.shoppingSelection.filter((name) => name !== linkedName); save(); render(); return; } const item = state.shopping.find((entry) => entry.id === input.dataset.checkShopping); if (item) { item.done = input.checked; save(); } }));
  app.querySelectorAll('[data-remove-shopping]').forEach((button) => button.addEventListener('click', () => { state.shopping = state.shopping.filter((item) => item.id !== button.dataset.removeShopping); save(); render(); }));
  app.querySelectorAll('[data-price-product]').forEach((button) => button.addEventListener('click', () => { const details = app.querySelector(`[data-price-details="${CSS.escape(button.dataset.priceProduct)}"]`); if (details) details.hidden = !details.hidden; }));
  app.querySelectorAll('[data-remove-price-product]').forEach((button) => button.addEventListener('click', () => { state.priceRecords = state.priceRecords.filter((item) => item.name !== button.dataset.removePriceProduct); save(); render(); }));
  app.querySelectorAll('[data-select-price]').forEach((input) => input.addEventListener('change', () => { rememberOpenShoppingCategories(); state.shoppingSelection = state.shoppingSelection || []; state.shoppingQuantities = state.shoppingQuantities || {}; if (input.checked && !state.shoppingQuantities[input.dataset.selectPrice]) state.shoppingQuantities[input.dataset.selectPrice] = purchaseSpec(input.dataset.selectPrice).quantity; state.shoppingSelection = input.checked ? [...new Set([...state.shoppingSelection, input.dataset.selectPrice])] : state.shoppingSelection.filter((name) => name !== input.dataset.selectPrice); save(); render(); }));
  app.querySelectorAll('[data-shopping-quantity]').forEach((input) => { input.type = 'text'; input.inputMode = 'decimal'; input.addEventListener('change', () => { const unit = app.querySelector(`[data-shopping-unit="${CSS.escape(input.dataset.shoppingQuantity)}"]`)?.value || 'g'; const value = Math.max(1, Number(input.value.replace(',', '.')) || 1); state.shoppingQuantities = state.shoppingQuantities || {}; state.shoppingQuantities[input.dataset.shoppingQuantity] = unit === 'kg' ? value * 1000 : value; save(); render(); }); });
  app.querySelectorAll('[data-shopping-step]').forEach((button) => button.addEventListener('click', () => { const name = button.dataset.shoppingName; const item = selectedShoppingItems(state.priceRecords || PRICE_RECORDS).find((entry) => entry.name === name); if (!item) return; const display = shoppingQuantityDisplay(item); const step = 1; const value = Math.max(1, number(display.value + Number(button.dataset.shoppingStep) * step)); state.shoppingQuantities = state.shoppingQuantities || {}; state.shoppingQuantities[name] = display.unit === 'kg' ? value * 1000 : value; save(); render(); }));
  app.querySelectorAll('.shopping-summary .quantity-controls > span').forEach((span) => { const name = span.closest('label')?.querySelector('[data-shopping-quantity]')?.dataset.shoppingQuantity; if (!name) return; const select = document.createElement('select'); select.dataset.shoppingUnit = name; ['g', 'kg', 'unité'].forEach((unit) => { const option = new Option(unit, unit); if (unit === span.textContent.trim()) option.selected = true; select.add(option); }); span.replaceWith(select); });
  app.querySelectorAll('[data-shopping-unit]').forEach((select) => { if (![...select.options].some((option) => option.value === 'unité')) select.add(new Option('unité', 'unité')); select.addEventListener('change', () => { const name = select.dataset.shoppingUnit; const item = selectedShoppingItems(state.priceRecords || PRICE_RECORDS).find((entry) => entry.name === name); state.shoppingUnitPreferences[name] = select.value; if (item?.food) state.unitPreferences[item.food.id] = select.value; save(); render(); }); });
  app.querySelector('[data-copy-shopping]')?.addEventListener('click', async (event) => { event.preventDefault(); event.stopPropagation(); const currentItems = selectedShoppingItems(state.priceRecords || PRICE_RECORDS); if (await copyText(shoppingExportText(currentItems))) notify('Liste de courses copiée.'); else notify('Copie impossible dans ce navigateur.'); });
  app.querySelector('[data-export-shopping]')?.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); const currentItems = selectedShoppingItems(state.priceRecords || PRICE_RECORDS); const blob = new Blob([shoppingExportText(currentItems)], { type: 'text/plain;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'liste-de-courses.txt'; link.click(); URL.revokeObjectURL(link.href); notify('Liste de courses extraite.'); });
  app.querySelector('[data-copy-stock]')?.addEventListener('click', async () => { if (await copyText(stockExportText())) notify('Stock copié.'); else notify('Copie impossible dans ce navigateur.'); });
  const stockCopyButton = app.querySelector('[data-copy-stock]');
  if (stockCopyButton && !app.querySelector('[data-copy-stock-plus]')) { const plus = document.createElement('button'); plus.type = 'button'; plus.className = 'small'; plus.dataset.copyStockPlus = ''; plus.textContent = 'Copier +'; stockCopyButton.insertAdjacentElement('afterend', plus); plus.addEventListener('click', async () => { if (await copyText(stockExportDetailedText())) notify('Stock et apports copiés.'); else notify('Copie impossible dans ce navigateur.'); }); }
  app.querySelector('[data-export-stock]')?.addEventListener('click', () => { const blob = new Blob([stockExportText()], { type: 'text/plain;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'stock-actuel.txt'; link.click(); URL.revokeObjectURL(link.href); notify('Stock extrait.'); });
  app.querySelectorAll('[data-price-food]').forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); const food = state.foods.find((item) => item.id === form.dataset.priceFood); const price = Number(new FormData(form).get('price')); if (!food || !Number.isFinite(price) || price < 0) return; food.price = price; food.priceHistory = [...(food.priceHistory || []), { date: today(), price }]; save(); notify('Prix mis à jour.'); }));
}
function bindLogEditor() {
  const dialog = app.querySelector('#log-editor-form')?.closest('dialog');
  const form = dialog?.querySelector('#log-editor-form');
  const recipeDialog = app.querySelector('#recipe-log-editor-form')?.closest('dialog');
  const recipeForm = recipeDialog?.querySelector('#recipe-log-editor-form');
  const activeDialog = dialog || recipeDialog;
  if (!activeDialog) return;
  activeDialog.querySelector('[data-close-log-editor]').addEventListener('click', () => activeDialog.remove());
  if (recipeForm) {
    recipeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(recipeForm);
      const entry = state.logs.find((item) => item.id === recipeForm.dataset.logId);
      const recipe = state.recipes.find((item) => item.id === data.get('recipeId'));
      if (!entry || !recipe) return;
      const nutrients = recipeNutrients(recipe, state.foods);
      Object.assign(entry, { meal: data.get('meal'), recipeId: recipe.id, name: recipe.name, grams: recipe.ingredients.reduce((sum, item) => sum + Number(item.grams), 0), ...nutrients });
      save();
      recipeDialog.remove();
      notify('Recette modifiée.');
    });
    return;
  }
  if (!dialog || !form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const entry = state.logs.find((item) => item.id === form.dataset.logId);
    const food = state.foods.find((item) => item.id === data.get('foodId'));
    const grams = Number(data.get('grams'));
    if (!entry || !food || !Number.isFinite(grams) || grams < 1) return;
    Object.assign(entry, { meal: data.get('meal'), foodId: food.id, name: food.name, grams, ...nutrientsFor(food, grams) });
    save();
    dialog.remove();
    notify('Repas modifié.');
  });
}
function updateFoodPreview() {
  const form = app.querySelector('#log-form');
  const preview = app.querySelector('#food-preview');
  if (!form || !preview) return;
  preview.outerHTML = foodPreview(form.elements.foodId.value, form.elements.grams.value);
}

function updateStockFormDefaults(event) {
  const form = event.currentTarget.form;
  const defaults = stockFormDefaults(event.currentTarget.value);
  form.elements.quantity.value = defaults.quantity;
  form.elements.minimum.value = defaults.minimum;
  form.querySelector('[data-stock-quantity-label]').textContent = `Quantité (${defaults.unit})`;
  form.querySelector('[data-stock-minimum-label]').textContent = `Alerte sous (${defaults.unit})`;
}

function updateFoodSearch(event) {
  const form = event.currentTarget.form;
  const query = event.currentTarget.value.trim().toLocaleLowerCase('fr');
  const select = form.elements.foodId;
  const currentId = select.value;
  select.innerHTML = foodOptions();
  [...select.options].forEach((option) => {
    const food = state.foods.find((item) => item.id === option.value);
    const matches = !query || food?.name.toLocaleLowerCase('fr').includes(query);
    option.hidden = !matches;
  });
  if ([...select.options].some((option) => option.value === currentId && !option.hidden)) select.value = currentId;
  else {
    const firstVisible = [...select.options].find((option) => !option.hidden);
    if (firstVisible) select.value = firstVisible.value;
  }
  updateFoodPreview();
}
function bindTargets() { const dialog = app.querySelector('dialog'); dialog.querySelector('[data-close-targets]').addEventListener('click', () => dialog.remove()); dialog.querySelector('#targets-form').addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); state.targets = Object.fromEntries(['kcal','protein','carbs','fat'].map((key) => [key, data.get(key)])); save(); dialog.remove(); notify('Objectifs enregistrés.'); }); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js?v=20260920-111');
if (!history.state?.repasStock) history.replaceState({ repasStock: true, view }, '', location.href);
addEventListener('popstate', (event) => { view = event.state?.repasStock ? event.state.view : 'journal'; render(); });
render();



































