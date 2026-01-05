
export enum UserRole {
  CLIENT = 'Client',
  COACH = 'Coach',
  ADMIN = 'Admin',
  SUPPORT = 'Support'
}

export enum CourseLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  ELITE = 'Elite'
}

export type ExerciseFormat = 'REGULAR' | 'EMOM' | 'SUPER_SET' | 'DROP_SET' | 'AMRAP' | 'FOR_TIME';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar: string;
  memberSince: string;
  level: string;
}

export interface Coach {
  id: string;
  name: string;
  title: string;
  bio: string;
  experience: string;
  specialization: string;
  avatar: string;
  rating: number;
  reviews: number;
  athletes: string;
  games: string;
  isBespokeAuthorized?: boolean;
}

export interface CustomDiscipline {
  id: string;
  name: string;
  icon: string;
  price: number;
  assignedCoachId: string;
  diagnostics: DiagnosticTest[];
}

export interface DiagnosticTest {
  id: string;
  title: string;
  instruction: string;
  demoVideoUrl?: string;
  inputType: 'VIDEO' | 'IMAGE' | 'TEXT';
  required: boolean;
}

export interface AthleteSubmission {
  testId: string;
  data: string;
  submittedAt: number;
}

export interface Exercise {
  id: string;
  name: string;
  format: ExerciseFormat;
  description?: string;
  sets?: number;
  reps?: string;
  rest?: string;
  durationMinutes?: number;
  dropSteps?: string; 
  videoUrl?: string;
  imageUrl?: string;
  collaboratorId?: string;
}

export interface DayProgram {
  id: string;
  dayNumber: number;
  title: string;
  exercises: Exercise[];
}

export interface WeekProgram {
  id: string;
  weekNumber: number;
  days: DayProgram[];
}

export interface FoodItem {
  id: string;
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  label: string;
  items: FoodItem[];
}

export interface MealPlan {
  id: string;
  name: string;
  description: string;
  meals: Meal[];
  totalCalories: number;
  creatorId?: string;
  creatorName?: string;
  isPublic?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level: CourseLevel;
  duration: string;
  image: string;
  instructor: string;
  category: string;
  enrollmentCount: number;
  rating: number;
  weeks?: WeekProgram[];
  hasMealPlan: boolean;
  mealPlan?: MealPlan;
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  data: string;
  name: string;
  category: 'WORKOUT' | 'GENERAL' | 'PROFILE';
  createdAt: number;
  creatorId?: string;
  creatorName?: string;
  isPublic?: boolean;
}

export interface CustomCourseRequest {
  id: string;
  athleteId: string;
  athleteName: string;
  phone: string;
  sport: string; // References CustomDiscipline.id
  goal: string;
  biometrics: {
    height: string;
    weight: string;
    age: string;
  };
  status: 'PENDING_PAYMENT' | 'DIAGNOSTIC' | 'BUILDING' | 'COMPLETED';
  assignedCoachIds: string[];
  price: number;
  createdAt: string;
  weeks?: WeekProgram[];
  hasMealPlan: boolean;
  mealPlan?: MealPlan;
  durationWeeks: number;
  diagnostics?: DiagnosticTest[];
  submissions?: AthleteSubmission[];
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  defaultFormat: ExerciseFormat;
  description?: string;
  videoUrl?: string;
  imageUrl?: string;
  creatorId?: string;
  creatorName?: string;
  isPublic?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  weeks: WeekProgram[];
  creatorId?: string;
  creatorName?: string;
  isPublic?: boolean;
}

export interface WodTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  category: string;
}
