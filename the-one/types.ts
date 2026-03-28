
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

export type ExerciseFormat = 
  | 'REGULAR' 
  | 'EMOM' 
  | 'SUPER_SET' 
  | 'CIRCUIT' // Alias for Superset mostly, but can be distinct UI
  | 'DROP_SET' 
  | 'AMRAP' 
  | 'FOR_TIME' // For specific tasks like "Run 5k for time"
  | 'HIIT' 
  | 'CARDIO' // Monostructural
  | 'MAX_EFFORT'; // 1RM, 3RM etc.

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar: string;
  memberSince: string;
  level: string;
  enrolledCourseIds?: string[];
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
  
  // Standard / Max Effort
  sets?: number;
  reps?: string;
  rest?: string;
  weight?: string; // For Max Effort goals (e.g. "85% of 1RM")

  // Cardio / Monostructural
  distance?: string; // e.g. "5000m"
  time?: string; // e.g. "20:00"
  speed?: string; // e.g. "Pace: 5:00/km"
  calories?: number;

  // HIIT / EMOM / AMRAP
  workInterval?: string; // "20s"
  restInterval?: string; // "10s"
  durationMinutes?: number; // Total EMOM/AMRAP duration
  rounds?: number; // For Circuits/HIIT

  // Linking for Supersets
  supersetId?: string; // ID to link exercises together
  orderInSuperset?: number;

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

export interface MealOption {
  id: string;
  name: string;
  items: FoodItem[];
}

export interface MealItem {
  id: string;
  name: string;
  options: MealOption[];
}

export interface Meal {
  id: string;
  label: string;
  items: MealItem[];
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
  creatorId?: string; // Added creatorId
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
  storagePath?: string;
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

export interface Notification {
  id: string;
  type: 'COURSE' | 'CUSTOM' | 'ORDER' | 'SYSTEM';
  title: string;
  text: string;
  createdAt: any;
  read: boolean;
  icon?: string;
}
