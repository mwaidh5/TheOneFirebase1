
import React from 'react';
import { Link } from 'react-router-dom';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Course } from '../../types';
import { useT } from '../../i18n/I18nContext';

interface AdminCoursesProps {
  courses: Course[];
}

const AdminCourses: React.FC<AdminCoursesProps> = ({ courses }) => {
  const { t } = useT();
  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm(t('admin.courses.confirm_delete'))) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        alert(t('admin.courses.deleted'));
      } catch (error) {
        console.error("Error deleting course: ", error);
        alert(t('admin.courses.delete_failed'));
      }
    }
  };

  return (
    <div className="space-y-12 text-start">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">{t('admin.courses.title')}</h1>
          <p className="text-neutral-400 font-medium">{t('admin.courses.subtitle')}</p>
        </div>
        <Link to="/admin/courses/new" className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          {t('admin.courses.new_course')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-lg flex flex-col group">
            <div className="h-48 relative overflow-hidden">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 end-4 flex gap-2">
                <Link to={`/admin/courses/edit/${course.id}`} aria-label={t('common.edit')} title={t('common.edit')} className="bg-white/90 p-2 rounded-xl text-black hover:bg-white transition shadow-sm">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </Link>
                <button onClick={() => handleDeleteCourse(course.id)} aria-label={t('common.delete')} title={t('common.delete')} className="bg-red-500/90 p-2 rounded-xl text-white hover:bg-red-600 transition shadow-sm">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
              <div className="absolute bottom-4 start-4">
                <span className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{course.category}</span>
              </div>
            </div>
            <div className="p-8 flex flex-col flex-grow gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold font-display uppercase tracking-tight text-black">{course.title}</h3>
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">{t('admin.courses.instructor')} {course.instructor}</p>
                </div>
                <p className="text-2xl font-black text-black font-display" dir="ltr">${course.price}</p>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">{course.description}</p>
              <div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-neutral-50">
                <div className="flex items-center gap-3 text-neutral-400">
                  <span className="material-symbols-outlined text-lg">group</span>
                  <p className="text-xs font-bold uppercase tracking-widest">{t('admin.courses.athletes', { n: course.enrollmentCount })}</p>
                </div>
                <div className="flex items-center gap-3 text-neutral-400">
                  <span className="material-symbols-outlined text-lg">star</span>
                  <p className="text-xs font-bold uppercase tracking-widest">{t('admin.courses.rating', { n: course.rating })}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCourses;
