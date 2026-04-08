
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateDoc, doc, arrayUnion, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Course } from '../types';
import { CUSTOM_DISCIPLINES } from '../constants';
import { logEvent } from '../hooks/useLogEvent';

interface CheckoutProps {
  currentUser: User | null;
  onEnroll: (user: User) => void;
  courses?: Course[];
}

const Checkout: React.FC<CheckoutProps> = ({ currentUser, onEnroll, courses = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'entry' | 'authorizing' | 'success'>('entry');
  
  const queryParams = new URLSearchParams(location.search);
  const courseId = queryParams.get('courseId');
  const isCustom = courseId?.startsWith('custom-');
  
  const course = courses.find(c => c.id === courseId);

  // Fallback for custom or missing course to avoid crash
  const displayCourse = course || {
      id: courseId || 'unknown',
      title: isCustom ? 'Custom Program' : 'Unknown Course',
      price: isCustom ? 299 : 0, 
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1400',
      description: '',
      instructor: 'IronPulse',
      category: 'Program',
      level: 'Advanced',
      duration: 'Ongoing',
      enrollmentCount: 0,
      rating: 5,
      hasMealPlan: false
  } as Course;

  // Coupon Logic
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isCouponError, setIsCouponError] = useState(false);

  const subtotal = displayCourse.price;
  const total = Math.max(0, subtotal - appliedDiscount);

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'IRON10') {
      setAppliedDiscount(Math.round(subtotal * 0.1));
      setIsCouponError(false);
    } else if (couponCode.toUpperCase() === 'LAUNCH50') {
      setAppliedDiscount(50);
      setIsCouponError(false);
    } else {
      setIsCouponError(true);
      setAppliedDiscount(0);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
        alert("You must be logged in to purchase.");
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
        return;
    }

    if (!courseId) {
        alert("Invalid course.");
        return;
    }

    setIsProcessing(true);
    setPaymentStep('authorizing');
    
    // Simulate Payment Processing Delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        let redirectId = courseId;

        // 1. Handle Custom Request Creation
        if (isCustom) {
            const sportId = courseId.replace('custom-', '');
            
            // Fetch configuration from Firestore first
            let disciplineConfig: any = null;
            try {
                const configSnap = await getDoc(doc(db, 'custom_disciplines', sportId));
                if (configSnap.exists()) {
                    disciplineConfig = configSnap.data();
                }
            } catch (e) {
                console.error("Error fetching discipline config", e);
            }
            
            if (!disciplineConfig) {
                 disciplineConfig = CUSTOM_DISCIPLINES.find(d => d.id === sportId);
            }
            
            const newRequest = {
                athleteId: currentUser.id,
                athleteName: `${currentUser.firstName} ${currentUser.lastName}`,
                phone: '',
                sport: sportId,
                goal: disciplineConfig?.name || 'Custom Program',
                biometrics: { height: '', weight: '', age: '' },
                status: 'DIAGNOSTIC',
                price: total,
                createdAt: serverTimestamp(),
                assignedCoachIds: disciplineConfig?.assignedCoachId ? [disciplineConfig.assignedCoachId] : [],
                weeks: [],
                hasMealPlan: false,
                durationWeeks: 4,
                diagnostics: disciplineConfig?.diagnostics || [],
                submissions: []
            };
            
            const reqRef = await addDoc(collection(db, 'custom_requests'), newRequest);
            redirectId = reqRef.id; 
        }

        // 2. Update Firestore User Enrollments
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
            enrolledCourseIds: arrayUnion(redirectId)
        });

        // 3. Update Local State
        const currentEnrollments = currentUser.enrolledCourseIds || [];
        if (!currentEnrollments.includes(redirectId)) {
            const updatedUser = {
                ...currentUser,
                enrolledCourseIds: [...currentEnrollments, redirectId]
            };
            onEnroll(updatedUser);
        }

        // 4. Success UI
        setPaymentStep('success');
        setIsProcessing(false);
        localStorage.setItem('automated_msg_purchase', 'true');

        // Log enrollment to system_logs
        logEvent({
          type: isCustom ? 'CUSTOM_REQUEST' : 'COURSE_ENROLL',
          title: isCustom ? 'Custom Program Purchased' : 'Course Enrollment',
          description: isCustom
            ? `${currentUser.firstName} ${currentUser.lastName} purchased a custom program ($${total}).`
            : `${currentUser.firstName} ${currentUser.lastName} enrolled in "${displayCourse.title}" ($${total}).`,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          userEmail: currentUser.email,
          userAvatar: (currentUser as any).avatar,
          meta: { courseId: redirectId, courseTitle: displayCourse.title, amount: total },
        });
        
        // 5. Redirect
        setTimeout(() => {
            if (isCustom) navigate(`/athlete/diagnostic/${redirectId}`);
            else navigate('/profile/courses');
        }, 2500);

    } catch (error) {
        console.error("Payment/Enrollment Error:", error);
        setIsProcessing(false);
        setPaymentStep('entry');
        alert("Transaction failed. Please try again.");
    }
  };

  if (!courseId) {
      return (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
              <p className="text-xl font-bold">No course selected.</p>
              <button onClick={() => navigate('/courses')} className="px-6 py-3 bg-black text-white rounded-xl uppercase font-bold text-xs">Browse Courses</button>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left animate-in fade-in duration-500 min-h-[70vh] flex flex-col justify-center">
      {paymentStep === 'success' ? (
        <div className="max-w-xl mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl">
              <span className="material-symbols-outlined text-5xl filled">check_circle</span>
           </div>
           <div className="space-y-3">
              <h1 className="text-4xl font-black font-display uppercase tracking-tight text-black">Authorization Confirmed</h1>
              <p className="text-neutral-500 font-medium">Transaction complete via SindiPay. Your enrollment has been committed to the Pulse ledger.</p>
           </div>
           <div className="p-6 bg-accent/5 border border-accent/10 rounded-[2rem] flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">Redirecting to {isCustom ? 'Athlete Diagnostic' : 'My Courses'}...</p>
           </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1 space-y-12">
            <div className="space-y-4">
              <h1 className="text-5xl font-black font-display uppercase tracking-tight text-black leading-none">Checkout Authorized</h1>
              <p className="text-neutral-500 font-medium text-lg">Secure SindiPay Gateway — Enter details to confirm enrollment.</p>
            </div>

            <form onSubmit={handlePay} className="space-y-10">
              <section className="bg-white rounded-[2.5rem] p-10 border border-neutral-100 shadow-2xl space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined filled">shield</span>
                    </div>
                    <h2 className="text-2xl font-black font-display uppercase tracking-tight text-black">IronPulse Vault</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Powered by</span>
                    <span className="text-xs font-black text-black uppercase tracking-tighter">SindiPay</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Cardholder Name</label>
                       <input type="text" defaultValue={currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.toUpperCase() : ''} className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 font-black uppercase outline-none focus:ring-2 focus:ring-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Simulation Card</label>
                       <input type="text" value="4444 4444 4444 4444" disabled className="w-full p-5 bg-neutral-100 rounded-2xl border border-neutral-200 font-black outline-none opacity-50" />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-800 transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Contacting SindiPay...</>
                  ) : (
                    <><span className="material-symbols-outlined">payments</span> Confirm Payment — ${total}</>
                  )}
                </button>
              </section>
            </form>
          </div>

          <div className="w-full lg:w-[400px] space-y-6">
            <div className="bg-neutral-900 rounded-[3rem] p-10 text-white shadow-2xl space-y-10 overflow-hidden relative">
              <h2 className="text-2xl font-black font-display uppercase tracking-tight relative z-10">Order Summary</h2>
              <div className="space-y-6 relative z-10">
                <div className="flex gap-6">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
                    <img src={displayCourse.image} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="font-black text-white uppercase text-base tracking-tight leading-tight">{displayCourse.title}</p>
                    <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1">SindiPay Secure Order</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-4">
                   <div className="flex justify-between text-sm font-bold text-neutral-400">
                      <span>Subtotal</span>
                      <span>${subtotal}</span>
                   </div>
                   {appliedDiscount > 0 && (
                     <div className="flex justify-between text-sm font-black text-green-500">
                        <span>Discount Applied</span>
                        <span>-${appliedDiscount}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-3xl font-black pt-2">
                      <span className="uppercase font-display tracking-tight">Total</span>
                      <span className="text-accent">${total}</span>
                   </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[200px] absolute -bottom-20 -right-20 text-white/5 select-none rotate-12">receipt_long</span>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-xl space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-black">Promo Code</h3>
               <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="Enter code..." 
                    className="flex-1 bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:border-black" 
                  />
                  <button 
                    onClick={applyCoupon}
                    className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Apply
                  </button>
               </div>
               {isCouponError && (
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Invalid or expired code</p>
               )}
               {appliedDiscount > 0 && (
                 <p className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                   <span className="material-symbols-outlined text-xs filled">check_circle</span>
                   Promotion Successfully Linked
                 </p>
               )}
               <p className="text-[8px] font-bold text-neutral-300 uppercase leading-relaxed italic">Try code "IRON10" for a 10% discount on your enrollment.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
