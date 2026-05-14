
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, CustomCourseRequest, User } from '../types';
import LazyImage from '../components/LazyImage';

interface HomepageProps {
  currentUser?: User | null;
  settings: {
    heroImage: string;
    missionImage: string;
    heroHeadline: string;
    heroSubline: string;
  };
}

const useScrollY = (): number => {
  const [y, setY] = useState<number>(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return y;
};

const useScrollProgress = (): number => {
  const [progress, setProgress] = useState<number>(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? (scrolled / max) * 100 : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return progress;
};

function useReveal<T extends HTMLElement>(threshold: number = 0.15) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState<boolean>(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, shown };
}

interface CounterProps {
  to: number;
  suffix?: string;
  duration?: number;
}

const Counter: React.FC<CounterProps> = ({ to, suffix = '', duration = 1600 }) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState<number>(0);
  const started = useRef<boolean>(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setVal(Math.floor(eased * to));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

interface Chapter {
  title: string;
  text: string;
}

const Homepage: React.FC<HomepageProps> = ({ currentUser, settings }) => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [pendingDiagnostic, setPendingDiagnostic] = useState<CustomCourseRequest | null>(null);

  const scrollY = useScrollY();
  const progress = useScrollProgress();

  const stickyRef = useRef<HTMLDivElement | null>(null);
  const [stickyProgress, setStickyProgress] = useState<number>(0);

  const missionReveal = useReveal<HTMLDivElement>();
  const statsReveal = useReveal<HTMLDivElement>();
  const featuresReveal = useReveal<HTMLDivElement>();
  const coursesReveal = useReveal<HTMLDivElement>();
  const ctaReveal = useReveal<HTMLDivElement>();

  useEffect(() => {
    const q = query(collection(db, 'courses'), limit(3));
    const unsub = onSnapshot(q, (snapshot) => {
      setFeaturedCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setPendingDiagnostic(null);
      return;
    }
    const q = query(
      collection(db, 'custom_requests'),
      where('athleteId', '==', currentUser.id),
      where('status', '==', 'DIAGNOSTIC')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setPendingDiagnostic({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CustomCourseRequest);
      } else {
        setPendingDiagnostic(null);
      }
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const height = el.offsetHeight - window.innerHeight;
    if (height <= 0) return;
    const local = window.scrollY - top;
    const p = Math.max(0, Math.min(1, local / height));
    setStickyProgress(p);
  }, [scrollY]);

  const headlineParts = settings.heroHeadline.split(' ');
  const lastWord = headlineParts.length > 1 ? headlineParts.pop()! : settings.heroHeadline;
  const mainHeadline = headlineParts.join(' ');

  const heroBgOffset = scrollY * 0.4;
  const heroFgOffset = scrollY * 0.15;
  const heroOpacity = Math.max(0, 1 - scrollY / 700);

  const marqueeItems: string[] = ['Strength', 'Resilience', 'Performance', 'Discipline', 'Community', 'Elite', 'Forge Your Path'];

  const chapters: (Chapter & { stat: string; statLabel: string; points: string[] })[] = [
    {
      title: 'Train',
      text: "Discipline isn't a feeling. It's a contract you sign with yourself before the world wakes up.",
      stat: '5AM',
      statLabel: 'Daily Reset',
      points: ['Periodized blocks built by elite coaches', 'Adaptive load based on output & recovery', 'Form video review every cycle'],
    },
    {
      title: 'Endure',
      text: 'Real progress lives on the other side of the wall everyone else turns back from. We meet you there.',
      stat: '12wk',
      statLabel: 'Per Cycle',
      points: ['Threshold work in measured doses', 'Recovery dialed by HRV & sleep data', 'Setbacks tracked, not hidden'],
    },
    {
      title: 'Become',
      text: "Strength is the byproduct. Identity is the prize. You don't leave the same person you walked in.",
      stat: '∞',
      statLabel: 'Compound',
      points: ['Body composition tracked monthly', 'PR ledger you can show your kids', 'A standard you carry into every room'],
    },
  ];

  const stats: { value: number; suffix: string; label: string }[] = [
    { value: 2400, suffix: '+', label: 'Active Athletes' },
    { value: 180, suffix: '', label: 'Elite Coaches' },
    { value: 95, suffix: '%', label: 'Goal Hit Rate' },
    { value: 12, suffix: 'M', label: 'PRs Logged' },
  ];

  const ecosystemCards: { icon: string; bg: string; color: string; title: string; desc: string; num: string }[] = [
    { icon: 'monitoring', bg: 'bg-blue-50', color: 'text-accent', title: 'Vitals Tracking', desc: 'Log your PRs, track body composition, and monitor recovery metrics in one unified dashboard.', num: '01' },
    { icon: 'restaurant_menu', bg: 'bg-green-50', color: 'text-green-600', title: 'Precision Fueling', desc: 'Meal plans tailored to your training volume and caloric needs for optimal performance.', num: '02' },
    { icon: 'groups', bg: 'bg-purple-50', color: 'text-purple-600', title: 'Community Feed', desc: 'Share wins, ask coaches, and connect with athletes from around the world.', num: '03' },
    { icon: 'fitness_center', bg: 'bg-neutral-100', color: 'text-black', title: 'Programming', desc: 'Periodized blocks built by elite coaches, adaptable to your output and recovery.', num: '04' },
  ];

  return (
    <div className="w-full bg-white overflow-x-clip">
      <div
        className="fixed top-0 left-0 h-1 bg-accent z-50"
        style={{ width: `${progress}%` }}
      />

      {pendingDiagnostic && (
        <div className="bg-accent py-4 px-6 flex flex-col md:flex-row items-center justify-center gap-4 text-white animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl animate-pulse">priority_high</span>
            <p className="font-black uppercase tracking-widest text-[10px] md:text-xs">Action Required: Complete your {pendingDiagnostic.sport} diagnostic intake</p>
          </div>
          <Link
            to={`/athlete/diagnostic/${pendingDiagnostic.id}`}
            className="px-6 py-2 bg-white text-accent rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-neutral-100 transition-all shadow-lg"
          >
            Start Now
          </Link>
        </div>
      )}

      {/* HERO — full-bleed parallax */}
      <section className="relative h-screen w-full overflow-hidden bg-black">
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translate3d(0, ${heroBgOffset}px, 0) scale(1.15)` }}
        >
          <img
            src={settings.heroImage}
            alt="Athlete"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/20" />
        </div>

        <div
          className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-24 md:pb-32 will-change-transform"
          style={{ transform: `translate3d(0, ${-heroFgOffset}px, 0)`, opacity: heroOpacity }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-[10px] font-black tracking-[0.3em] uppercase text-white w-fit mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            Elite Performance Hub
          </span>
          <h1 className="text-[14vw] md:text-[11vw] lg:text-[9vw] font-black leading-[0.85] tracking-tighter text-white font-display uppercase">
            <span className="block animate-in fade-in slide-in-from-bottom-12 duration-1000">{mainHeadline}</span>
            <span className="block text-accent animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">{lastWord}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-[520px] leading-relaxed font-medium mt-8 animate-in fade-in duration-1000 delay-500">
            {settings.heroSubline}
          </p>
          <div className="flex flex-wrap gap-4 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
            <Link to="/courses" className="flex items-center justify-center rounded-2xl h-16 px-10 bg-white text-black hover:bg-accent hover:text-white transition-all text-sm font-black uppercase tracking-widest shadow-2xl hover:-translate-y-1 group">
              View Courses
              <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <Link to="/coaches" className="flex items-center justify-center rounded-2xl h-16 px-10 border border-white/30 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-all text-sm font-black uppercase tracking-widest">
              Meet the Team
            </Link>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce"
          style={{ opacity: heroOpacity }}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </section>

      {/* Marquee strip */}
      <section className="relative bg-black border-y border-white/5 overflow-hidden py-8">
        <div className="flex gap-12 whitespace-nowrap" style={{ animation: 'theone-marquee 30s linear infinite', width: 'max-content' }}>
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} className="flex items-center gap-12 flex-shrink-0">
              <span className="text-5xl md:text-7xl font-black font-display uppercase tracking-tight text-white/10">{item}</span>
              <span className="w-3 h-3 rounded-full bg-accent flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Sticky narrative — pinned image, text scrolls through */}
      <section ref={stickyRef} className="relative bg-neutral-50">
        <div className="relative" style={{ height: `${chapters.length * 80}vh` }}>
          <div className="sticky top-0 h-screen flex items-center overflow-hidden py-12">
            <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-stretch">
              {/* LEFT — pinned image with overlay */}
              <div className="relative h-[50vh] lg:h-[78vh] rounded-[3rem] overflow-hidden shadow-2xl">
                <LazyImage src={settings.missionImage} alt="Mission" className="w-full h-full object-cover scale-105" displayWidth={900} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-purple-500/10 mix-blend-overlay" />

                {/* Top — chapter pill + counter */}
                <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-[0.3em] text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Our Core Mission
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                    Ch · {String(Math.min(chapters.length, Math.floor(stickyProgress * chapters.length) + 1)).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
                  </span>
                </div>

                {/* Bottom — rotating chapter title + big stat */}
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10">
                  <div className="relative h-32 lg:h-40">
                    {chapters.map((chapter, i) => {
                      const chapterStart = i / chapters.length;
                      const chapterEnd = (i + 1) / chapters.length;
                      const inRange = stickyProgress >= chapterStart && stickyProgress < chapterEnd;
                      const ty = inRange ? 0 : (stickyProgress < chapterStart ? 30 : -30);
                      return (
                        <div
                          key={i}
                          className="absolute inset-0 flex items-end justify-between gap-6 transition-all duration-500"
                          style={{ opacity: inRange ? 1 : 0, transform: `translateY(${ty}px)`, pointerEvents: inRange ? 'auto' : 'none' }}
                        >
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 block mb-2">{String(i + 1).padStart(2, '0')} — Chapter</span>
                            <h3 className="text-5xl lg:text-7xl font-black font-display uppercase tracking-tighter text-white leading-none">{chapter.title}</h3>
                          </div>
                          <div className="text-right pb-2">
                            <span className="text-5xl lg:text-6xl font-black font-display text-accent leading-none">{chapter.stat}</span>
                            <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mt-2">{chapter.statLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT — rotating chapter content */}
              <div className="relative h-[50vh] lg:h-[78vh] flex flex-col justify-between py-2">
                {/* Top — section header */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">The Standard</span>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
                    <span className="h-px flex-grow bg-neutral-200" />
                    <span>Scroll to read</span>
                    <span className="material-symbols-outlined text-base">south</span>
                  </div>
                </div>

                {/* Middle — chapter content (stacked, fade between) */}
                <div className="relative flex-1 my-8">
                  {chapters.map((chapter, i) => {
                    const chapterStart = i / chapters.length;
                    const chapterEnd = (i + 1) / chapters.length;
                    const inRange = stickyProgress >= chapterStart && stickyProgress < chapterEnd;
                    const localProgress = Math.max(0, Math.min(1, (stickyProgress - chapterStart) / (chapterEnd - chapterStart)));
                    const opacity = inRange ? 1 : 0;
                    const ty = inRange ? 0 : (stickyProgress < chapterStart ? 30 : -30);
                    return (
                      <div
                        key={i}
                        className="absolute inset-0 flex flex-col justify-center gap-7 transition-all duration-500"
                        style={{ opacity, transform: `translateY(${ty}px)`, pointerEvents: inRange ? 'auto' : 'none' }}
                      >
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-[1.05] text-black font-display tracking-tight">
                          "{chapter.text}"
                        </h2>
                        <ul className="space-y-3 pt-2">
                          {chapter.points.map((pt, j) => (
                            <li key={j} className="flex items-start gap-3 text-neutral-600 text-base leading-snug font-medium">
                              <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-[14px] filled">check</span>
                              </span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="h-1 bg-neutral-200 rounded-full overflow-hidden max-w-sm">
                          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${localProgress * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom — chapter index dots */}
                <div className="flex items-center gap-3">
                  {chapters.map((_, i) => {
                    const chapterStart = i / chapters.length;
                    const chapterEnd = (i + 1) / chapters.length;
                    const isActive = stickyProgress >= chapterStart && stickyProgress < chapterEnd;
                    return (
                      <div key={i} className="flex items-center gap-3 flex-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isActive ? 'text-black' : 'text-neutral-300'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="h-px flex-grow bg-neutral-200 relative overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-accent transition-all duration-300"
                            style={{ width: isActive ? '100%' : stickyProgress >= chapterEnd ? '100%' : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated stats */}
      <section ref={statsReveal.ref} className="bg-black py-24 md:py-32 border-y border-white/5 relative overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`text-left transition-all duration-700 ${statsReveal.shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-6xl md:text-8xl font-black font-display text-white tracking-tighter leading-none">
                <Counter to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem — horizontal snap scroll */}
      <section ref={featuresReveal.ref} className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent block mb-3">The Ecosystem</span>
            <h2 className="text-5xl md:text-7xl font-black font-display uppercase tracking-tight text-black leading-none">Built for the<br />long haul.</h2>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
            <span className="material-symbols-outlined text-base">swipe</span>
            Scroll to explore
          </div>
        </div>
        <div className="overflow-x-auto snap-x snap-mandatory pb-8 theone-hide-scrollbar">
          <div
            className="flex gap-6"
            style={{
              width: 'max-content',
              paddingLeft: 'max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))',
              paddingRight: 'max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))',
            }}
          >
            {ecosystemCards.map((card, i) => (
              <div
                key={i}
                className={`snap-center w-[80vw] md:w-[460px] flex-shrink-0 bg-neutral-50 p-10 md:p-12 rounded-[2.5rem] border border-neutral-100 hover:border-accent/30 hover:shadow-2xl transition-all duration-700 group ${featuresReveal.shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="flex items-start justify-between mb-10">
                  <div className={`w-16 h-16 ${card.bg} rounded-2xl flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform duration-500`}>
                    <span className="material-symbols-outlined text-3xl filled">{card.icon}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">{card.num}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tight mb-6">{card.title}</h3>
                <p className="text-neutral-500 leading-relaxed font-medium text-base">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section ref={coursesReveal.ref} className="py-24 md:py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="text-left">
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-3 block">Training Tracks</span>
              <h2 className="text-black text-5xl md:text-7xl font-black font-display uppercase tracking-tight leading-none">Elite<br />Programming</h2>
            </div>
            <Link to="/courses" className="text-sm font-black uppercase tracking-widest text-black hover:text-accent transition-colors flex items-center gap-2 group">
              Browse All <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </Link>
          </div>

          {featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course, i) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className={`group flex flex-col rounded-[2.5rem] border border-neutral-100 bg-white overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 ${coursesReveal.shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <div className="h-80 overflow-hidden relative">
                    <LazyImage src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" displayWidth={600} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-6 left-6">
                      <span className="bg-white/90 backdrop-blur-md text-black text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">{course.category}</span>
                    </div>
                    <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <span className="material-symbols-outlined text-black">arrow_forward</span>
                    </div>
                  </div>
                  <div className="p-10 flex flex-col gap-6 flex-grow text-left">
                    <h3 className="text-black text-2xl font-bold leading-[1.1] font-display uppercase tracking-tight">{course.title}</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 font-medium">{course.description}</p>
                    <div className="mt-auto pt-8 flex items-center justify-between border-t border-neutral-50">
                      <span className="text-neutral-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">schedule</span> {course.duration}
                      </span>
                      <span className="font-black text-2xl text-black font-display">${course.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-neutral-100">
              <p className="text-neutral-300 font-black uppercase tracking-[0.3em]">No featured courses published yet</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA with drifting orbs */}
      <section ref={ctaReveal.ref} className="py-24 md:py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto rounded-[4rem] bg-black p-12 md:p-24 relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
          <div
            className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] will-change-transform"
            style={{ transform: `translate3d(${scrollY * 0.04}px, ${scrollY * 0.02}px, 0)` }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] will-change-transform"
            style={{ transform: `translate3d(${-scrollY * 0.03}px, ${-scrollY * 0.02}px, 0)` }}
          />
          <div className={`relative z-10 space-y-10 max-w-3xl transition-all duration-1000 ${ctaReveal.shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <span className="inline-block px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-[10px] font-black tracking-[0.3em] uppercase text-white">Join the Movement</span>
            <h2 className="text-5xl md:text-8xl font-black tracking-tight font-display uppercase leading-[0.9] text-white">
              Ready to start <br /><span className="text-accent">your journey?</span>
            </h2>
            <p className="text-xl text-neutral-400 font-medium">Join the next fundamentals intake and write your own story of resilience and performance.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Link to="/courses" className="flex items-center justify-center rounded-2xl h-16 px-12 bg-white text-black hover:bg-accent hover:text-white text-sm font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 group">
                Start Training Today
                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes theone-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
        .theone-hide-scrollbar::-webkit-scrollbar { display: none; }
        .theone-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Homepage;
