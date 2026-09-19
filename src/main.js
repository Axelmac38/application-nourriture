import { addNutrients, emptyState, foodName, lowStock, nutrientsFor, recipeNutrients, SAMPLE_FOODS } from './domain.js?v=20260919-34';

const STORAGE_KEY = 'repas-stock-v1';
const TEST_MEAL_VERSION = 'eggs-cheese-mayo-20260919';
const SAMPLE_RECIPES_VERSION = 'sample-recipes-20260919';
const STOCK_VERSION = 'stock-axel-20260919-v3';
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
const app = document.querySelector('#app');
let state = loadState();
let view = 'journal';
let toast = '';

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved?.foods) {
      const next = emptyState();
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
    { id: 'recipe-chicken-rice', name: 'Poulet, riz et avocat', ingredients: [{ foodId: 'chicken', grams: 150 }, { foodId: 'rice', grams: 200 }, { foodId: 'avocado', grams: 50 }] },
    { id: 'recipe-protein-bowl', name: 'Bol protéiné à la whey', ingredients: [{ foodId: 'oats', grams: 60 }, { foodId: 'whey', grams: 30 }, { foodId: 'banana', grams: 100 }, { foodId: 'greek-yogurt', grams: 150 }] }
  ];
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function today() { return new Date().toISOString().slice(0, 10); }
function number(value) { return Math.round(Number(value || 0) * 10) / 10; }
function notify(message) { toast = message; render(); setTimeout(() => { toast = ''; render(); }, 2600); }
function totalToday() { return addNutrients(state.logs.filter((entry) => entry.date === today())); }
function targetCard(label, key, value, suffix) {
  const target = Number(state.targets[key]);
  const percent = target ? Math.min(100, Math.round((value / target) * 100)) : null;
  return `<article class="metric"><span>${label}</span><strong>${number(value)}${suffix}</strong>${percent === null ? '<small>Objectif non renseigné</small>' : `<small>${percent}% de ${target}${suffix}</small><i><b style="width:${percent}%"></b></i>`}</article>`;
}
function foodOptions() {
  const groups = new Map();
  state.foods.forEach((food) => groups.set(food.category || 'Autres', [...(groups.get(food.category || 'Autres') || []), food]));
  return [...groups.entries()].map(([category, foods]) => `<optgroup label="${category}">${foods.map((food) => `<option value="${food.id}">${food.name}</option>`).join('')}</optgroup>`).join('');
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
function journal() {
  const totals = totalToday();
  const logs = state.logs.filter((entry) => entry.date === today());
  return `<section class="hero"><p>AUJOURD’HUI</p><h1>Ton journal alimentaire</h1><span>${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span></section>
  <section class="metrics">${targetCard('Énergie', 'kcal', totals.kcal, ' kcal')}${targetCard('Protéines', 'protein', totals.protein, ' g')}${targetCard('Glucides', 'carbs', totals.carbs, ' g')}${targetCard('Lipides', 'fat', totals.fat, ' g')}</section>
  <button class="goals-button" data-action="open-targets"><span>Objectifs quotidiens</span><b>Définir ou modifier →</b></button>
  <section class="panel"><h2>Ajouter un aliment</h2>
  <form id="log-form" class="form-grid"><label>Repas<select name="meal"><option>Petit-déjeuner</option><option>Déjeuner</option><option>Dîner</option><option>Collation</option></select></label><label>Aliment<input name="foodSearch" placeholder="Rechercher dans la liste…" autocomplete="off" /><select name="foodId">${foodOptions()}</select></label><label>Quantité (g)<input name="grams" type="number" min="1" value="100" required /></label><button>Ajouter</button></form>${foodPreview(state.foods[0]?.id, 100)}</section>
  <section class="panel"><h2>Repas enregistrés</h2>${logs.length ? `<div class="log-list">${logs.map((entry) => `<article><div><b>${entry.meal}</b><span>${entry.name} · ${entry.grams} g</span></div><strong>${entry.kcal} kcal</strong><button class="icon" data-remove-log="${entry.id}" aria-label="Supprimer">×</button></article>`).join('')}</div>` : '<p class="empty">Aucun repas enregistré pour aujourd’hui.</p>'}</section>`;
}
function recipes() {
  return `<section class="hero"><p>RECETTES</p><h1>Cuisiner, puis enregistrer</h1><span>Les ingrédients peuvent être déduits du stock.</span></section>
  <section class="panel"><h2>Nouvelle recette</h2><form id="recipe-form"><label class="recipe-name">Nom<input name="name" required placeholder="Ex. bol protéiné" /></label><div id="ingredient-lines">${ingredientLine()}</div><button class="add-line" type="button" data-add-ingredient>+ Ajouter un ingrédient</button><button>Créer la recette</button></form></section>
  <section class="panel"><h2>Mes recettes</h2>${state.recipes.length ? `<div class="cards">${state.recipes.map((recipe) => { const n = recipeNutrients(recipe, state.foods); return `<article class="recipe-card"><h3>${recipe.name}</h3><p>${recipe.ingredients.map((item) => `${foodName(state, item.foodId)} · ${item.grams} g`).join(', ')}</p><strong>${number(n.kcal)} kcal · ${number(n.protein)} g prot.</strong><button data-cook="${recipe.id}">Cuisiner et ajouter au journal</button></article>`; }).join('')}</div>` : '<p class="empty">Crée une recette pour la retrouver ici.</p>'}</section>`;
}
function stock() {
  return `<section class="hero"><p>PLACARDS</p><h1>Ce qu’il reste à la maison</h1></section>
  <section class="panel"><h2>Ajouter au stock</h2><form id="stock-form" class="form-grid"><label>Aliment<select name="foodId">${foodOptions()}</select></label><label>Quantité (g)<input name="quantity" type="number" min="0" value="100" required /></label><label>Alerte sous (g)<input name="minimum" type="number" min="0" value="50" required /></label><button>Ajouter</button></form></section>
  <section class="panel"><h2>Stock actuel</h2>${state.stock.length ? `<div class="stock-list">${state.stock.map((item) => `<article class="${Number(item.quantity) <= Number(item.minimum) ? 'low' : ''}"><div><b>${foodName(state, item.foodId)}</b><span>${item.quantity} g disponibles · seuil ${item.minimum} g</span></div><div><button class="small" data-adjust-stock="${item.id}" data-change="-50">− 50 g</button><button class="small" data-adjust-stock="${item.id}" data-change="50">+ 50 g</button></div></article>`).join('')}</div>` : '<p class="empty">Le stock est vide.</p>'}</section>`;
}
function priceChart(records) {
  if (records.length < 2) return '<p class="empty">Un seul relevé pour le moment.</p>';
  const prices = records.map((item) => item.price);
  const min = Math.min(...prices); const max = Math.max(...prices); const span = max - min || 1;
  const coordinates = records.map((item, index) => ({ x: (index / (records.length - 1)) * 228 + 34, y: 92 - ((item.price - min) / span) * 62 }));
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(' ');
  return `<div class="price-chart-wrap"><svg class="price-chart" viewBox="0 0 280 120" role="img" aria-label="Évolution du prix"><line x1="34" y1="30" x2="262" y2="30"/><line x1="34" y1="61" x2="262" y2="61"/><line x1="34" y1="92" x2="262" y2="92"/><text x="3" y="34">${max.toFixed(2)} €</text><text x="3" y="96">${min.toFixed(2)} €</text><polyline points="${points}"/>${coordinates.map(({ x, y }) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}</svg><small>${records[0].price.toFixed(2)} € → ${records.at(-1).price.toFixed(2)} €</small></div>`;
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
  return `<article class="tracked-product"><label class="product-pick"><input type="checkbox" data-select-price="${name}" ${selected.includes(name) ? 'checked' : ''}/><span><b>${name}</b><small>Lidl · ${latest.price.toFixed(2)} € · ${records.length} relevé${records.length > 1 ? 's' : ''}</small></span></label><button class="product-toggle" data-price-product="${name}">Voir l’évolution <strong>⌄</strong></button><div class="price-details" hidden data-price-details="${name}"><div class="price-store">Prix relevés chez Lidl · Saint-Martin-d’Hères</div>${priceChart(records)}<div class="price-history">${records.map((item) => `<span>${item.date} · ${item.price.toFixed(2)} €${item.quantity > 1 ? ` · ${item.quantity} unités` : ''}</span>`).join('')}</div><button class="small danger" data-remove-price-product="${name}">Supprimer ce produit</button></div></article>`;
}
function purchaseSpec(name) {
  const specs = {
    'Flocons d’avoine': ['oats', 1000], 'Coquillettes 1 kg': ['pasta-dry', 1000], 'Lentilles vertes': ['lentils-green', 500],
    'Fromage blanc': ['fromage-blanc', 1000], 'Emmental râpé': ['emmental', 250], 'Mayonnaise': ['mayonnaise', 500],
    'Banane 4 fruits': ['banana', 500], 'Citron 500 g': ['lemon', 500], 'Ail 250 g': ['garlic', 250],
    'Jus d’orange': [null, 1000], 'Pain de mie': ['wholewheat-bread', 500], 'Crème fraîche épaisse': [null, 200]
  };
  const [foodId = null, quantity = 1] = specs[name] || [];
  return { foodId, quantity };
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
    const nutrients = food ? nutrientsFor(food, quantity) : { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    return { name, latest, quantity, baseQuantity: spec.quantity, food, nutrients };
  });
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
  const categories = ['Fruits et légumes', 'Féculents et céréales', 'Produits laitiers', 'Viandes et charcuterie', 'Sauces et condiments', 'Boissons et snacking', 'Non alimentaire'];
  return `<section class="hero"><p>LISTE DE COURSES</p><h1>À acheter quand tu veux</h1><span>Propositions fondées sur les seuils de stock.</span></section>
  <section class="panel"><h2>Ajouter un article</h2><form id="shopping-form" class="inline-form"><input name="name" required placeholder="Ex. œufs" /><button>Ajouter</button></form></section>
  <section class="panel"><h2>Mon panier</h2>${items.length ? `<div class="shopping-list">${items.map((item) => `<label><input type="checkbox" data-check-shopping="${item.id}" ${item.linkedPriceProduct ? `data-linked-price="${item.linkedPriceProduct}" ${selected.includes(item.linkedPriceProduct) ? 'checked' : ''}` : (item.done ? 'checked' : '')}/><span>${item.name}${item.suggested ? ` · au moins ${item.suggested} g` : ''}</span>${item.id.startsWith('stock-') ? '<em>stock faible</em>' : '<button class="icon" data-remove-shopping="' + item.id + '">×</button>'}</label>`).join('')}</div>` : ''}<h3 class="subheading">Produits suivis chez Lidl</h3>${categories.map((category) => { const names = products.filter((name) => priceCategory(name) === category); return names.length ? `<details class="product-category" open><summary>${category} <small>${names.length}</small></summary>${names.map((name) => priceProductCard(name, history, selected)).join('')}</details>` : ''; }).join('') || '<p class="empty">Aucun produit suivi.</p>'}${selectedItems.length ? `<section class="shopping-summary"><h3>Liste de courses</h3>${selectedItems.map((item) => `<article><div><b>${item.name}</b><small>${item.food ? 'Aliment relié au catalogue' : 'Prix disponible, composition à renseigner'}</small></div><label>Quantité (g)<input type="number" min="1" step="1" value="${item.quantity}" data-shopping-quantity="${item.name}" /></label><strong>${((item.latest?.price || 0) * item.quantity / item.baseQuantity).toFixed(2)} €</strong></article>`).join('')}<div class="cart-total"><b>Total estimé</b><strong>${total.toFixed(2)} €</strong></div><div class="cart-macros"><span>${number(nutritionTotal.kcal)} kcal</span><span>${number(nutritionTotal.protein)} g prot.</span><span>${number(nutritionTotal.carbs)} g gluc.</span><span>${number(nutritionTotal.fat)} g lip.</span></div></section>` : ''}</section>`;
}
function targets() {
  return `<dialog open class="target-dialog"><form id="targets-form"><button class="close" type="button" data-close-targets aria-label="Fermer">×</button><h2>Objectifs quotidiens</h2><p>Facultatifs : ils servent seulement à afficher des pourcentages et ne constituent pas un conseil médical.</p><div class="target-fields">${[['kcal','Calories (kcal)'],['protein','Protéines (g)'],['carbs','Glucides (g)'],['fat','Lipides (g)']].map(([key,label]) => `<label>${label}<input type="number" min="0" name="${key}" value="${state.targets[key]}" /></label>`).join('')}</div><button class="save-targets">Enregistrer les objectifs</button></form></dialog>`;
}
function ingredientLine() {
  return `<div class="ingredient-line"><label>Ingrédient<select name="foodId">${foodOptions()}</select></label><label>Quantité (g)<input name="grams" type="number" min="1" value="100" required /></label></div>`;
}
function render() {
  const content = view === 'journal' ? journal() : view === 'recettes' ? recipes() : view === 'stock' ? stock() : shopping();
  app.innerHTML = `<header><a href="#" class="brand">repas<span>&</span>stock</a><small>Données enregistrées sur cet appareil</small></header>${content}${nav()}${toast ? `<div class="toast">${toast}</div>` : ''}`;
  bind();
}
function bind() {
  app.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
  app.querySelector('#log-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); addLog(data.get('foodId'), Number(data.get('grams')), data.get('meal')); save(); notify('Aliment ajouté au journal.'); });
  app.querySelector('#log-form input[name="foodSearch"]')?.addEventListener('input', updateFoodSearch);
  app.querySelector('#log-form select[name="foodId"]')?.addEventListener('change', updateFoodPreview);
  app.querySelector('#log-form input[name="grams"]')?.addEventListener('input', updateFoodPreview);
  app.querySelectorAll('[data-remove-log]').forEach((button) => button.addEventListener('click', () => { state.logs = state.logs.filter((item) => item.id !== button.dataset.removeLog); save(); render(); }));
  app.querySelector('[data-action="open-targets"]')?.addEventListener('click', () => { app.insertAdjacentHTML('beforeend', targets()); bindTargets(); });
  app.querySelector('[data-add-ingredient]')?.addEventListener('click', () => { app.querySelector('#ingredient-lines').insertAdjacentHTML('beforeend', ingredientLine()); });
  app.querySelector('#recipe-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); const foodIds = data.getAll('foodId'); const grams = data.getAll('grams'); state.recipes.unshift({ id: crypto.randomUUID(), name: data.get('name'), ingredients: foodIds.map((foodId, index) => ({ foodId, grams: Number(grams[index]) })) }); save(); notify('Recette créée.'); });
  app.querySelectorAll('[data-cook]').forEach((button) => button.addEventListener('click', () => { const recipe = state.recipes.find((item) => item.id === button.dataset.cook); const n = recipeNutrients(recipe, state.foods); state.logs.unshift({ id: crypto.randomUUID(), date: today(), meal: 'Repas', name: recipe.name, grams: recipe.ingredients.reduce((sum, item) => sum + item.grams, 0), ...n }); recipe.ingredients.forEach((ingredient) => { const stock = state.stock.find((item) => item.foodId === ingredient.foodId); if (stock) stock.quantity = Math.max(0, Number(stock.quantity) - Number(ingredient.grams)); }); save(); view = 'journal'; notify('Recette ajoutée et stock mis à jour.'); }));
  app.querySelector('#stock-form')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); const existing = state.stock.find((item) => item.foodId === data.get('foodId')); if (existing) { existing.quantity += Number(data.get('quantity')); existing.minimum = Number(data.get('minimum')); } else { state.stock.push({ id: crypto.randomUUID(), foodId: data.get('foodId'), quantity: Number(data.get('quantity')), minimum: Number(data.get('minimum')) }); } save(); notify('Stock mis à jour.'); });
  app.querySelectorAll('[data-adjust-stock]').forEach((button) => button.addEventListener('click', () => { const item = state.stock.find((stock) => stock.id === button.dataset.adjustStock); item.quantity = Math.max(0, Number(item.quantity) + Number(button.dataset.change)); save(); render(); }));
  app.querySelector('#shopping-form')?.addEventListener('submit', (event) => { event.preventDefault(); const name = new FormData(event.target).get('name').trim(); state.shopping.push({ id: crypto.randomUUID(), name, done: false }); save(); notify('Article ajouté.'); });
  app.querySelectorAll('[data-check-shopping]').forEach((input) => input.addEventListener('change', () => { const linkedName = input.dataset.linkedPrice; if (linkedName) { state.shoppingSelection = state.shoppingSelection || []; state.shoppingQuantities = state.shoppingQuantities || {}; if (input.checked && !state.shoppingQuantities[linkedName]) state.shoppingQuantities[linkedName] = purchaseSpec(linkedName).quantity; state.shoppingSelection = input.checked ? [...new Set([...state.shoppingSelection, linkedName])] : state.shoppingSelection.filter((name) => name !== linkedName); save(); render(); return; } const item = state.shopping.find((entry) => entry.id === input.dataset.checkShopping); if (item) { item.done = input.checked; save(); } }));
  app.querySelectorAll('[data-remove-shopping]').forEach((button) => button.addEventListener('click', () => { state.shopping = state.shopping.filter((item) => item.id !== button.dataset.removeShopping); save(); render(); }));
  app.querySelectorAll('[data-price-product]').forEach((button) => button.addEventListener('click', () => { const details = app.querySelector(`[data-price-details="${CSS.escape(button.dataset.priceProduct)}"]`); if (details) details.hidden = !details.hidden; }));
  app.querySelectorAll('[data-remove-price-product]').forEach((button) => button.addEventListener('click', () => { state.priceRecords = state.priceRecords.filter((item) => item.name !== button.dataset.removePriceProduct); save(); render(); }));
  app.querySelectorAll('[data-select-price]').forEach((input) => input.addEventListener('change', () => { state.shoppingSelection = state.shoppingSelection || []; state.shoppingQuantities = state.shoppingQuantities || {}; if (input.checked && !state.shoppingQuantities[input.dataset.selectPrice]) state.shoppingQuantities[input.dataset.selectPrice] = purchaseSpec(input.dataset.selectPrice).quantity; state.shoppingSelection = input.checked ? [...new Set([...state.shoppingSelection, input.dataset.selectPrice])] : state.shoppingSelection.filter((name) => name !== input.dataset.selectPrice); save(); render(); }));
  app.querySelectorAll('[data-shopping-quantity]').forEach((input) => input.addEventListener('change', () => { state.shoppingQuantities = state.shoppingQuantities || {}; state.shoppingQuantities[input.dataset.shoppingQuantity] = Math.max(1, Number(input.value) || 1); save(); render(); }));
  app.querySelectorAll('[data-price-food]').forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); const food = state.foods.find((item) => item.id === form.dataset.priceFood); const price = Number(new FormData(form).get('price')); if (!food || !Number.isFinite(price) || price < 0) return; food.price = price; food.priceHistory = [...(food.priceHistory || []), { date: today(), price }]; save(); notify('Prix mis à jour.'); }));
}
function updateFoodPreview() {
  const form = app.querySelector('#log-form');
  const preview = app.querySelector('#food-preview');
  if (!form || !preview) return;
  preview.outerHTML = foodPreview(form.elements.foodId.value, form.elements.grams.value);
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
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js?v=20260919-34');
render();
