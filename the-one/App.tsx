
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminAiArchitect from './pages/admin/AiArchitect';
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
import { User, UserRole, MediaAsset } from './types';
import { MOCK_USER, MOCK_ADMIN } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalAdmin, setOriginalAdmin] = useState<User | null>(null);
  
  // Persistence Logic for Site Settings
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

  useEffect(() => {
    localStorage.setItem('ironpulse_site_settings', JSON.stringify(siteSettings));
  }, [siteSettings]);

  const [mediaLibrary, setMediaLibrary] = useState<MediaAsset[]>(() => {
    const saved = localStorage.getItem('ironpulse_media_library');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'image', data: siteSettings.heroImage, name: 'Main Hero Asset', category: 'GENERAL', createdAt: Date.now(), isPublic: true, creatorName: 'Admin' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ironpulse_media_library', JSON.stringify(mediaLibrary));
  }, [mediaLibrary]);

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
          <div className="bg-accent py-2 px-6 flex items-center justify-center gap-6 animate-in slide-in-from-top duration-500 z-[60]">
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

        <Navbar isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} logo={siteSettings.logo} />
        <main className="flex-grow flex flex-col">
          <Routes>
            {/* Homepage is now public */}
            <Route path="/" element={<Homepage settings={siteSettings} />} />
            
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail currentUser={currentUser} />} />
            <Route path="/custom-course" element={<CustomCourse currentUser={currentUser} />} />
            <Route path="/athlete/diagnostic/:id" element={<AthleteDiagnostics currentUser={currentUser} />} />
            <Route path="/coaches" element={<Coaches />} />
            <Route path="/coaches/:id" element={<CoachProfile />} />
            <Route path="/checkout" element={<Checkout currentUser={currentUser} />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login onLogin={setCurrentUser} />} />
            <Route path="/signup" element={<Signup onSignup={setCurrentUser} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/profile/courses" element={isLoggedIn ? <MyCourses /> : <Navigate to="/login" />} />
            <Route path="/profile/messages" element={isLoggedIn ? <Chat currentUser={currentUser!} /> : <Navigate to="/login" />} />
            <Route path="/profile/nutrition" element={isLoggedIn ? <MealPlan /> : <Navigate to="/login" />} />
            <Route path="/profile/vitals" element={isLoggedIn ? <UserDetails /> : <Navigate to="/login" />} />
            <Route path="/profile/settings" element={isLoggedIn ? <ProfileSettings /> : <Navigate to="/login" />} />
            <Route path="/profile/notifications" element={isLoggedIn ? <NotificationsSettings /> : <Navigate to="/login" />} />
            <Route path="/profile/billing" element={isLoggedIn ? <BillingHistory /> : <Navigate to="/login" />} />
            <Route path="/workout/:id" element={isLoggedIn ? <WorkoutSession /> : <Navigate to="/login" />} />

            <Route path="/admin" element={currentUser?.role === UserRole.ADMIN ? <AdminLayout /> : <Navigate to="/" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="custom-requests" element={<AdminCustomRequests />} />
              <Route path="custom-view/:requestId" element={<AdminCustomWorkoutViewer />} />
              <Route path="messages" element={<Chat currentUser={currentUser!} />} />
              <Route path="users" element={<AdminUsers onImpersonate={handleImpersonate} />} />
              <Route path="users/new" element={<AdminAddUser />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="financials" element={<AdminFinancials />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/new" element={<AdminAddCourse />} />
              <Route path="courses/edit/:id" element={<AdminAddCourse />} />
              <Route path="payment-gateway" element={<PaymentSettings />} />
              <Route path="exercise-library" element={<CoachExerciseLibrary library={mediaLibrary} setLibrary={setMediaLibrary} currentUser={currentUser!} />} />
              <Route path="workout-library" element={<CoachWorkoutLibrary library={mediaLibrary} setLibrary={setMediaLibrary} currentUser={currentUser!} />} />
              <Route path="meal-library" element={<CoachMealLibrary currentUser={currentUser!} />} />
              <Route path="media" element={<AdminMediaLibrary library={mediaLibrary} setLibrary={setMediaLibrary} />} />
              <Route path="activity" element={<AdminActivityFeed />} />
              <Route path="architect" element={<AdminAiArchitect siteSettings={siteSettings} setSiteSettings={setSiteSettings} onLogout={handleLogout} />} />
              <Route 
                path="settings" 
                element={<AdminSiteSettings siteSettings={siteSettings} setSiteSettings={setSiteSettings} library={mediaLibrary} setLibrary={setMediaLibrary} />} 
              />
            </Route>

            <Route path="/coach" element={currentUser?.role === UserRole.COACH ? <CoachLayout /> : <Navigate to="/" />}>
              <Route index element={<CoachDashboard />} />
              <Route path="messages" element={<Chat currentUser={currentUser!} />} />
              <Route path="athletes" element={<CoachAthletes />} />
              <Route path="custom-cycles" element={<CoachCustomCycles />} />
              <Route path="global-questions" element={<CoachGlobalQuestions />} />
              <Route path="exercise-library" element={<CoachExerciseLibrary library={mediaLibrary} setLibrary={setMediaLibrary} currentUser={currentUser!} />} />
              <Route path="workout-library" element={<CoachWorkoutLibrary library={mediaLibrary} setLibrary={setMediaLibrary} currentUser={currentUser!} />} />
              <Route path="meal-library" element={<CoachMealLibrary currentUser={currentUser!} />} />
              <Route path="media" element={<CoachMediaLibrary library={mediaLibrary} setLibrary={setMediaLibrary} currentUser={currentUser!} />} />
              <Route path="analytics" element={<CoachAnalytics />} />
              <Route path="courses" element={<CoachCourses />} />
              <Route path="courses/new" element={<CoachAddCourse library={mediaLibrary} setLibrary={setMediaLibrary} />} />
              <Route path="programmer/:requestId" element={<CoachCustomProgrammer library={mediaLibrary} setLibrary={setMediaLibrary} />} />
              <Route path="courses/edit/:id" element={<CoachAddCourse library={mediaLibrary} setLibrary={setMediaLibrary} />} />
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
