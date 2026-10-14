import type { Food, Unit } from './foodDb';

// ── Common foods ─────────────────────────────────────────────────────────────
// Open Food Facts is a database of *packaged products*, so searching "eggs"
// returns "6 Free Range Eggs" and "12 Large Eggs" — boxes, not food. These are
// the generic whole foods you actually log, with the portions you think in
// ("1 egg", "1 scoop", "1 slice") rather than grams.
//
// Macros are per 100 g, from standard reference values (USDA FoodData Central
// for the Western staples). Cooked weights are used where a food is normally
// eaten cooked, since that is what ends up on the plate. Fibre is total dietary
// fibre from the same USDA entries; falafel's comes from FNDDS (the SR entry
// has none) and the gym staples use typical label values.

const G: Unit = { label: 'g', ar: 'غرام', grams: 1 };
const ML = (density = 1): Unit => ({ label: 'ml', ar: 'مل', grams: density });
const piece = (grams: number, label = 'piece', ar = 'حبة'): Unit => ({ label, ar, grams });
const scoop = (grams: number): Unit => ({ label: 'scoop', ar: 'سكوب', grams });
const tbsp = (grams: number): Unit => ({ label: 'tbsp', ar: 'ملعقة كبيرة', grams });
const tsp = (grams: number): Unit => ({ label: 'tsp', ar: 'ملعقة صغيرة', grams });
const cup = (grams: number): Unit => ({ label: 'cup', ar: 'كوب', grams });
const slice = (grams: number): Unit => ({ label: 'slice', ar: 'شريحة', grams });

interface Common {
  id: string;
  name: string;
  ar: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Dietary fibre, g per 100 g. 0 for animal products, oils, sugar and plain drinks. */
  fiber: number;
  units: Unit[];
  /** Extra words people search by that aren't in the name. */
  alias?: string;
}

