import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, CustomCourseRequest, User } from '../types';
import LazyImage from '../components/LazyImage';
import { useT } from '../i18n/I18nContext';
import { readActiveSession, ActiveSession } from '../hooks/activeSession';
import ResultsShowcase from '../components/ResultsShowcase';

interface HomepageProps {
  currentUser?: User | null;
  settings: {
    heroImage: string;
    missionImage: string;
    heroHeadline: string;
    heroSubline: string;
  };
}

// Day-aware content, Sunday(0) → Saturday(6). The Iraqi work week runs
// Sun–Thu; Friday & Saturday are the weekend, so their tips lean into
// rest, family, and recovery instead of grinding.
const DAILY_TIPS: { icon: string; tone: 'work' | 'weekend'; title: { en: string; ar: string }; body: { en: string; ar: string } }[] = [
  { icon: 'flag', tone: 'work', title: { en: 'New week, new standard', ar: 'أسبوع جديد، مستوى جديد' }, body: { en: "It's Sunday — the week starts here. Pick your training days now and treat them like appointments you can't miss.", ar: 'اليوم الأحد — بداية الأسبوع. حدّد أيام تمرينك الآن وتعامل معها كمواعيد لا تُفوَّت.' } },
  { icon: 'fitness_center', tone: 'work', title: { en: 'Form before load', ar: 'الأداء قبل الوزن' }, body: { en: 'Monday check: slow your reps down today. Perfect form at a lighter weight beats ugly reps at a heavy one.', ar: 'فحص الاثنين: بطّئ تكراراتك اليوم. الأداء الصحيح بوزن أخف أفضل من تكرارات سيئة بوزن ثقيل.' } },
  { icon: 'water_drop', tone: 'work', title: { en: 'Fuel the engine', ar: 'زوّد المحرك' }, body: { en: 'Tuesday tip: protein with every meal and 2–3L of water. Your performance tomorrow is built in the kitchen today.', ar: 'نصيحة الثلاثاء: بروتين مع كل وجبة و٢-٣ لتر ماء. أداؤك غداً يُبنى في المطبخ اليوم.' } },
  { icon: 'bolt', tone: 'work', title: { en: 'Mid-week wall? Push through', ar: 'جدار منتصف الأسبوع؟ اخترقه' }, body: { en: "Wednesday is where most people quit. You're not most people — show up even if it's only 70% effort.", ar: 'الأربعاء هو اليوم الذي يستسلم فيه الأغلبية. أنت لست منهم — احضر حتى لو كان جهدك ٧٠٪ فقط.' } },
  { icon: 'sports_score', tone: 'work', title: { en: 'Finish the week strong', ar: 'اختم الأسبوع بقوة' }, body: { en: 'Thursday — last working day. Empty the tank in today\'s session; the weekend is for recovering, not regretting.', ar: 'الخميس — آخر يوم دوام. أفرغ طاقتك في تمرين اليوم؛ العطلة للاستشفاء لا للندم.' } },
  { icon: 'self_improvement', tone: 'weekend', title: { en: 'Jumu\'a mode: recover', ar: 'وضع الجمعة: استشفاء' }, body: { en: "It's Friday — family lunch, rest, and prayers. Recovery IS training: stretch 10 minutes and sleep well tonight.", ar: 'اليوم الجمعة — غداء العائلة وراحة وصلاة. الاستشفاء تمرينٌ أيضاً: تمدد ١٠ دقائق ونَم جيداً الليلة.' } },
  { icon: 'directions_walk', tone: 'weekend', title: { en: 'Saturday: move easy', ar: 'السبت: حركة خفيفة' }, body: { en: 'Weekend day two — go for a light walk, do some mobility, and prep your meals. Tomorrow the week begins again.', ar: 'ثاني أيام العطلة — امشِ مشياً خفيفاً، تمارين مرونة، وجهّز وجباتك. غداً يبدأ الأسبوع من جديد.' } },
];

