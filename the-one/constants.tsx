
import { CourseLevel, UserRole, Coach, Course, User, WodTemplate, CustomCourseRequest, ExerciseTemplate, WorkoutTemplate, MealPlan, CustomDiscipline } from './types';

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [];

export const MEAL_PLAN_LIBRARY: MealPlan[] = [];

export const MEALS: any[] = [];

export const WORKOUT_LIBRARY: WorkoutTemplate[] = [];

export const MOCK_USER: User = {
  id: 'u1',
  firstName: 'New',
  lastName: 'Athlete',
  email: 'athlete@theone.com',
  role: UserRole.CLIENT,
  avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200',
  memberSince: '2024',
  level: 'Beginner',
};

export const MOCK_ADMIN: User = {
  id: 'admin-1',
  firstName: 'Mahmood',
  lastName: 'Admin',
  email: 'mahmood@theone.com',
  role: UserRole.ADMIN,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200',
  memberSince: '2024',
  level: 'HQ',
};

export const MOCK_COACH_USER: User = {
  id: 'c1',
  firstName: 'Coach',
  lastName: 'User',
  email: 'coach@theone.com',
  role: UserRole.COACH,
  avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=200',
  memberSince: '2024',
  level: 'L1',
};

export const MOCK_SUPPORT_USER: User = {
  id: 's1',
  firstName: 'Support',
  lastName: 'Team',
  email: 'support@theone.com',
  role: UserRole.SUPPORT,
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
  memberSince: '2024',
  level: 'HQ',
};

export const COACHES: Coach[] = [];

export const CUSTOM_DISCIPLINES: CustomDiscipline[] = [];

export const COURSES: Course[] = [];

export const WOD_TEMPLATES: WodTemplate[] = [];

export const MOCK_CUSTOM_REQUESTS: CustomCourseRequest[] = [];
