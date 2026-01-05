
import React from 'react';
import { MEALS } from '../constants';

const MealPlan: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium mb-1">
            <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
            <span>Meal Plan</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-black uppercase">My Nutrition</h1>
          <p className="text-neutral-500 text-lg max-w-xl">Your daily macro goals and meal plan tailored to your performance.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-full bg-white text-sm font-bold hover:bg-neutral-50 shadow-sm transition-all">
            <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
            Grocery List
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-neutral-800 shadow-xl transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download PDF
          </button>
        </div>
      </div>

      {/* Week Selector */}
      <div className="mb-12 overflow-x-auto no-scrollbar border-b border-neutral-100">
        <div className="flex min-w-max">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
            <button key={day} className={`flex flex-col items-center px-10 py-4 transition-all border-b-[3px] ${i === 0 ? 'border-black' : 'border-transparent text-gray-400 hover:text-black'}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1">{day}</span>
              <span className={`text-xl font-black ${i === 0 ? 'text-black' : ''}`}>{12 + i}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Targets Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-neutral-50 rounded-3xl p-8 border border-neutral-100">
            <h3 className="text-xl font-bold font-display uppercase mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined">monitoring</span>
              Daily Targets
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Calories', val: '2,800', sub: 'kcal' },
                { label: 'Protein', val: '220', sub: 'grams' },
                { label: 'Carbs', val: '300', sub: 'grams' },
                { label: 'Fat', val: '85', sub: 'grams' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                  <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-black">{stat.val}</p>
                  <p className="text-[10px] text-neutral-300 font-bold uppercase mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold font-display uppercase mb-8">Today's Consumption</h3>
            <div className="space-y-8">
              {[
                { label: 'Protein', val: '176g / 220g', pct: 80, color: 'bg-black' },
                { label: 'Carbohydrates', val: '150g / 300g', pct: 50, color: 'bg-black/60' },
                { label: 'Fat', val: '45g / 85g', pct: 53, color: 'bg-black/30' },
              ].map((macro) => (
                <div key={macro.label} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-black uppercase tracking-wider">{macro.label}</span>
                    <span className="text-xs font-medium text-neutral-400">{macro.val}</span>
                  </div>
                  <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${macro.pct}%`, backgroundColor: macro.pct === 80 ? '#137fec' : '#000' }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-5 bg-green-50 rounded-2xl border border-green-100 flex gap-4 items-start">
              <span className="material-symbols-outlined text-green-700">check_circle</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-green-800">On Track</p>
                <p className="text-xs text-green-700 leading-relaxed">You're hitting your protein goals perfectly. Keep it up!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Meals Column */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display uppercase">Scheduled Meals</h2>
            <span className="text-sm text-neutral-400 font-bold uppercase tracking-widest">4 meals • 2,750 kcal</span>
          </div>

          <div className="grid gap-6">
            {MEALS.map(meal => (
              <div key={meal.id} className="group relative flex flex-col sm:flex-row gap-6 p-5 rounded-3xl border border-neutral-100 bg-white hover:border-black hover:shadow-xl transition-all cursor-pointer">
                <div className="h-40 sm:h-32 w-full sm:w-32 rounded-2xl overflow-hidden shrink-0">
                  <img src={meal.image} alt={meal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="flex flex-col flex-1 justify-center gap-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">{meal.type}</span>
                    <span className="text-xs text-neutral-400 font-bold flex items-center gap-1 uppercase">
                      <span className="material-symbols-outlined text-[16px]">schedule</span> {meal.time}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-black font-display">{meal.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400 font-medium uppercase tracking-wider">
                    <span className="text-black font-bold">{meal.calories} kcal</span>
                    <span>{meal.protein}g Protein</span>
                    <span>{meal.carbs}g Carbs</span>
                    <span>{meal.fat}g Fat</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center pr-2">
                  <div className="bg-neutral-50 group-hover:bg-black group-hover:text-white p-2 rounded-full transition-all">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl bg-black text-white p-10 overflow-hidden relative shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="max-w-md space-y-3">
                <h4 className="text-2xl font-bold font-display uppercase tracking-tight">Need a custom plan?</h4>
                <p className="text-neutral-400 text-base leading-relaxed">Upgrade your course to get 1-on-1 nutritional coaching and fully personalized macro adjustments based on your weekly progress.</p>
              </div>
              <button className="shrink-0 bg-white text-black px-8 py-4 rounded-full font-bold text-base hover:bg-neutral-100 transition-all shadow-xl">
                Explore Coaching
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-[80px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlan;