const LIST: Common[] = [
  // ── Eggs & dairy ──────────────────────────────────────────────────────────
  { id: 'egg', name: 'Egg', ar: 'بيض', kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0, alias: 'eggs boiled fried', units: [piece(50, 'medium egg', 'بيضة متوسطة'), piece(58, 'large egg', 'بيضة كبيرة'), piece(43, 'small egg', 'بيضة صغيرة'), G] },
  { id: 'egg_white', name: 'Egg white', ar: 'بياض البيض', kcal: 52, protein: 10.9, carbs: 0.7, fat: 0.2, fiber: 0, units: [piece(33, 'white of 1 egg', 'بياض بيضة'), G] },
  { id: 'milk_whole', name: 'Milk, whole', ar: 'حليب كامل الدسم', kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, units: [ML(1.03), cup(247), G] },
  { id: 'milk_skim', name: 'Milk, skimmed', ar: 'حليب خالي الدسم', kcal: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0, units: [ML(1.03), cup(247), G] },
  { id: 'laban', name: 'Laban / drinking yoghurt', ar: 'لبن', kcal: 40, protein: 3.5, carbs: 4.7, fat: 0.9, fiber: 0, alias: 'ayran buttermilk', units: [ML(1.03), cup(245), G] },
  { id: 'yogurt_plain', name: 'Yoghurt, plain', ar: 'لبن زبادي', kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, units: [cup(245), tbsp(16), G] },
  { id: 'yogurt_greek', name: 'Greek yoghurt, 0%', ar: 'زبادي يوناني', kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, units: [cup(245), tbsp(16), G] },
  { id: 'cheese_white', name: 'White cheese / feta', ar: 'جبن أبيض', kcal: 264, protein: 14.2, carbs: 4.1, fat: 21.3, fiber: 0, units: [slice(28), G] },
  { id: 'cheese_cheddar', name: 'Cheddar cheese', ar: 'جبن شيدر', kcal: 403, protein: 25, carbs: 1.3, fat: 33, fiber: 0, units: [slice(28), G] },
  { id: 'labneh', name: 'Labneh', ar: 'لبنة', kcal: 174, protein: 7.5, carbs: 6, fat: 13, fiber: 0, units: [tbsp(15), G] },

  // ── Meat, fish, poultry (cooked) ──────────────────────────────────────────
  { id: 'chicken_breast', name: 'Chicken breast, cooked', ar: 'صدر دجاج مطبوخ', kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, alias: 'grilled', units: [piece(174, 'breast', 'صدر'), G] },
  { id: 'chicken_thigh', name: 'Chicken thigh, cooked', ar: 'فخذ دجاج', kcal: 209, protein: 26, carbs: 0, fat: 10.9, fiber: 0, units: [piece(52, 'thigh', 'فخذ'), G] },
  { id: 'beef_lean', name: 'Beef mince, lean, cooked', ar: 'لحم بقر مفروم', kcal: 217, protein: 26.1, carbs: 0, fat: 11.9, fiber: 0, units: [G] },
  { id: 'lamb', name: 'Lamb, cooked', ar: 'لحم غنم', kcal: 294, protein: 25, carbs: 0, fat: 20.9, fiber: 0, units: [G] },
  { id: 'fish_white', name: 'White fish, cooked', ar: 'سمك أبيض', kcal: 105, protein: 22.8, carbs: 0, fat: 0.9, fiber: 0, alias: 'cod tilapia hammour', units: [G] },
  { id: 'salmon', name: 'Salmon, cooked', ar: 'سلمون', kcal: 206, protein: 22.1, carbs: 0, fat: 12.4, fiber: 0, units: [piece(170, 'fillet', 'قطعة'), G] },
  { id: 'tuna_can', name: 'Tuna, canned in water', ar: 'تونة معلبة', kcal: 116, protein: 25.5, carbs: 0, fat: 0.8, fiber: 0, units: [piece(142, 'can', 'علبة'), G] },
  { id: 'shrimp', name: 'Shrimp, cooked', ar: 'روبيان', kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, units: [G] },

  // ── Grains & bread ────────────────────────────────────────────────────────
  { id: 'rice_white', name: 'White rice, cooked', ar: 'رز أبيض مطبوخ', kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, units: [cup(158), G] },
  { id: 'rice_brown', name: 'Brown rice, cooked', ar: 'رز بني مطبوخ', kcal: 123, protein: 2.7, carbs: 25.6, fat: 1, fiber: 1.6, units: [cup(195), G] },
  { id: 'bread_white', name: 'White bread', ar: 'خبز أبيض', kcal: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, units: [slice(30), G] },
  { id: 'bread_brown', name: 'Wholemeal bread', ar: 'خبز أسمر', kcal: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 6.8, units: [slice(32), G] },
  { id: 'samoon', name: 'Samoon / pita bread', ar: 'صمون / خبز', kcal: 275, protein: 9.1, carbs: 55.7, fat: 1.2, fiber: 2.2, alias: 'khubz flatbread', units: [piece(85, 'loaf', 'رغيف'), G] },
  { id: 'oats', name: 'Oats, dry', ar: 'شوفان', kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, units: [cup(81), tbsp(10), G] },
  { id: 'pasta', name: 'Pasta, cooked', ar: 'معكرونة مطبوخة', kcal: 131, protein: 5.1, carbs: 24.9, fat: 1.1, fiber: 1.8, units: [cup(140), G] },
  { id: 'bulgur', name: 'Bulgur, cooked', ar: 'برغل', kcal: 83, protein: 3.1, carbs: 18.6, fat: 0.2, fiber: 4.5, units: [cup(182), G] },
  { id: 'potato', name: 'Potato, boiled', ar: 'بطاطا مسلوقة', kcal: 87, protein: 1.9, carbs: 20.1, fat: 0.1, fiber: 1.8, units: [piece(173, 'medium', 'حبة متوسطة'), G] },
  { id: 'sweet_potato', name: 'Sweet potato, baked', ar: 'بطاطا حلوة', kcal: 90, protein: 2, carbs: 20.7, fat: 0.1, fiber: 3.3, units: [piece(151, 'medium', 'حبة متوسطة'), G] },

  // ── Pulses ────────────────────────────────────────────────────────────────
  { id: 'lentils', name: 'Lentils, cooked', ar: 'عدس مطبوخ', kcal: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, units: [cup(198), G] },
  { id: 'chickpeas', name: 'Chickpeas, cooked', ar: 'حمص مسلوق', kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, units: [cup(164), G] },
  { id: 'beans', name: 'Kidney beans, cooked', ar: 'فاصولياء', kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 6.4, units: [cup(177), G] },
  { id: 'hummus', name: 'Hummus', ar: 'حمص بالطحينة', kcal: 166, protein: 7.9, carbs: 14.3, fat: 9.6, fiber: 6, units: [tbsp(15), G] },
  { id: 'falafel', name: 'Falafel', ar: 'فلافل', kcal: 333, protein: 13.3, carbs: 31.8, fat: 17.8, fiber: 4.8, units: [piece(17, 'ball', 'قرص'), G] },

  // ── Fruit & veg ───────────────────────────────────────────────────────────
  { id: 'banana', name: 'Banana', ar: 'موز', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, units: [piece(118, 'medium', 'حبة متوسطة'), G] },
  { id: 'apple', name: 'Apple', ar: 'تفاح', kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, units: [piece(182, 'medium', 'حبة متوسطة'), G] },
  { id: 'orange', name: 'Orange', ar: 'برتقال', kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, units: [piece(131, 'medium', 'حبة متوسطة'), G] },
  // The everyday date (deglet noor-sized, ~8 g): 1 date ≈ 23 kcal. Medjool is a unit, not the default.
  { id: 'dates', name: 'Dates', ar: 'تمر', kcal: 282, protein: 2.5, carbs: 75, fat: 0.4, fiber: 8, alias: 'medjool tamr', units: [piece(8, 'date', 'تمرة'), piece(24, 'medjool date', 'تمرة مجهول'), G] },
  { id: 'grapes', name: 'Grapes', ar: 'عنب', kcal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, units: [cup(151), G] },
  { id: 'watermelon', name: 'Watermelon', ar: 'بطيخ', kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, units: [cup(152), G] },
  { id: 'avocado', name: 'Avocado', ar: 'أفوكادو', kcal: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, units: [piece(150, 'medium', 'حبة متوسطة'), G] },
  { id: 'tomato', name: 'Tomato', ar: 'طماطم', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, units: [piece(123, 'medium', 'حبة متوسطة'), G] },
  { id: 'cucumber', name: 'Cucumber', ar: 'خيار', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, units: [piece(133, 'medium', 'حبة متوسطة'), G] },
  { id: 'onion', name: 'Onion', ar: 'بصل', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, units: [piece(110, 'medium', 'حبة متوسطة'), G] },
  { id: 'salad_green', name: 'Mixed green salad', ar: 'سلطة خضراء', kcal: 17, protein: 1.2, carbs: 3.3, fat: 0.2, fiber: 2.1, units: [cup(36), G] },

  // ── Nuts, fats, extras ────────────────────────────────────────────────────
  { id: 'olive_oil', name: 'Olive oil', ar: 'زيت زيتون', kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, units: [tbsp(13.5), tsp(4.5), ML(0.91), G] },
  { id: 'butter', name: 'Butter', ar: 'زبدة', kcal: 717, protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0, units: [tbsp(14.2), tsp(4.7), G] },
  { id: 'peanut_butter', name: 'Peanut butter', ar: 'زبدة فول سوداني', kcal: 588, protein: 25.1, carbs: 20, fat: 50.4, fiber: 6, units: [tbsp(16), G] },
  { id: 'tahini', name: 'Tahini', ar: 'طحينة', kcal: 595, protein: 17, carbs: 21.2, fat: 53.8, fiber: 9.3, units: [tbsp(15), G] },
  { id: 'almonds', name: 'Almonds', ar: 'لوز', kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, units: [piece(1.2, 'almond', 'حبة'), cup(143), G] },
  { id: 'walnuts', name: 'Walnuts', ar: 'جوز', kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, units: [cup(117), G] },
  { id: 'honey', name: 'Honey', ar: 'عسل', kcal: 304, protein: 0.3, carbs: 82.4, fat: 0, fiber: 0, units: [tbsp(21), tsp(7), G] },
  { id: 'sugar', name: 'Sugar', ar: 'سكر', kcal: 387, protein: 0, carbs: 100, fat: 0, fiber: 0, units: [tsp(4.2), tbsp(12.6), G] },

  // ── Supplements & gym staples ─────────────────────────────────────────────
  { id: 'whey', name: 'Whey protein powder', ar: 'بروتين واي', kcal: 400, protein: 80, carbs: 8, fat: 6, fiber: 1, alias: 'shake supplement', units: [scoop(30), G] },
  { id: 'protein_bar', name: 'Protein bar', ar: 'بروتين بار', kcal: 350, protein: 30, carbs: 38, fat: 9, fiber: 6, units: [piece(60, 'bar', 'قطعة'), G] },
  { id: 'protein_pancake', name: 'Protein pancakes', ar: 'بان كيك بروتين', kcal: 200, protein: 20, carbs: 20, fat: 4, fiber: 2.5, units: [piece(60, 'pancake', 'قطعة'), G] },

  // ── Drinks ────────────────────────────────────────────────────────────────
  { id: 'water', name: 'Water', ar: 'ماء', kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, units: [ML(1), cup(240), G] },
  { id: 'tea_black', name: 'Tea, no sugar', ar: 'شاي بدون سكر', kcal: 1, protein: 0, carbs: 0.3, fat: 0, fiber: 0, units: [cup(240), ML(1)] },
  { id: 'coffee_black', name: 'Coffee, black', ar: 'قهوة سادة', kcal: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, units: [cup(240), ML(1)] },
  { id: 'cola', name: 'Cola', ar: 'كولا', kcal: 42, protein: 0, carbs: 10.6, fat: 0, fiber: 0, units: [ML(1.04), piece(330, 'can', 'علبة'), G] },
  { id: 'orange_juice', name: 'Orange juice', ar: 'عصير برتقال', kcal: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2, units: [ML(1.04), cup(248), G] },
];

