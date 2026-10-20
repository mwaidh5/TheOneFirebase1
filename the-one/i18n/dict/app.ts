// Client app and website strings not covered in translations.ts — Arabic/English UI strings.
// Keys are prefixed 'app.' so the dictionaries never collide.
export const appTranslations = {

  // ════ Workout session ════
  // ── Shared timer controls ──────────────────────────────────────────────
  'app.workout.btn_start': { en: '▶  Start', ar: '▶  ابدأ' },
  'app.workout.btn_pause': { en: '⏸  Pause', ar: '⏸  إيقاف مؤقت' },
  'app.workout.btn_restart': { en: '↺ Restart', ar: '↺ إعادة' },
  'app.workout.reset_timer': { en: 'Reset timer', ar: 'إعادة ضبط المؤقت' },
  'app.workout.ready_short': { en: 'Ready', ar: 'جاهز' },
  'app.workout.target': { en: 'Target', ar: 'الهدف' },
  'app.workout.max': { en: 'Max', ar: 'أقصى' },
  'app.workout.na': { en: 'N/A', ar: 'غير محدد' },
  'app.workout.mins_short': { en: '{n}m', ar: '{n} د' },
  'app.workout.plus_secs': { en: '+{n}s', ar: '+{n} ث' },
  'app.workout.mmss': { en: 'MM:SS', ar: 'دد:ثث' },
  'app.workout.unit_kg': { en: 'kg', ar: 'كغ' },
  'app.workout.unit_lbs': { en: 'lbs', ar: 'رطل' },
  'app.workout.kcal': { en: 'kcal', ar: 'سعرة' },
  'app.workout.kcal_value': { en: '{n} kcal', ar: '{n} سعرة' },

  // ── EMOM ───────────────────────────────────────────────────────────────
  'app.workout.round': { en: 'Round', ar: 'الجولة' },
  'app.workout.emom_complete': { en: '✓ Workout Complete', ar: '✓ اكتمل التمرين' },
  'app.workout.switch_now': { en: '↔ Switch Now', ar: '↔ بدّل الآن' },
  'app.workout.ring_switching': { en: 'switching', ar: 'تبديل' },
  'app.workout.ring_rest': { en: 'rest', ar: 'راحة' },
  'app.workout.ring_work': { en: 'work', ar: 'عمل' },
  'app.workout.next_label': { en: 'Next:', ar: 'التالي:' },
  'app.workout.switch_buffer': { en: 'Switch buffer:', ar: 'مهلة التبديل:' },
  'app.workout.off': { en: 'Off', ar: 'بدون' },

  // ── For Time ───────────────────────────────────────────────────────────
  'app.workout.for_time': { en: 'For Time', ar: 'بأسرع وقت' },
  'app.workout.cap': { en: 'Cap', ar: 'الحد' },
  'app.workout.finished': { en: '✓ Finished', ar: '✓ انتهى' },
  'app.workout.past_cap': { en: 'Past Cap — Push!', ar: 'تجاوزت الحد — واصل!' },
  'app.workout.race_clock': { en: 'Race The Clock', ar: 'سابق الوقت' },
  'app.workout.ring_final': { en: 'final', ar: 'النهائي' },
  'app.workout.ring_elapsed': { en: 'elapsed', ar: 'المنقضي' },

  // ── AMRAP ──────────────────────────────────────────────────────────────
  'app.workout.amrap': { en: 'AMRAP', ar: 'AMRAP' },
  'app.workout.time_up': { en: '✓ Time!', ar: '✓ انتهى الوقت!' },
  'app.workout.keep_cycling': { en: 'Keep Cycling', ar: 'واصل الجولات' },
  'app.workout.ring_remaining': { en: 'remaining', ar: 'المتبقي' },
  'app.workout.round_fewer': { en: 'One round fewer', ar: 'جولة أقل' },
  'app.workout.round_more': { en: 'One more round', ar: 'جولة إضافية' },
  'app.workout.rounds_done': { en: 'rounds done', ar: 'جولات منجزة' },
  'app.workout.each_round': { en: 'Each round', ar: 'كل جولة' },
  'app.workout.go_again': { en: '↺ Go Again', ar: '↺ مرة أخرى' },
  'app.workout.start_amrap': { en: '▶  Start AMRAP', ar: '▶  ابدأ AMRAP' },
  'app.workout.n_rounds': { en: '{n} rounds', ar: '{n} جولات' },

  // ── Hold ───────────────────────────────────────────────────────────────
  'app.workout.hold_saved': { en: '✓ Hold Saved', ar: '✓ تم حفظ الثبات' },
  'app.workout.new_pb': { en: '🔥 New Personal Best!', ar: '🔥 رقم شخصي جديد!' },
  'app.workout.hold_position': { en: 'Hold The Position', ar: 'حافظ على الوضعية' },
  'app.workout.ready_to_hold': { en: 'Ready To Hold', ar: 'جاهز للثبات' },
  'app.workout.ring_saved': { en: 'saved', ar: 'محفوظ' },
  'app.workout.ring_holding': { en: 'holding', ar: 'ثبات' },
  'app.workout.hold_again': { en: '↺ Hold Again', ar: '↺ ثبات مرة أخرى' },
  'app.workout.start_hold': { en: '▶  Start Hold', ar: '▶  ابدأ الثبات' },
  'app.workout.save_hold': { en: 'Save Hold', ar: 'احفظ الثبات' },
  'app.workout.no_record': { en: 'No record yet — set one!', ar: 'لا يوجد رقم بعد — سجّل أول رقم!' },
  'app.workout.your_hold': { en: 'Your hold', ar: 'ثباتك' },
  'app.workout.hold_hint': { en: 'held — tap Save Hold above to auto-fill', ar: 'ثبات — اضغط «احفظ الثبات» في الأعلى للتعبئة التلقائية' },

  // ── Exercise card ──────────────────────────────────────────────────────
  'app.workout.watch_demo': { en: 'Watch video demo', ar: 'شاهد الفيديو التوضيحي' },
  'app.workout.reference': { en: 'Reference', ar: 'مرجع' },
  'app.workout.click_outside_close': { en: 'Click outside to close', ar: 'اضغط خارج الفيديو للإغلاق' },
  'app.workout.detail_reps': { en: '{n} reps', ar: '{n} تكرار' },
  'app.workout.detail_sets': { en: '{n} sets', ar: '{n} مجموعات' },
  'app.workout.sets_x_reps': { en: '{sets} SETS × {reps}', ar: '{sets} مجموعات × {reps}' },
  'app.workout.eg_weight': { en: 'e.g. 80', ar: 'مثال: 80' },
  'app.workout.eg_reps': { en: 'e.g. 8', ar: 'مثال: 8' },
  'app.workout.rpe_value': { en: 'RPE {n} / 10', ar: 'الجهد {n} / 10' },
  'app.workout.meal_default_desc': { en: 'A balanced nutrition plan designed to support your training volume.', ar: 'خطة تغذية متوازنة مصممة لدعم حجم تدريبك.' },
  'app.workout.live_needs_ios': { en: 'Lock-screen timer needs iOS 16.2 or newer.', ar: 'مؤقت شاشة القفل يتطلب iOS 16.2 أو أحدث.' },
  'app.workout.live_disabled': { en: 'Live Activities are turned off for this app (Settings → The One Training → Live Activities).', ar: 'الأنشطة المباشرة متوقفة لهذا التطبيق (الإعدادات ← The One Training ← الأنشطة المباشرة).' },
  'app.workout.live_no_plugin': { en: 'Live Activity plugin not found in this build.', ar: 'إضافة النشاط المباشر غير موجودة في هذا الإصدار.' },

  // ── Exercise format badges (enum shown at display time) ────────────────
  'app.workout.fmt_regular': { en: 'REGULAR', ar: 'عادي' },
  'app.workout.fmt_emom': { en: 'EMOM', ar: 'EMOM' },
  'app.workout.fmt_super_set': { en: 'SUPER SET', ar: 'مجموعة مزدوجة' },
  'app.workout.fmt_circuit': { en: 'CIRCUIT', ar: 'تمرين دائري' },
  'app.workout.fmt_drop_set': { en: 'DROP SET', ar: 'مجموعة تنازلية' },
  'app.workout.fmt_amrap': { en: 'AMRAP', ar: 'AMRAP' },
  'app.workout.fmt_for_time': { en: 'FOR TIME', ar: 'بأسرع وقت' },
  'app.workout.fmt_hiit': { en: 'HIIT', ar: 'HIIT' },
  'app.workout.fmt_cardio': { en: 'CARDIO', ar: 'كارديو' },
  'app.workout.fmt_max_effort': { en: 'MAX EFFORT', ar: 'أقصى جهد' },
  'app.workout.fmt_hold': { en: 'HOLD', ar: 'ثبات' },

  // ════ Profile, settings, vitals, diagnostics ════
  // ── Profile ──────────────────────────────────────────────────────────────
  'app.profile.unit_kg': { en: 'kg', ar: 'كغ' },
  'app.profile.unit_lbs': { en: 'lbs', ar: 'رطل' },
  'app.profile.weight_lbs': { en: '{n} lbs', ar: '{n} رطل' },
  'app.profile.upload_failed': { en: 'Firebase rejected the upload: {code} - {msg}', ar: 'تم رفض رفع الصورة: {code} - {msg}' },
  'app.profile.dur_min_sec': { en: '{m}m {s}s', ar: '{m} د {s} ث' },
  'app.profile.dur_sec': { en: '{s}s', ar: '{s} ث' },
  'app.profile.log_meta': { en: '{course} · Wk {week} · Day {day}', ar: '{course} · الأسبوع {week} · اليوم {day}' },
  'app.profile.plus_more': { en: '+{n} more', ar: '+{n} أخرى' },
  'app.profile.entries_count': { en: '{n} entries', ar: '{n} إدخال' },
  'app.profile.coach_name': { en: 'Coach {name}', ar: 'المدرب {name}' },
  'app.profile.athlete': { en: 'Athlete', ar: 'رياضي' },
  'app.profile.level_beginner': { en: 'Beginner', ar: 'مبتدئ' },
  'app.profile.level_intermediate': { en: 'Intermediate', ar: 'متوسط' },
  'app.profile.level_advanced': { en: 'Advanced', ar: 'متقدم' },
  'app.profile.level_elite': { en: 'Elite', ar: 'نخبة' },
  'app.profile.goal_hypertrophy': { en: 'Hypertrophy', ar: 'تضخيم العضلات' },
  'app.profile.goal_strength': { en: 'Strength', ar: 'القوة' },
  'app.profile.goal_endurance': { en: 'Endurance', ar: 'التحمّل' },
  'app.profile.goal_weight_loss': { en: 'Weight Loss', ar: 'خسارة الوزن' },
  'app.profile.goal_performance': { en: 'Athletic Performance', ar: 'الأداء الرياضي' },
  'app.profile.prev_period': { en: 'Previous period', ar: 'الفترة السابقة' },
  'app.profile.next_period': { en: 'Next period', ar: 'الفترة التالية' },
  'app.profile.message_coach': { en: 'Message coach', ar: 'راسل المدرب' },
  'app.profile.change_photo': { en: 'Change photo', ar: 'تغيير الصورة' },

  // ── Profile settings ─────────────────────────────────────────────────────
  'app.settings.email_reauth': { en: 'Email update requires re-authentication. Please sign out and sign in again to change email safely.', ar: 'تغيير البريد الإلكتروني يتطلب إعادة المصادقة. سجّل الخروج ثم سجّل الدخول مجدداً لتغيير البريد بأمان.' },
  'app.settings.profile_updated': { en: 'Profile updated successfully!', ar: 'تم تحديث الملف الشخصي بنجاح!' },
  'app.settings.update_failed': { en: 'Failed to update profile: {msg}', ar: 'فشل تحديث الملف الشخصي: {msg}' },
  'app.settings.mfa_linked': { en: 'Logic Secured: Google Authenticator is now linked to your account.', ar: 'تم التأمين: أصبح Google Authenticator مربوطاً بحسابك.' },
  'app.settings.mfa_invalid': { en: 'Invalid code. Please try 123456 for the demo.', ar: 'رمز غير صحيح. جرّب 123456 للتجربة.' },
  'app.settings.revoke_confirm': { en: 'Revoke access for this device? It will be logged out immediately.', ar: 'إلغاء وصول هذا الجهاز؟ سيتم تسجيل خروجه فوراً.' },
  'app.settings.device_revoked': { en: 'Device access revoked.', ar: 'تم إلغاء وصول الجهاز.' },
  'app.settings.device_limit_reached': { en: 'Maximum device limit reached ({n}). You must revoke a device before adding a new one.', ar: 'تم بلوغ الحد الأقصى للأجهزة ({n}). يجب إلغاء جهاز قبل إضافة جهاز جديد.' },
  'app.settings.disable_mfa_confirm': { en: 'Disable MFA protection?', ar: 'تعطيل حماية المصادقة متعددة العوامل؟' },
  'app.settings.revoke_access': { en: 'Revoke Access', ar: 'إلغاء الوصول' },
  'app.settings.unknown_browser': { en: 'Unknown Browser', ar: 'متصفح غير معروف' },
  'app.settings.unknown_os': { en: 'Unknown OS', ar: 'نظام غير معروف' },
  'app.settings.download_receipt': { en: 'Download receipt', ar: 'تنزيل الإيصال' },

  // ── More page ────────────────────────────────────────────────────────────
  'app.more.role_client': { en: 'Client', ar: 'متدرّب' },
  'app.more.role_coach': { en: 'Coach', ar: 'مدرّب' },
  'app.more.role_admin': { en: 'Admin', ar: 'مسؤول' },
  'app.more.role_support': { en: 'Support', ar: 'الدعم' },
  'app.more.lang_en': { en: 'English', ar: 'الإنجليزية' },
  'app.more.lang_ar': { en: 'Arabic', ar: 'العربية' },

  // ── Notifications ────────────────────────────────────────────────────────
  'app.notif.toggle': { en: 'Toggle {name}', ar: 'تفعيل/إيقاف {name}' },


  // ── Vitals tracker (UserDetails) ─────────────────────────────────────────
  'app.details.body_fat': { en: 'Body Fat', ar: 'نسبة الدهون' },
  'app.details.resting_hr': { en: 'Resting HR', ar: 'نبض الراحة' },
  'app.details.unit_bpm': { en: 'bpm', ar: 'ن/د' },
  'app.details.log_today': { en: "Log today's vitals", ar: 'سجّل مؤشرات اليوم' },
  'app.details.save_entry': { en: 'Save entry', ar: 'حفظ الإدخال' },
  'app.details.latest': { en: 'Latest', ar: 'الأحدث' },
  'app.details.weight_trend': { en: 'Weight trend · {min}–{max} kg', ar: 'اتجاه الوزن · {min}–{max} كغ' },
  'app.details.history': { en: 'History', ar: 'السجل' },
  'app.details.no_entries': { en: 'No entries yet', ar: 'لا توجد إدخالات بعد' },
  'app.details.just_now': { en: 'just now', ar: 'الآن' },
  'app.details.save_failed': { en: 'Failed to save entry.', ar: 'فشل حفظ الإدخال.' },
  'app.details.delete_confirm': { en: 'Delete this entry?', ar: 'حذف هذا الإدخال؟' },
  'app.details.delete_entry': { en: 'Delete entry', ar: 'حذف الإدخال' },

  // ── Athlete diagnostics ──────────────────────────────────────────────────
  'app.diag.upload_failed': { en: 'Upload failed. Please try again.', ar: 'فشل الرفع. حاول مرة أخرى.' },
  'app.diag.draft_saved': { en: 'Draft saved successfully.', ar: 'تم حفظ المسودة بنجاح.' },
  'app.diag.draft_failed': { en: 'Failed to save draft.', ar: 'فشل حفظ المسودة.' },

  // ════ Public website: home, courses, coaches, contact, navbar ════
  // Marketing home
  'app.home.hero_alt': { en: 'Athlete', ar: 'رياضي' },
  'app.home.marquee_strength': { en: 'Strength', ar: 'القوة' },
  'app.home.marquee_resilience': { en: 'Resilience', ar: 'الصمود' },
  'app.home.marquee_performance': { en: 'Performance', ar: 'الأداء' },
  'app.home.marquee_discipline': { en: 'Discipline', ar: 'الانضباط' },
  'app.home.marquee_community': { en: 'Community', ar: 'المجتمع' },
  'app.home.marquee_elite': { en: 'Elite', ar: 'النخبة' },
  'app.home.marquee_forge': { en: 'Forge Your Path', ar: 'اصنع طريقك' },
  'app.home.chapter_num': { en: '{n} — Chapter', ar: 'الفصل {n}' },
  'app.home.stat_million_suffix': { en: 'M', ar: ' مليون' },

  // Sport / category display names (stored values stay English)
  'app.courses.sport_crossfit': { en: 'CrossFit', ar: 'كروس فت' },
  'app.courses.sport_weightlifting': { en: 'Weightlifting', ar: 'رفع الأثقال' },
  'app.courses.sport_olympic_weightlifting': { en: 'Olympic Weightlifting', ar: 'رفع الأثقال الأولمبي' },
  'app.courses.sport_bodybuilding': { en: 'Body Building', ar: 'كمال الأجسام' },
  'app.courses.sport_powerlifting': { en: 'Powerlifting', ar: 'رفع القوة' },
  'app.courses.sport_strength': { en: 'Strength & Conditioning', ar: 'القوة واللياقة البدنية' },
  'app.courses.sport_muaythai': { en: 'Muay Thai', ar: 'مواي تاي' },
  'app.courses.sport_general': { en: 'General Fitness', ar: 'لياقة عامة' },
  'app.courses.sport_hyrox': { en: 'Hyrox', ar: 'هايروكس' },
  'app.courses.sport_running': { en: 'Running', ar: 'الجري' },
  'app.courses.close_filters': { en: 'Close filters', ar: 'إغلاق الفلاتر' },
  'app.courses.filters': { en: 'Filters', ar: 'الفلاتر' },

  // Course detail / my courses
  'app.course.coach_alt': { en: 'Coach', ar: 'المدرب' },
  'app.mycourses.day_n': { en: 'Day {n}', ar: 'اليوم {n}' },
  'app.mycourses.message_coach': { en: 'Message coach', ar: 'راسل المدرب' },

  // Navbar
  'app.nav.logo_alt': { en: 'Logo', ar: 'الشعار' },
  'app.nav.menu': { en: 'Menu', ar: 'القائمة' },
  'app.nav.role_client': { en: 'Client', ar: 'رياضي' },
  'app.nav.role_coach': { en: 'Coach', ar: 'مدرب' },
  'app.nav.role_admin': { en: 'Admin', ar: 'مدير' },
  'app.nav.role_support': { en: 'Support', ar: 'الدعم' },

  // ════ Auth, checkout, chat, app home, shell ════
  // Auth (login / signup / forgot password)
  'app.auth.google_error_detail': { en: 'Google: {msg}', ar: 'جوجل: {msg}' },
  'app.auth.err_network': { en: 'No internet connection. Check your connection and try again.', ar: 'لا يوجد اتصال بالإنترنت. تحقّق من اتصالك وحاول مرة أخرى.' },
  'app.auth.err_email_in_use': { en: 'An account with this email already exists. Try signing in instead.', ar: 'يوجد حساب بهذا البريد بالفعل. جرّب تسجيل الدخول.' },
  'app.auth.err_invalid_email': { en: 'Please enter a valid email address.', ar: 'يرجى إدخال بريد إلكتروني صحيح.' },
  'app.auth.err_weak_password': { en: 'Password is too weak — use at least 6 characters.', ar: 'كلمة المرور ضعيفة — استخدم 6 أحرف على الأقل.' },
  'app.auth.err_not_allowed': { en: 'Email sign-up is currently disabled.', ar: 'التسجيل بالبريد الإلكتروني معطّل حالياً.' },
  'app.auth.err_too_many': { en: 'Too many attempts. Please wait a moment and try again.', ar: 'محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.' },
  'app.auth.err_user_not_found': { en: 'No account found with this email.', ar: 'لا يوجد حساب بهذا البريد الإلكتروني.' },
  'app.auth.err_missing_email': { en: 'Please enter your email address.', ar: 'يرجى إدخال بريدك الإلكتروني.' },
  'app.auth.signup_failed': { en: 'Could not create your account. Please try again.', ar: 'تعذّر إنشاء حسابك. حاول مرة أخرى.' },
  'app.auth.reset_failed': { en: 'Could not send the reset link. Please try again.', ar: 'تعذّر إرسال رابط إعادة التعيين. حاول مرة أخرى.' },
  'app.auth.show_password': { en: 'Show password', ar: 'إظهار كلمة المرور' },
  'app.auth.hide_password': { en: 'Hide password', ar: 'إخفاء كلمة المرور' },
  'app.auth.first_name_ph': { en: 'Alex', ar: 'أحمد' },
  'app.auth.last_name_ph': { en: 'Johnson', ar: 'العلي' },

  // Chat
  'app.chat.unknown_user': { en: 'Unknown', ar: 'غير معروف' },
  'app.chat.start_failed': { en: 'Failed to start chat. {reason}', ar: 'تعذّر بدء المحادثة. {reason}' },
  'app.chat.start_failed_impersonating': { en: 'This action is disabled while impersonating another user.', ar: 'هذا الإجراء معطّل أثناء التصفّح بحساب مستخدم آخر.' },
  'app.chat.attachment_alt': { en: 'Attachment', ar: 'مرفق' },
  'app.chat.attach_file': { en: 'Attach a photo or video', ar: 'إرفاق صورة أو فيديو' },
  'app.chat.back_to_inbox': { en: 'Back to inbox', ar: 'العودة إلى الصندوق الوارد' },

  // App shell (impersonation banner, language toggle)
  'app.shell.viewing_as': { en: 'Viewing as', ar: 'تتصفّح بحساب' },
  'app.shell.exit_session': { en: 'Exit Session', ar: 'إنهاء الجلسة' },
  'app.shell.toggle_language': { en: 'Toggle language', ar: 'تغيير اللغة' },

  // Error boundary
  'app.error.title': { en: 'Something went wrong', ar: 'حدث خطأ ما' },
  'app.error.body': { en: 'This screen hit an error. Your progress is saved — try again, or head back home.', ar: 'واجهت هذه الشاشة خطأً. تقدّمك محفوظ — حاول مجدداً أو عُد إلى الرئيسية.' },
  'app.error.try_again': { en: 'Try again', ar: 'حاول مجدداً' },
} as const;
