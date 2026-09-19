import { addNutrients, emptyState, foodName, lowStock, nutrientsFor, recipeNutrients, SAMPLE_FOODS } from './domain.js?v=20260919-6';

const STORAGE_KEY = 'repas-stock-v1';
const TEST_MEAL_VERSION = 'eggs-cheese-mayo-20260919';
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
      next.testMealVersion = TEST_MEAL_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    }
    const knownIds = new Set(saved.foods.map((food) => food.id));
    const next = { ...saved, foods: [...saved.foods, ...SAMPLE_FOODS.filter((food) => !knownIds.has(food.id))] };
    if (next.testMealVersion !== TEST_MEAL_VERSION) {
      next.logs = testMealLogs(next.foods);
      next.testMealVersion = TEST_MEAL_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  } catch { return emptyState(); }
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
function foodPreview(foodId, grams) {
  const food = state.foods.find((item) => item.id === foodId);
  if (!food || !Number(grams)) return '';
  const addition = nutrientsFor(food, grams);
  const current = totalToday();
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
  return `<aside id="food-preview" class="food-preview"><h3>Effet avant ajout</h3><p><b>${food.name}</b> · ${grams} g</p><div class="donut-grid">${charts}</div><p class="hint">Vert clair : déjà consommé · vert foncé : ajout proposé. Ce repère compare seulement aux objectifs renseignés.</p></aside>`;
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
  <form id="log-form" class="form-grid"><label>Repas<select name="meal"><option>Petit-déjeuner</option><option>Déjeuner</option><option>Dîner</option><option>Collation</option></select></label><label>Aliment<select name="foodId">${foodOptions()}</select></label><label>Quantité (g)<input name="grams" type="number" min="1" value="100" required /></label><button>Ajouter</button></form>${foodPreview(state.foods[0]?.id, 100)}</section>
  <section class="panel"><h2>Repas enregistrés</h2>${logs.length ? `<div class="log-list">${logs.map((entry) => `<article><div><b>${entry.meal}</b><span>${entry.name} · ${entry.grams} g</span></div><strong>${entry.kcal} kcal</strong><button class="icon" data-remove-log="${entry.id}" aria-label="Supprimer">×</button></article>`).join('')}</div>` : '<p class="empty">Aucun repas enregistré pour aujourd’hui.</p>'}</section>`;
}
function recipes() {
  return `<section class="hero"><p>RECETTES</p><h1>Cuisiner, puis enregistrer</h1><span>Les ingrédients peuvent être déduits du stock.</span></section>
  <section class="panel"><h2>Nouvelle recette</h2><form id="recipe-form"><label class="recipe-name">Nom<input name="name" required placeholder="Ex. bol protéiné" /></label><div id="ingredient-lines">${ingredientLine()}</div><button class="add-line" type="button" data-add-ingredient>+ Ajouter un ingrédient</button><button>Créer la recette</button></form></section>
  <section class="panel"><h2>Mes recettes</h2>${state.recipes.length ? `<div class="cards">${state.recipes.map((recipe) => { const n = recipeNutrients(recipe, state.foods); return `<article class="recipe-card"><h3>${recipe.name}</h3><p>${recipe.ingredients.map((item) => `${foodName(state, item.foodId)} · ${item.grams} g`).join(', ')}</p><strong>${number(n.kcal)} kcal · ${number(n.protein)} g prot.</strong><button data-cook="${recipe.id}">Cuisiner et ajouter au journal</button></article>`; }).join('')}</div>` : '<p class="empty">Crée une recette pour la retrouver ici.</p>'}</section>`;
}
function stock() {
  return `<section class="hero"><p>PLACARDS</p><h1>Ce qu’il reste à la maison</h1><span>Les alertes apparaissent au niveau minimum choisi.</span></section>
  <section class="panel"><h2>Ajouter au stock</h2><form id="stock-form" class="form-grid"><label>Aliment<select name="foodId">${foodOptions()}</select></label><label>Quantité (g)<input name="quantity" type="number" min="0" value="100" required /></label><label>Alerte sous (g)<input name="minimum" type="number" min="0" value="50" required /></label><button>Ajouter</button></form></section>
  <section class="panel"><h2>Stock actuel</h2>${state.stock.length ? `<div class="stock-list">${state.stock.map((item) => `<article class="${Number(item.quantity) <= Number(item.minimum) ? 'low' : ''}"><div><b>${foodName(state, item.foodId)}</b><span>${item.quantity} g disponibles · seuil ${item.minimum} g</span></div><div><button class="small" data-adjust-stock="${item.id}" data-change="-50">− 50 g</button><button class="small" data-adjust-stock="${item.id}" data-change="50">+ 50 g</button></div></article>`).join('')}</div>` : '<p class="empty">Le stock est vide.</p>'}</section>`;
}
function shopping() {
  const low = lowStock(state);
  const items = [...low.map((item) => ({ id: item.id, name: foodName(state, item.foodId), suggested: Math.max(0, Number(item.minimum) - Number(item.quantity)) })), ...state.shopping];
  return `<section class="hero"><p>LISTE DE COURSES</p><h1>À acheter quand tu veux</h1><span>Propositions fondées sur les seuils de stock.</span></section>
  <section class="panel"><h2>Ajouter un article</h2><form id="shopping-form" class="inline-form"><input name="name" required placeholder="Ex. œufs" /><button>Ajouter</button></form></section>
  <section class="panel"><h2>À prévoir</h2>${items.length ? `<div class="shopping-list">${items.map((item) => `<label><input type="checkbox" data-check-shopping="${item.id}" ${item.done ? 'checked' : ''}/><span>${item.name}${item.suggested ? ` · au moins ${item.suggested} g` : ''}</span>${item.id.startsWith('stock-') ? '<em>stock faible</em>' : '<button class="icon" data-remove-shopping="' + item.id + '">×</button>'}</label>`).join('')}</div>` : '<p class="empty">Aucun produit à acheter pour le moment.</p>'}</section>`;
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
  app.querySelectorAll('[data-check-shopping]').forEach((input) => input.addEventListener('change', () => { const item = state.shopping.find((entry) => entry.id === input.dataset.checkShopping); if (item) { item.done = input.checked; save(); } }));
  app.querySelectorAll('[data-remove-shopping]').forEach((button) => button.addEventListener('click', () => { state.shopping = state.shopping.filter((item) => item.id !== button.dataset.removeShopping); save(); render(); }));
}
function updateFoodPreview() {
  const form = app.querySelector('#log-form');
  const preview = app.querySelector('#food-preview');
  if (!form || !preview) return;
  preview.outerHTML = foodPreview(form.elements.foodId.value, form.elements.grams.value);
}
function bindTargets() { const dialog = app.querySelector('dialog'); dialog.querySelector('[data-close-targets]').addEventListener('click', () => dialog.remove()); dialog.querySelector('#targets-form').addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); state.targets = Object.fromEntries(['kcal','protein','carbs','fat'].map((key) => [key, data.get(key)])); save(); dialog.remove(); notify('Objectifs enregistrés.'); }); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js?v=20260919-6');
render();
