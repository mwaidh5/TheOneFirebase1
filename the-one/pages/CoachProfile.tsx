
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { COACHES, COURSES } from '../constants';
import { useT } from '../i18n/I18nContext';

const CoachProfile: React.FC = () => {
  const { id } = useParams();
  const { t } = useT();
  const coach = COACHES.find(c => c.id === id) || COACHES[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-12 mb-20">
        <div className="w-full lg:w-5/12">
          <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
            <img src={coach.avatar} alt={coach.name} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="w-full lg:w-7/12 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm">{coach.title}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black uppercase leading-tight font-display">
              {coach.name}
            </h1>
            <p className="text-xl text-gray-600 font-medium leading-relaxed max-w-2xl">
              {t('coach_profile.specializing_in', { spec: coach.specialization })}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-y border-gray-100">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('coach_profile.experience')}</p>
              <p className="text-2xl font-bold text-black">{coach.experience}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('coach_profile.certifications')}</p>
              <p className="text-2xl font-bold text-black">{t('coach_profile.level3')}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('coach_profile.athletes')}</p>
              <p className="text-2xl font-bold text-black">{coach.athletes}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('coach_profile.games')}</p>
              <p className="text-2xl font-bold text-black">{coach.games}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 border-t border-gray-100 pt-16">
        <div className="lg:col-span-7 space-y-12">
          <div>
            <h2 className="text-2xl font-bold font-display uppercase mb-6">{t('coach_profile.biography')}</h2>
            <div className="prose prose-lg text-gray-600 leading-loose max-w-none">
              <p className="mb-6">{coach.bio}</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-display uppercase mb-6">{t('coach_profile.athlete_stories')}</h2>
            <div className="bg-black text-white rounded-3xl p-10 relative overflow-hidden shadow-2xl">
              <span className="material-symbols-outlined text-8xl absolute -top-4 -right-4 text-white/10 select-none rotate-12">format_quote</span>
              <div className="relative z-10 space-y-8">
                <p className="text-xl md:text-2xl font-light italic leading-relaxed">
                  {t('coach_profile.testimonial')}
                </p>
                <div className="flex items-center gap-4 border-t border-white/20 pt-8">
                  <div className="w-12 h-12 rounded-full bg-gray-700 bg-cover bg-center border-2 border-white" style={{backgroundImage: 'url(https://picsum.photos/100/100)'}}></div>
                  <div>
                    <p className="font-bold text-white text-base">{t('coach_profile.testimonial_name')}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{t('coach_profile.member_since')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-neutral-50 rounded-3xl p-8 border border-neutral-100">
            <h3 className="text-xl font-bold font-display uppercase mb-8">{t('coach_profile.courses_by', { name: coach.name.split(' ')[0] })}</h3>
            <div className="space-y-6">
              {COURSES.map(course => (
                <Link key={course.id} to={`/courses/${course.id}`} className="group flex items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm hover:border-black transition-all">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black group-hover:underline">{course.title}</h4>
                    <p className="text-sm text-gray-500">{course.duration}</p>
                    <p className="font-bold text-primary mt-1">${course.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachProfile;
