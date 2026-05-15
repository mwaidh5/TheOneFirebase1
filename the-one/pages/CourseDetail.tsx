
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { COACHES } from '../constants';
import { User, Course } from '../types';
import { useT } from '../i18n/I18nContext';

interface CourseDetailProps {
  currentUser: User | null;
  courses: Course[];
}

const CourseDetail: React.FC<CourseDetailProps> = ({ currentUser, courses }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useT();
  const course = courses.find(c => c.id === id);

  const isOwned = currentUser?.enrolledCourseIds?.includes(course?.id || '') || false;

  const coach = COACHES.find(c => c.name.includes(course?.instructor.split(' ')[0] || ''));

  const handleCurriculumClick = (weekIdx: number) => {
    if (isOwned) {
      navigate(`/workout/${course?.id}?week=${weekIdx + 1}`);
    } else {
      alert(t('course_detail.must_enroll'));
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-neutral-200">search_off</span>
              <h2 className="text-2xl font-black uppercase text-neutral-400">{t('course_detail.not_found')}</h2>
              <Link to="/courses" className="text-xs font-black uppercase underline">{t('course_detail.return_tracks')}</Link>
          </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-7/12 space-y-8">
          <div className="rounded-[3.5rem] overflow-hidden aspect-video shadow-2xl relative group bg-neutral-900 border border-neutral-100">
            {course.videoUrl ? (
                <video
                    src={course.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster={course.image}
                />
            ) : (
                <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="px-5 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">{course.category}</span>
              <span className="px-5 py-2 bg-neutral-100 text-neutral-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                {t('course_detail.n_weeks', { n: course.weeks?.length || 0 })}
              </span>
              <span className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 ${course.hasMealPlan ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}>
                <span className="material-symbols-outlined text-sm">{course.hasMealPlan ? 'restaurant' : 'no_meals'}</span>
                {course.hasMealPlan ? t('course_detail.nutrition_included') : t('course_detail.no_meal_plan')}
              </span>
              {isOwned && (
                <span className="bg-blue-500 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs filled">verified</span> {t('course_detail.enrolled')}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-display uppercase tracking-tight text-black leading-none">{course.title}</h1>
            <p className="text-xl text-neutral-500 leading-relaxed font-medium">{course.description}</p>
          </div>

          <div className="pt-10 space-y-12">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black font-display uppercase tracking-tight">{t('course_detail.curriculum')}</h2>
                <div className="flex items-center gap-4 text-neutral-300">
                   <span className="text-[10px] font-black uppercase tracking-widest">{t('course_detail.n_phases', { n: course.weeks?.length || 0 })}</span>
                </div>
              </div>
              <div className="space-y-4">
                {(course.weeks || []).map((week: any, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCurriculumClick(idx)}
                    className="flex items-center justify-between p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 group cursor-pointer hover:border-black hover:bg-white transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <span className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-sm font-black border border-neutral-100 shadow-sm group-hover:bg-black group-hover:text-white transition-all">{idx + 1}</span>
                      <div className="text-left">
                        <p className="font-black text-black uppercase tracking-tight text-lg">{t('course_detail.phase_n', { n: idx + 1, title: week.days?.[0]?.title || t('course_detail.default_phase_title') })}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                          {t('course_detail.sessions_video', { n: week.days?.length || 0 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isOwned && <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">{t('course_detail.locked')}</span>}
                        <span className="material-symbols-outlined text-neutral-300 group-hover:text-black transition-colors">{isOwned ? 'play_circle' : 'lock'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-5/12">
          <div className="sticky top-28 space-y-6">
            <div className="bg-white rounded-[3.5rem] p-10 border border-neutral-100 shadow-2xl space-y-10">
                <div className="space-y-2 text-left">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">{t('course_detail.investment')}</p>
                    <div className="flex items-baseline gap-3">
                        <span className="text-7xl font-black text-black font-display tracking-tighter">${course.price}</span>
                        <span className="text-sm font-black text-neutral-300 uppercase tracking-widest">USD</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-50 text-left">
                            <p className="text-[8px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-1">{t('course_detail.stimulus')}</p>
                            <p className="text-xs font-black uppercase text-black">{course.category}</p>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-50 text-left">
                            <p className="text-[8px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-1">{t('course_detail.duration')}</p>
                            <p className="text-xs font-black uppercase text-black">{t('course_detail.n_weeks', { n: course.weeks?.length || 0 })}</p>
                        </div>
                    </div>

                    {!isOwned ? (
                        <button
                        onClick={() => navigate(`/checkout?courseId=${course.id}`)}
                        className="block w-full text-center py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 transition-all shadow-2xl hover:-translate-y-1"
                        >
                        {t('course_detail.begin_enrollment')}
                        </button>
                    ) : (
                        <div className="space-y-4 animate-in zoom-in-95 duration-300">
                        <Link to={`/workout/${course.id}`} className="block w-full text-center py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 transition-all shadow-2xl">
                            {t('course_detail.go_to_hub')}
                        </Link>
                        <button
                            onClick={() => coach && navigate(`/profile/messages?coachId=${coach.id}`)}
                            className="block w-full text-center py-6 bg-accent text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined filled text-lg">chat</span>
                            {t('course_detail.message_coach')}
                        </button>
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-neutral-50 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-neutral-100 overflow-hidden shadow-sm shrink-0">
                        <img src={coach?.avatar || 'https://picsum.photos/100'} alt="Coach" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                        <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">{t('course_detail.lead_instructor')}</p>
                        <p className="text-sm font-black text-black uppercase">{course.instructor}</p>
                    </div>
                </div>
            </div>

            <div className="bg-neutral-50 rounded-[2.5rem] p-8 text-left space-y-4 border border-neutral-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">verified</span> {t('course_detail.elite_guarantee')}
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium italic">
                    {t('course_detail.guarantee_text')}
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