const toFood = (c: Common, arLang: boolean): Food => ({
  id: `common:${c.id}`,
  name: arLang ? c.ar : c.name,
  per100: { kcal: c.kcal, protein: c.protein, carbs: c.carbs, fat: c.fat, fiber: c.fiber },
  units: c.units,
  source: 'common',
});

/** Generic whole foods matching the query, best matches first. */
export function searchCommonFoods(query: string, arLang = false): Food[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const scored = LIST.map((c, idx) => {
    const hay = `${c.name} ${c.ar} ${c.alias ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return null;
    // An exact name match must win outright, or searching "egg" leads with
    // "Egg white" — it starts with "egg" too and is a shorter string.
    const name = (arLang ? c.ar : c.name).toLowerCase();
    const score =
      name === q ? 0
      : name.startsWith(q + ' ') || name.startsWith(q + ',') ? 1
      : name.startsWith(q) ? 2
      : name.includes(q) ? 3
      : 4;
    return { c, score, idx };
  }).filter((x): x is { c: Common; score: number; idx: number } => x !== null);
  scored.sort((a, b) => a.score - b.score || a.idx - b.idx);
  return scored.slice(0, 12).map(x => toFood(x.c, arLang));
}

/** The whole list, for the empty-search state. */
export function allCommonFoods(arLang = false): Food[] {
  return LIST.map(c => toFood(c, arLang));
}
