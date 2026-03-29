
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { collection, onSnapshot, setDoc, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from './firebase';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Homepage from './pages/Homepage';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Coaches from './pages/Coaches';
import CoachProfile from './pages/CoachProfile';
import Profile from './pages/Profile';
import MyCourses from './pages/MyCourses';
import MealPlan from './pages/MealPlan';
import UserDetails from './pages/UserDetails';
import Checkout from './pages/Checkout';
import CustomCourse from './pages/CustomCourse';
import AthleteDiagnostics from './pages/AthleteDiagnostics';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ProfileSettings from './pages/ProfileSettings';
import NotificationsSettings from './pages/NotificationsSettings';
import BillingHistory from './pages/BillingHistory';
import WorkoutSession from './pages/WorkoutSession';
import Chat from './pages/Chat';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/UserManagement';
import AdminOrders from './pages/admin/Orders';
import AdminCustomRequests from './pages/admin/CustomRequests';
import AdminCustomWorkoutViewer from './pages/admin/CustomWorkoutViewer';
import AdminCourses from './pages/admin/CoursesManagement';
import AdminAddUser from './pages/admin/AddUser';
import AdminAddCourse from './pages/admin/AddCourse';
import AdminMediaLibrary from './pages/admin/MediaLibrary';
import AdminSiteSettings from './pages/admin/Settings';
import AdminActivityFeed from './pages/admin/ActivityFeed';
import AdminLayout from './pages/admin/AdminLayout';
import PaymentSettings from './pages/admin/PaymentSettings';
import AdminFinancials from './pages/admin/Financials';
import AdminCoupons from './pages/admin/CouponManagement';
import CoachDashboard from './pages/coach/Dashboard';
import CoachAthletes from './pages/coach/Athletes';
import CoachAnalytics from './pages/coach/Analytics';
import CoachCourses from './pages/coach/CourseManagement';
import CoachAddCourse from './pages/coach/AddCourse';
import CoachCustomProgrammer from './pages/coach/CustomProgrammer';
import CoachCustomCycles from './pages/coach/CustomCycles';
import CoachGlobalQuestions from './pages/coach/GlobalQuestions';
import CoachExerciseLibrary from './pages/coach/ExerciseLibrary';
import CoachWorkoutLibrary from './pages/coach/WorkoutLibrary';
import CoachMealLibrary from './pages/coach/MealLibrary';
import CoachMediaLibrary from './pages/coach/MediaLibrary';
import CoachLayout from './pages/coach/CoachLayout';
import SupportLayout from './pages/support/SupportLayout';
import SupportDashboard from './pages/support/Dashboard';
import SupportSubscriptions from './pages/support/Subscriptions';
import SupportCourseCatalog from './pages/support/CourseCatalog';
import SupportDiagnosticLogic from './pages/support/DiagnosticLogic';
import { User, UserRole, MediaAsset, Course, ExerciseTemplate, WorkoutTemplate, MealPlan as MealPlanType } from './types';

const App: React.FC = () => {
  // PERSIST CURRENT USER (Auth is still local for session)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('theone_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [originalAdmin, setOriginalAdmin] = useState<User | null>(() => {
    const saved = localStorage.getItem('theone_original_admin');
    return saved ? JSON.parse(saved) : null;
  });
  
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('theone_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('theone_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (originalAdmin) {
      localStorage.setItem('theone_original_admin', JSON.stringify(originalAdmin));
    } else {
      localStorage.removeItem('theone_original_admin');
    }
  }, [originalAdmin]);

  // Site Settings Logic
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('ironpulse_site_settings');
    return saved ? JSON.parse(saved) : {
      logo: '',
      heroImage: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1400',
      missionImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1400',
      heroHeadline: 'Forging Elite Fitness.',
      heroSubline: 'We are more than a gym. We are a community of dedicated individuals pushing the boundaries of human performance.'
    };
  });

  // Sync Site Settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setSiteSettings(prev => ({ ...prev, ...data }));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('ironpulse_site_settings', JSON.stringify(siteSettings));
  }, [siteSettings]);

  // FIRESTORE SYNC LOGIC
  const [mediaLibrary, setMediaLibrary] = useState<MediaAsset[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseTemplate[]>([]);
  const [workoutLibrary, setWorkoutLibrary] = useState<WorkoutTemplate[]>([]);
  const [mealPlanLibrary, setMealPlanLibrary] = useState<MealPlanType[]>([]);

  useEffect(() => {
    const unsubMedia = onSnapshot(collection(db, 'media'), (snapshot) => {
      setMediaLibrary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaAsset)));
    });
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });
    const unsubExercise = onSnapshot(collection(db, 'exercises'), (snapshot) => {
      setExerciseLibrary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseTemplate)));
    });
    const unsubWorkout = onSnapshot(collection(db, 'workouts'), (snapshot) => {
      setWorkoutLibrary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutTemplate)));
    });
    const unsubMeal = onSnapshot(collection(db, 'mealplans'), (snapshot) => {
      setMealPlanLibrary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealPlanType)));
    });

    return () => {
      unsubMedia();
      unsubCourses();
      unsubExercise();
      unsubWorkout();
      unsubMeal();
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setOriginalAdmin(null);
  };

  const handleImpersonate = (user: User) => {
    setOriginalAdmin(currentUser);
    setCurrentUser(user);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stopImpersonating = () => {
    if (originalAdmin) {
      setCurrentUser(originalAdmin);
      setOriginalAdmin(null);
    }
  };

  const isLoggedIn = !!currentUser;

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {originalAdmin && (
          <div className="bg-accent py-2 px-6 flex items-center justify-center gap-6 animate-in slide-in-from-top duration-500 z-[60] fixed w-full top-0 left-0 shadow-xl">
             <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white text-[18px] filled animate-pulse">admin_panel_settings</span>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  Viewing as <span className="underline decoration-white/30 decoration-2 underline-offset-4">{currentUser?.firstName} {currentUser?.lastName}</span>
                </p>
             </div>
             <button 
                onClick={stopImpersonating}
                className="bg-white text-accent px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl"
             >
                Exit Session
             </button>
          </div>
        )}

        <div className={originalAdmin ? 'mt-12' : ''}>
          <Navbar isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} logo={siteSettings.logo} />
        </div>
        
        <main className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={<Homepage currentUser={currentUser} settings={siteSettings} />} />
            
            <Route path="/courses" element={<Courses courses={courses} currentUser={currentUser} />} />
            <Route path="/courses/:id" element={<CourseDetail currentUser={currentUser} courses={courses} />} />
            <Route path="/custom-course" element={<CustomCourse currentUser={currentUser} />} />
            <Route path="/athlete/diagnostic/:id" element={<AthleteDiagnostics currentUser={currentUser} />} />
            <Route path="/coaches" element={<Coaches />} />
            <Route path="/coaches/:id" element={<CoachProfile />} />
            <Route path="/checkout" element={<Checkout currentUser={currentUser} onEnroll={setCurrentUser} courses={courses} />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login onLogin={setCurrentUser} />} />
            <Route path="/signup" element={<Signup onSignup={setCurrentUser} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/profile" element={isLoggedIn ? <Profile currentUser={currentUser!} /> : <Navigate to="/login" />} />
            <Route path="/profile/courses" element={isLoggedIn ? <MyCourses currentUser={currentUser} courses={courses} /> : <Navigate to="/login" />} />
            <Route path="/profile/messages" element={isLoggedIn ? <Chat currentUser={currentUser!} /> : <Navigate to="/login" />} />
            <Route path="/profile/nutrition" element={isLoggedIn ? <MealPlan /> : <Navigate to="/login" />} />
            <Route path="/profile/vitals" element={isLoggedIn ? <UserDetails /> : <Navigate to="/login" />} />
            <Route path="/profile/settings" element={isLoggedIn ? <ProfileSettings currentUser={currentUser!} /> : <Navigate to="/login" />} />
            <Route path="/profile/notifications" element={isLoggedIn ? <NotificationsSettings /> : <Navigate to="/login" />} />
            <Route path="/profile/billing" element={isLoggedIn ? <BillingHistory /> : <Navigate to="/login" />} />
            <Route path="/workout/:id" element={isLoggedIn ? <WorkoutSession courses={courses} currentUser={currentUser!} /> : <Navigate to="/login" />} />

            <Route path="/admin" element={currentUser?.role === UserRole.ADMIN ? <AdminLayout /> : <Navigate to="/" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="custom-requests" element={<AdminCustomRequests />} />
              <Route path="custom-programmer/:requestId" element={<CoachCustomProgrammer library={mediaLibrary} />} />
              <Route path="custom-view/:requestId" element={<AdminCustomWorkoutViewer />} />
              <Route path="messages" element={<Chat currentUser={currentUser!} />} />
              <Route path="users" element={<AdminUsers onImpersonate={handleImpersonate} courses={courses} />} />
              <Route path="users/new" element={<AdminAddUser />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="financials" element={<AdminFinancials />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="courses" element={<AdminCourses courses={courses} />} />
              <Route path="courses/new" element={<AdminAddCourse library={mediaLibrary} courses={courses} exerciseLibrary={exerciseLibrary} workoutLibrary={workoutLibrary} mealPlanLibrary={mealPlanLibrary} />} />
              <Route path="courses/edit/:id" element={<AdminAddCourse library={mediaLibrary} courses={courses} exerciseLibrary={exerciseLibrary} workoutLibrary={workoutLibrary} mealPlanLibrary={mealPlanLibrary} />} />
              <Route path="payment-gateway" element={<PaymentSettings />} />
              <Route path="exercise-library" element={<CoachExerciseLibrary library={mediaLibrary} exerciseLibrary={exerciseLibrary} currentUser={currentUser!} />} />
              <Route path="workout-library" element={<CoachWorkoutLibrary library={mediaLibrary} workoutLibrary={workoutLibrary} exerciseLibrary={exerciseLibrary} currentUser={currentUser!} />} />
              <Route path="meal-library" element={<CoachMealLibrary mealPlanLibrary={mealPlanLibrary} currentUser={currentUser!} />} />
              <Route path="media" element={<AdminMediaLibrary library={mediaLibrary} />} />
              <Route path="activity" element={<AdminActivityFeed />} />
              <Route 
                path="settings" 
                element={<AdminSiteSettings siteSettings={siteSettings} setSiteSettings={setSiteSettings} library={mediaLibrary} />} 
              />
              <Route path="diagnostics" element={<SupportDiagnosticLogic />} />
            </Route>

            <Route path="/coach" element={currentUser?.role === UserRole.COACH ? <CoachLayout /> : <Navigate to="/" />}>
              <Route index element={<CoachDashboard />} />
              <Route path="messages" element={<Chat currentUser={currentUser!} />} />
              <Route path="athletes" element={<CoachAthletes currentUser={currentUser!} />} />
              <Route path="custom-cycles" element={<CoachCustomCycles />} />
              <Route path="global-questions" element={<CoachGlobalQuestions />} />
              <Route path="exercise-library" element={<CoachExerciseLibrary library={mediaLibrary} exerciseLibrary={exerciseLibrary} currentUser={currentUser!} />} />
              <Route path="workout-library" element={<CoachWorkoutLibrary library={mediaLibrary} workoutLibrary={workoutLibrary} exerciseLibrary={exerciseLibrary} currentUser={currentUser!} />} />
              <Route path="meal-library" element={<CoachMealLibrary mealPlanLibrary={mealPlanLibrary} currentUser={currentUser!} />} />
              <Route path="media" element={<CoachMediaLibrary library={mediaLibrary} setLibrary={setMediaLibrary} currentUser={currentUser!} />} />
              <Route path="analytics" element={<CoachAnalytics />} />
              <Route path="courses" element={<CoachCourses courses={courses} currentUser={currentUser!} />} />
              <Route path="courses/new" element={<CoachAddCourse library={mediaLibrary} courses={courses} exerciseLibrary={exerciseLibrary} workoutLibrary={workoutLibrary} mealPlanLibrary={mealPlanLibrary} currentUser={currentUser!} />} />
              <Route path="programmer/:requestId" element={<CoachCustomProgrammer library={mediaLibrary} />} />
              <Route path="courses/edit/:id" element={<CoachAddCourse library={mediaLibrary} courses={courses} exerciseLibrary={exerciseLibrary} workoutLibrary={workoutLibrary} mealPlanLibrary={mealPlanLibrary} currentUser={currentUser!} />} />
            </Route>

            <Route path="/support" element={currentUser?.role === UserRole.SUPPORT ? <SupportLayout /> : <Navigate to="/" />}>
              <Route index element={<SupportDashboard />} />
              <Route path="messages" element={<Chat currentUser={currentUser!} />} />
              <Route path="subscriptions" element={<SupportSubscriptions />} />
              <Route path="catalog" element={<SupportCourseCatalog />} />
              <Route path="diagnostics" element={<SupportDiagnosticLogic />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer logo={siteSettings.logo} />
      </div>
    </Router>
  );
};

export default App;