const DAILY_QUOTES: { en: string; ar: string }[] = [
  { en: 'Discipline is choosing what you want most over what you want now.', ar: 'الانضباط هو اختيار ما تريده أكثر على ما تريده الآن.' },
  { en: 'You don\'t have to be extreme, just consistent.', ar: 'لا تحتاج أن تكون متطرفاً، فقط مستمراً.' },
  { en: 'The body achieves what the mind believes.', ar: 'الجسد يحقق ما يؤمن به العقل.' },
  { en: 'Sweat today, shine tomorrow.', ar: 'اتعب اليوم، تألق غداً.' },
  { en: 'Strong people are harder to kill and more useful in general.', ar: 'الأقوياء أصعب كسراً وأكثر نفعاً.' },
  { en: 'Rest is part of the program, not a break from it.', ar: 'الراحة جزء من البرنامج، وليست انقطاعاً عنه.' },
  { en: 'Prepare today so next week has no excuses.', ar: 'استعد اليوم حتى لا يجد الأسبوع القادم عذراً.' },
];

const AppHome: React.FC<HomepageProps> = ({ currentUser, settings }) => {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [pendingDiagnostic, setPendingDiagnostic] = useState<CustomCourseRequest | null>(null);
  const [active, setActive] = useState<ActiveSession | null>(() => readActiveSession());

  useEffect(() => {
    const update = () => setActive(readActiveSession());
    window.addEventListener('theone-session-change', update as EventListener);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('theone-session-change', update as EventListener);
      window.removeEventListener('storage', update);
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'courses'), limit(6));
    const unsub = onSnapshot(q, (snapshot) => {
      setFeaturedCourses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Course)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) { setPendingDiagnostic(null); return; }
    const q = query(
      collection(db, 'custom_requests'),
      where('athleteId', '==', currentUser.id),
      where('status', '==', 'DIAGNOSTIC')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingDiagnostic(snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CustomCourseRequest));
    });
    return () => unsub();
  }, [currentUser]);

  const workouts = (currentUser as any)?.workoutsCompleted ?? 0;
  const minutes = (currentUser as any)?.minutesLogged ?? 0;
  const heroImg = settings.heroImage || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1400';

  const day = new Date().getDay();
  const tip = DAILY_TIPS[day];
  const quote = DAILY_QUOTES[day];
  const isWeekend = tip.tone === 'weekend'; // Friday & Saturday in Iraq
  const dayName = new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', { weekday: 'long' });

  const quickActions = [
    { to: '/courses', icon: 'fitness_center', label: t('nav.courses'), bg: 'bg-blue-50', color: 'text-accent' },
    { to: '/profile/courses', icon: 'school', label: t('nav.my_courses'), bg: 'bg-purple-50', color: 'text-purple-600' },
    { to: '/profile/nutrition', icon: 'restaurant', label: t('nav.nutrition'), bg: 'bg-green-50', color: 'text-green-600' },
    { to: '/profile/messages', icon: 'chat_bubble', label: t('nav.messages'), bg: 'bg-orange-50', color: 'text-orange-600' },
  ];

  return (
    <div className="w-full bg-neutral-50 min-h-screen pb-6">
      <div className="max-w-xl mx-auto px-5 pt-5 space-y-6">

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-[2rem] shadow-xl bg-black" style={{ minHeight: 200 }}>
          <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
          <div className="relative z-10 p-6 flex flex-col justify-between" style={{ minHeight: 200 }}>
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[9px] font-black uppercase tracking-[0.2em] text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> The One Training
              </span>
              {currentUser ? (
                <Link to="/menu"><img src={currentUser.avatar} alt="" className="w-11 h-11 rounded-2xl object-cover border-2 border-white/30" /></Link>
              ) : (
                <Link to="/login" className="px-4 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest">{t('nav.login')}</Link>
              )}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/60">{t('home.app_welcome')}</p>
              <h1 className="text-3xl font-black font-display uppercase tracking-tight text-white leading-none mt-1">
                {currentUser ? currentUser.firstName : t('home.app_explore')}
              </h1>
              {!currentUser && (
                <p className="text-sm font-medium text-white/70 mt-2 max-w-xs">{t('home.app_welcome_sub')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic banner */}
        {pendingDiagnostic && (
          <Link to={`/athlete/diagnostic/${pendingDiagnostic.id}`} className="flex items-center gap-3 p-4 bg-accent text-white rounded-2xl shadow-lg">
            <span className="material-symbols-outlined animate-pulse">priority_high</span>
            <span className="flex-1 text-[11px] font-black uppercase tracking-widest">{t('home.diagnostic_banner', { sport: pendingDiagnostic.sport })}</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        )}

        {/* Resume training card */}
        {active && (
          <button
            onClick={() => navigate(`/workout/${active.courseId}?week=${active.weekNumber}`)}
            className="w-full text-left relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent to-blue-600 text-white p-5 shadow-xl shadow-accent/20"
          >
            <div className="relative z-10 flex items-center gap-4">
              <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur shrink-0 animate-pulse">
                <span className="material-symbols-outlined text-3xl filled">play_arrow</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{t('home.app_resume_title')}</p>
                <p className="text-lg font-black uppercase truncate">{active.dayTitle || active.courseTitle}</p>
              </div>
              <span className="px-3 py-2 rounded-xl bg-white text-accent text-[10px] font-black uppercase tracking-widest">{t('nav.resume')}</span>
            </div>
          </button>
        )}

        {/* Stats (logged in) */}
        {currentUser && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><span className="material-symbols-outlined filled">exercise</span></span>
              <div>
                <p className="text-2xl font-black font-display text-black leading-none">{workouts}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-1">{t('home.app_workouts')}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><span className="material-symbols-outlined filled">timer</span></span>
              <div>
                <p className="text-2xl font-black font-display text-black leading-none">{minutes}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-1">{t('home.app_minutes')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tip of the day — weekday-aware (Fri & Sat = Iraqi weekend) */}
        <div className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm ${isWeekend ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex items-start gap-4">
            <span className={`flex items-center justify-center w-12 h-12 rounded-2xl text-white shrink-0 ${isWeekend ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              <span className="material-symbols-outlined text-[26px] filled">{tip.icon}</span>
            </span>
            <div className="min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isWeekend ? 'text-emerald-600' : 'text-amber-600'}`}>
                {lang === 'ar' ? 'نصيحة اليوم' : 'Tip of the day'} · {dayName}
              </p>
              <p className="text-base font-black uppercase tracking-tight text-black mt-0.5">{tip.title[lang]}</p>
              <p className="text-sm font-medium text-neutral-600 leading-relaxed mt-1">{tip.body[lang]}</p>
            </div>
          </div>
          <span className={`material-symbols-outlined absolute -bottom-4 -right-3 text-[90px] select-none ${isWeekend ? 'text-emerald-500/10' : 'text-amber-500/10'}`}>{tip.icon}</span>
        </div>

        {/* Daily motivation banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 to-black text-white p-5 shadow-xl">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <span className="material-symbols-outlined text-accent text-[28px] filled">format_quote</span>
            <p className="text-sm font-bold leading-snug">{quote[lang]}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">{t('home.app_quick')}</p>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-neutral-100 py-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
                <span className={`w-11 h-11 rounded-xl ${a.bg} ${a.color} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[22px]">{a.icon}</span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500 text-center px-1 leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured tracks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">{t('home.app_featured')}</p>
            <Link to="/courses" className="text-[10px] font-black uppercase tracking-widest text-accent">{t('home.browse_all')}</Link>
          </div>

          {featuredCourses.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory theone-hide-scrollbar">
              {featuredCourses.map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`} className="snap-start shrink-0 w-64 bg-white rounded-3xl border border-neutral-100 overflow-hidden hover:shadow-xl transition-all">
                  <div className="h-40 relative">
                    <LazyImage src={course.image} alt={course.title} className="w-full h-full object-cover" displayWidth={500} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{course.category}</span>
                    <span className="absolute bottom-3 right-3 text-white text-lg font-black font-display drop-shadow">${course.price}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-black font-display uppercase tracking-tight text-black leading-tight line-clamp-2">{course.title}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>{course.duration}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-3xl border border-neutral-100">
              <p className="text-neutral-300 font-black uppercase tracking-[0.2em] text-xs">{t('home.no_featured')}</p>
            </div>
          )}
        </div>

        {/* Athlete results — before/after + customer feedback (mockup data) */}
        <ResultsShowcase />

        {/* Explore CTA for logged-out */}
        {!currentUser && (
          <Link to="/courses" className="flex items-center justify-center gap-2 w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
            {t('home.app_explore')}
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        )}
      </div>

      <style>{`
        .theone-hide-scrollbar::-webkit-scrollbar { display: none; }
        .theone-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AppHome;
