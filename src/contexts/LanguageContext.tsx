import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type Language = "en" | "ur";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  "nav.home": { en: "Home", ur: "ہوم" },
  "nav.services": { en: "Services", ur: "خدمات" },
  "nav.howItWorks": { en: "How It Works", ur: "یہ کیسے کام کرتا ہے" },
  "nav.becomeProvider": { en: "Become a Provider", ur: "فراہم کنندہ بنیں" },
  "nav.findServices": { en: "Find Services", ur: "خدمات تلاش کریں" },
  "nav.aiAnalyzer": { en: "AI Analyzer", ur: "AI تجزیہ کار" },
  "nav.myBookings": { en: "My Bookings", ur: "میری بکنگز" },
  "nav.dashboard": { en: "Dashboard", ur: "ڈیش بورڈ" },
  "nav.myProfile": { en: "My Profile", ur: "میری پروفائل" },
  "nav.adminPanel": { en: "Admin Panel", ur: "ایڈمن پینل" },
  "nav.signIn": { en: "Sign In", ur: "سائن ان" },
  "nav.signUp": { en: "Sign Up", ur: "سائن اپ" },
  "nav.signOut": { en: "Sign Out", ur: "سائن آؤٹ" },
  "nav.account": { en: "Account", ur: "اکاؤنٹ" },

  // Hero Section
  "hero.title": { en: "Your Home Repairs, Simplified", ur: "آپ کی گھریلو مرمت، آسان" },
  "hero.subtitle": { en: "Connect with verified local professionals for all your home repair and maintenance needs. Book instantly, pay securely, and enjoy peace of mind.", ur: "اپنی تمام گھریلو مرمت اور دیکھ بھال کی ضروریات کے لیے مقامی ماہرین سے رابطہ کریں۔ فوری بک کریں، محفوظ ادائیگی کریں۔" },
  "hero.searchPlaceholder": { en: "What service do you need?", ur: "آپ کو کون سی خدمت چاہیے؟" },
  "hero.cta": { en: "Find Services", ur: "خدمات تلاش کریں" },
  "hero.popular": { en: "Popular:", ur: "مقبول:" },
  "hero.trusted": { en: "Trusted by", ur: "اعتماد کردہ" },
  "hero.yourCity": { en: "Your city", ur: "آپ کا شہر" },

  // Customer Home
  "customer.welcome": { en: "Welcome back", ur: "خوش آمدید" },
  "customer.whatService": { en: "What service do you need today?", ur: "آج آپ کو کون سی خدمت چاہیے؟" },
  "customer.searchPlaceholder": { en: "Search for services (e.g., plumbing, cleaning...)", ur: "خدمات تلاش کریں (مثلاً پلمبنگ، صفائی...)" },
  "customer.browseServices": { en: "Browse Services", ur: "خدمات دیکھیں" },
  "customer.myBookings": { en: "My Bookings", ur: "میری بکنگز" },
  "customer.myProfile": { en: "My Profile", ur: "میری پروفائل" },
  "customer.howItWorks": { en: "How It Works", ur: "یہ کیسے کام کرتا ہے" },
  "customer.upcomingBookings": { en: "Upcoming Bookings", ur: "آنے والی بکنگز" },
  "customer.viewAll": { en: "View all", ur: "سب دیکھیں" },
  "customer.details": { en: "Details", ur: "تفصیلات" },
  "customer.needService": { en: "Need a Specific Service?", ur: "کسی مخصوص خدمت کی ضرورت ہے؟" },
  "customer.exploreServices": { en: "Explore Services", ur: "خدمات دریافت کریں" },
  "customer.favorites": { en: "My Favorites", ur: "میرے پسندیدہ" },
  "customer.noFavorites": { en: "No favorites yet", ur: "ابھی تک کوئی پسندیدہ نہیں" },
  "customer.referrals": { en: "Referrals", ur: "ریفرلز" },

  // Services Page
  "services.findProviders": { en: "Find Service Providers", ur: "خدمات فراہم کنندگان تلاش کریں" },
  "services.providersFound": { en: "providers found", ur: "فراہم کنندگان ملے" },
  "services.bookNow": { en: "Book Now", ur: "ابھی بک کریں" },
  "services.jobs": { en: "jobs", ur: "کام" },
  "services.reviews": { en: "reviews", ur: "جائزے" },
  "services.clearFilters": { en: "Clear Filters", ur: "فلٹرز صاف کریں" },
  "services.noProviders": { en: "No providers found matching your criteria.", ur: "آپ کے معیار سے مطابقت رکھنے والے فراہم کنندگان نہیں ملے۔" },
  "services.viewProfile": { en: "View Profile", ur: "پروفائل دیکھیں" },
  "services.allServices": { en: "All Services", ur: "تمام خدمات" },
  "services.ourServices": { en: "Our Services", ur: "ہماری خدمات" },
  "services.professionalServices": { en: "Professional Services for Every Need", ur: "ہر ضرورت کے لیے پیشہ ورانہ خدمات" },
  "services.viewAllServices": { en: "View all services", ur: "تمام خدمات دیکھیں" },

  // Provider Detail
  "provider.about": { en: "About", ur: "تعارف" },
  "provider.skills": { en: "Skills", ur: "مہارتیں" },
  "provider.servicesOffered": { en: "Services Offered", ur: "پیش کردہ خدمات" },
  "provider.reviews": { en: "Reviews", ur: "جائزے" },
  "provider.location": { en: "Location", ur: "مقام" },
  "provider.whyChooseUs": { en: "Why Choose Us", ur: "ہمیں کیوں چنیں" },
  "provider.verified": { en: "Verified Provider", ur: "تصدیق شدہ فراہم کنندہ" },
  "provider.experience": { en: "Years Experience", ur: "سال کا تجربہ" },
  "provider.jobsCompleted": { en: "Jobs Completed", ur: "مکمل کام" },
  "provider.message": { en: "Message", ur: "پیغام" },
  "provider.addToFavorites": { en: "Add to Favorites", ur: "پسندیدہ میں شامل کریں" },
  "provider.removeFromFavorites": { en: "Remove from Favorites", ur: "پسندیدہ سے ہٹائیں" },

  // Booking
  "booking.title": { en: "Book a Service", ur: "خدمت بک کریں" },
  "booking.selectService": { en: "Select Service", ur: "خدمت منتخب کریں" },
  "booking.selectDate": { en: "Select Date", ur: "تاریخ منتخب کریں" },
  "booking.selectTime": { en: "Select Time", ur: "وقت منتخب کریں" },
  "booking.yourAddress": { en: "Your Address", ur: "آپ کا پتہ" },
  "booking.notes": { en: "Work Description / Notes", ur: "کام کی تفصیل / نوٹس" },
  "booking.confirm": { en: "Confirm Booking", ur: "بکنگ کی تصدیق کریں" },
  "booking.submitting": { en: "Submitting...", ur: "جمع ہو رہا ہے..." },

  // Settings
  "settings.title": { en: "Settings", ur: "ترتیبات" },
  "settings.managePreferences": { en: "Manage your account preferences", ur: "اپنی اکاؤنٹ کی ترجیحات کا انتظام کریں" },
  "settings.notifications": { en: "Notifications", ur: "اطلاعات" },
  "settings.emailNotifications": { en: "Email Notifications", ur: "ای میل اطلاعات" },
  "settings.pushNotifications": { en: "Push Notifications", ur: "پش اطلاعات" },
  "settings.changePassword": { en: "Change Password", ur: "پاس ورڈ تبدیل کریں" },
  "settings.accountInfo": { en: "Account Information", ur: "اکاؤنٹ کی معلومات" },
  "settings.dangerZone": { en: "Danger Zone", ur: "خطرناک زون" },
  "settings.deleteAccount": { en: "Delete Account", ur: "اکاؤنٹ حذف کریں" },
  "settings.language": { en: "Language", ur: "زبان" },
  "settings.appearance": { en: "Appearance", ur: "ظاہری شکل" },

  // Common
  "common.loading": { en: "Loading...", ur: "لوڈ ہو رہا ہے..." },
  "common.error": { en: "Error", ur: "خرابی" },
  "common.success": { en: "Success", ur: "کامیابی" },
  "common.cancel": { en: "Cancel", ur: "منسوخ" },
  "common.save": { en: "Save", ur: "محفوظ کریں" },
  "common.confirm": { en: "Confirm", ur: "تصدیق" },
  "common.back": { en: "Back", ur: "واپس" },

  // Footer
  "footer.description": { en: "Your trusted platform for on-demand home repair and maintenance services. Connect with verified local professionals today.", ur: "گھریلو مرمت اور دیکھ بھال کی خدمات کے لیے آپ کا قابل اعتماد پلیٹ فارم۔ آج ہی تصدیق شدہ مقامی ماہرین سے رابطہ کریں۔" },
  "footer.company": { en: "Company", ur: "کمپنی" },
  "footer.support": { en: "Support", ur: "سپورٹ" },
  "footer.services": { en: "Services", ur: "خدمات" },
  "footer.rights": { en: "All rights reserved.", ur: "تمام حقوق محفوظ ہیں۔" },
  "footer.aboutUs": { en: "About Us", ur: "ہمارے بارے میں" },
  "footer.careers": { en: "Careers", ur: "ملازمتیں" },
  "footer.press": { en: "Press", ur: "پریس" },
  "footer.blog": { en: "Blog", ur: "بلاگ" },
  "footer.helpCenter": { en: "Help Center", ur: "مدد مرکز" },
  "footer.safety": { en: "Safety", ur: "حفاظت" },
  "footer.terms": { en: "Terms of Service", ur: "شرائط و ضوابط" },
  "footer.privacy": { en: "Privacy Policy", ur: "رازداری کی پالیسی" },

  // Featured Providers
  "featured.title": { en: "Featured Service Providers", ur: "نمایاں فراہم کنندگان" },
  "featured.subtitle": { en: "Discover our highest-rated professionals, trusted by homeowners.", ur: "ہمارے اعلیٰ درجے کے ماہرین دریافت کریں۔" },
  "featured.topRated": { en: "Top Rated", ur: "اعلیٰ درجہ" },
  "featured.viewAll": { en: "View All Providers", ur: "تمام فراہم کنندگان دیکھیں" },
  "featured.jobsCompleted": { en: "jobs completed", ur: "مکمل کام" },

  // How It Works
  "howItWorks.title": { en: "How It Works", ur: "یہ کیسے کام کرتا ہے" },
  "howItWorks.subtitle": { en: "Get Your Home Fixed in 4 Easy Steps", ur: "4 آسان مراحل میں اپنا گھر ٹھیک کروائیں" },
  "howItWorks.description": { en: "From finding the right professional to getting the job done, we've made the entire process simple and hassle-free.", ur: "صحیح ماہر تلاش کرنے سے لے کر کام مکمل ہونے تک، ہم نے پورا عمل آسان بنا دیا ہے۔" },
  "howItWorks.step1": { en: "Search & Browse", ur: "تلاش اور براؤز کریں" },
  "howItWorks.step1Desc": { en: "Find the perfect service provider by browsing categories, reading reviews, and comparing prices.", ur: "زمرے دیکھ کر، جائزے پڑھ کر اور قیمتوں کا موازنہ کر کے بہترین فراہم کنندہ تلاش کریں۔" },
  "howItWorks.step2": { en: "Book Appointment", ur: "اپائنٹمنٹ بک کریں" },
  "howItWorks.step2Desc": { en: "Select your preferred date and time. Our providers offer flexible scheduling to fit your needs.", ur: "اپنی پسندیدہ تاریخ اور وقت منتخب کریں۔ ہمارے فراہم کنندگان لچکدار شیڈولنگ پیش کرتے ہیں۔" },
  "howItWorks.step3": { en: "Secure Payment", ur: "محفوظ ادائیگی" },
  "howItWorks.step3Desc": { en: "Pay securely through our platform. Your payment is protected until the job is completed.", ur: "ہمارے پلیٹ فارم کے ذریعے محفوظ ادائیگی کریں۔ آپ کی ادائیگی کام مکمل ہونے تک محفوظ ہے۔" },
  "howItWorks.step4": { en: "Rate & Review", ur: "درجہ بندی اور جائزہ" },
  "howItWorks.step4Desc": { en: "Share your experience to help others find great service providers in your area.", ur: "اپنا تجربہ شیئر کریں تاکہ دوسروں کو آپ کے علاقے میں اچھے فراہم کنندگان ملیں۔" },

  // How It Works Page
  "howItWorksPage.heroTitle": { en: "Home Repairs Made Simple", ur: "گھریلو مرمت آسان ہو گئی" },
  "howItWorksPage.heroSubtitle": { en: "We've simplified the process of finding and booking reliable home repair services. Here's how Fixora works.", ur: "ہم نے قابل اعتماد گھریلو مرمت کی خدمات تلاش کرنے اور بک کرنے کے عمل کو آسان بنا دیا ہے۔" },
  "howItWorksPage.whyChoose": { en: "Why Choose Us", ur: "ہمیں کیوں چنیں" },
  "howItWorksPage.advantage": { en: "The Fixora Advantage", ur: "Fixora کا فائدہ" },
  "howItWorksPage.advantageDesc": { en: "We're committed to providing the best experience for both homeowners and service providers.", ur: "ہم گھر مالکان اور فراہم کنندگان دونوں کو بہترین تجربہ فراہم کرنے کے لیے پرعزم ہیں۔" },
  "howItWorksPage.verified": { en: "Verified Professionals", ur: "تصدیق شدہ ماہرین" },
  "howItWorksPage.verifiedDesc": { en: "All service providers go through a rigorous verification process including background checks and skill assessments.", ur: "تمام فراہم کنندگان سخت تصدیقی عمل سے گزرتے ہیں۔" },
  "howItWorksPage.fastResponse": { en: "Fast Response", ur: "تیز جواب" },
  "howItWorksPage.fastResponseDesc": { en: "Get connected with available providers quickly. Most bookings are confirmed within 30 minutes.", ur: "دستیاب فراہم کنندگان سے جلدی رابطہ ہوں۔ زیادہ تر بکنگ 30 منٹ میں تصدیق ہو جاتی ہے۔" },
  "howItWorksPage.securePayments": { en: "Secure Payments", ur: "محفوظ ادائیگیاں" },
  "howItWorksPage.securePaymentsDesc": { en: "Your payments are protected. Pay securely through our platform and only release funds when satisfied.", ur: "آپ کی ادائیگیاں محفوظ ہیں۔ مطمئن ہونے پر ہی رقم جاری کریں۔" },
  "howItWorksPage.qualityGuaranteed": { en: "Quality Guaranteed", ur: "معیار کی ضمانت" },
  "howItWorksPage.qualityGuaranteedDesc": { en: "Not satisfied? We'll work with you to make it right or provide a full refund.", ur: "مطمئن نہیں؟ ہم آپ کے ساتھ مل کر ٹھیک کریں گے یا مکمل واپسی فراہم کریں گے۔" },
  "howItWorksPage.transparentPricing": { en: "Transparent Pricing", ur: "شفاف قیمتیں" },
  "howItWorksPage.transparentPricingDesc": { en: "No hidden fees or surprises. Get upfront quotes before booking any service.", ur: "کوئی چھپی فیسیں نہیں۔ بکنگ سے پہلے واضح قیمت حاصل کریں۔" },
  "howItWorksPage.support247": { en: "24/7 Support", ur: "24/7 سپورٹ" },
  "howItWorksPage.support247Desc": { en: "Our customer support team is available around the clock to help with any questions or concerns.", ur: "ہماری سپورٹ ٹیم آپ کی مدد کے لیے 24 گھنٹے دستیاب ہے۔" },

  // CTA
  "cta.title": { en: "Ready to Get Your Home Fixed?", ur: "اپنا گھر ٹھیک کرانے کے لیے تیار ہیں؟" },
  "cta.subtitle": { en: "Join thousands of satisfied homeowners who trust Fixora for all their home repair and maintenance needs.", ur: "ہزاروں مطمئن گھر مالکان میں شامل ہوں جو Fixora پر بھروسہ کرتے ہیں۔" },
  "cta.findProvider": { en: "Find a Service Provider", ur: "فراہم کنندہ تلاش کریں" },
  "cta.becomeProvider": { en: "Become a Provider", ur: "فراہم کنندہ بنیں" },
  "cta.verifiedPros": { en: "100% Verified Professionals", ur: "100% تصدیق شدہ ماہرین" },
  "cta.quickResponse": { en: "Quick Response Time", ur: "تیز جوابی وقت" },
  "cta.securePayments": { en: "Secure Payments", ur: "محفوظ ادائیگیاں" },

  // Service Categories
  "category.plumbing": { en: "Plumbing", ur: "پلمبنگ" },
  "category.plumbingDesc": { en: "Leak repairs, pipe installation, drain cleaning & more", ur: "لیک کی مرمت، پائپ کی تنصیب، نالی کی صفائی اور مزید" },
  "category.electrical": { en: "Electrical", ur: "الیکٹریکل" },
  "category.electricalDesc": { en: "Wiring, installations, repairs & safety inspections", ur: "وائرنگ، تنصیبات، مرمت اور حفاظتی معائنے" },
  "category.hvac": { en: "HVAC", ur: "HVAC" },
  "category.hvacDesc": { en: "AC repair, heating systems, duct cleaning & maintenance", ur: "AC مرمت، ہیٹنگ، ڈکٹ صفائی اور دیکھ بھال" },
  "category.carpentry": { en: "Carpentry", ur: "بڑھئی" },
  "category.carpentryDesc": { en: "Furniture repair, custom woodwork & installations", ur: "فرنیچر مرمت، اپنی مرضی کا لکڑی کا کام" },
  "category.painting": { en: "Painting", ur: "پینٹنگ" },
  "category.paintingDesc": { en: "Interior & exterior painting, wallpaper & finishing", ur: "اندرونی اور بیرونی پینٹنگ، وال پیپر" },
  "category.appliances": { en: "Appliances", ur: "آلات" },
  "category.appliancesDesc": { en: "Repair & maintenance for all home appliances", ur: "تمام گھریلو آلات کی مرمت اور دیکھ بھال" },
  "category.handyman": { en: "Handyman", ur: "ہینڈی مین" },
  "category.handymanDesc": { en: "General repairs, assembly & odd jobs around the house", ur: "عمومی مرمت، اسمبلی اور گھر کے مختلف کام" },
  "category.landscaping": { en: "Landscaping", ur: "لینڈ اسکیپنگ" },
  "category.landscapingDesc": { en: "Garden maintenance, lawn care & outdoor projects", ur: "باغ کی دیکھ بھال، لان کیئر اور بیرونی منصوبے" },
  "category.browseServices": { en: "Browse services", ur: "خدمات دیکھیں" },

  // AI Analyzer
  "ai.title": { en: "🔍 AI Issue Analyzer", ur: "🔍 AI مسئلہ تجزیہ کار" },
  "ai.subtitle": { en: "Upload a photo of your home maintenance issue and get instant AI-powered analysis", ur: "اپنے گھر کے مسئلے کی تصویر اپ لوڈ کریں اور فوری AI تجزیہ حاصل کریں" },
  "ai.loginRequired": { en: "Please log in to use the AI Analyzer.", ur: "AI تجزیہ کار استعمال کرنے کے لیے لاگ ان کریں۔" },
  "ai.uploadPhoto": { en: "Upload Issue Photo", ur: "مسئلے کی تصویر اپ لوڈ کریں" },
  "ai.uploadDesc": { en: "Take or upload a clear photo of the issue for best results", ur: "بہترین نتائج کے لیے مسئلے کی واضح تصویر لیں" },
  "ai.clickUpload": { en: "Click to upload or take a photo", ur: "اپ لوڈ کرنے یا تصویر لینے کے لیے کلک کریں" },
  "ai.changePhoto": { en: "Change Photo", ur: "تصویر تبدیل کریں" },
  "ai.analyze": { en: "Analyze Issue", ur: "مسئلے کا تجزیہ کریں" },
  "ai.analyzing": { en: "Analyzing...", ur: "تجزیہ ہو رہا ہے..." },
  "ai.aiAnalyzing": { en: "AI is analyzing your issue...", ur: "AI آپ کے مسئلے کا تجزیہ کر رہا ہے..." },

  // Login / Register
  "auth.login": { en: "Log In", ur: "لاگ ان" },
  "auth.register": { en: "Register", ur: "رجسٹر" },
  "auth.email": { en: "Email", ur: "ای میل" },
  "auth.password": { en: "Password", ur: "پاس ورڈ" },
  "auth.name": { en: "Full Name", ur: "پورا نام" },
  "auth.phone": { en: "Phone Number", ur: "فون نمبر" },
  "auth.forgotPassword": { en: "Forgot Password?", ur: "پاس ورڈ بھول گئے؟" },
  "auth.noAccount": { en: "Don't have an account?", ur: "اکاؤنٹ نہیں ہے؟" },
  "auth.haveAccount": { en: "Already have an account?", ur: "پہلے سے اکاؤنٹ ہے؟" },

  // Dashboard
  "dashboard.welcome": { en: "Welcome back", ur: "خوش آمدید" },
  "dashboard.overview": { en: "Here's an overview of your recent activity and upcoming bookings.", ur: "یہ آپ کی حالیہ سرگرمی اور آنے والی بکنگز کا جائزہ ہے۔" },
  "dashboard.totalBookings": { en: "Total Bookings", ur: "کل بکنگز" },
  "dashboard.upcoming": { en: "Upcoming", ur: "آنے والی" },
  "dashboard.totalSpent": { en: "Total Spent", ur: "کل خرچ" },
  "dashboard.myBookings": { en: "My Bookings", ur: "میری بکنگز" },
  "dashboard.past": { en: "Past", ur: "پچھلی" },
  "dashboard.messages": { en: "Messages", ur: "پیغامات" },
  "dashboard.payments": { en: "Payments", ur: "ادائیگیاں" },
  "dashboard.notifications": { en: "Notifications", ur: "اطلاعات" },
  "dashboard.profile": { en: "Profile", ur: "پروفائل" },
  "dashboard.settings": { en: "Settings", ur: "ترتیبات" },

  // Provider Dashboard
  "providerDash.pending": { en: "Pending", ur: "زیر التوا" },
  "providerDash.earnings": { en: "Earnings", ur: "آمدنی" },
  "providerDash.rating": { en: "Rating", ur: "درجہ بندی" },
  "providerDash.yourServices": { en: "Your Services", ur: "آپ کی خدمات" },
  "providerDash.addService": { en: "Add Service", ur: "خدمت شامل کریں" },
  "providerDash.bookings": { en: "Bookings", ur: "بکنگز" },
  "providerDash.accept": { en: "Accept", ur: "قبول" },
  "providerDash.decline": { en: "Decline", ur: "مسترد" },
  "providerDash.startJob": { en: "Start Job", ur: "کام شروع کریں" },
  "providerDash.complete": { en: "Complete", ur: "مکمل" },
  "providerDash.accountReview": { en: "Account Under Review", ur: "اکاؤنٹ زیر جائزہ" },
  "providerDash.reviewMessage": { en: "Your provider application is currently being reviewed by the admin team. You'll be notified once your account is approved.", ur: "آپ کی درخواست فی الحال ایڈمن ٹیم کے جائزے میں ہے۔ اکاؤنٹ منظور ہونے پر آپ کو مطلع کیا جائے گا۔" },

  // Support Chat
  "support.title": { en: "Support Chat", ur: "سپورٹ چیٹ" },
  "support.chatAdmin": { en: "Chat with admin", ur: "ایڈمن سے چیٹ کریں" },
  "support.placeholder": { en: "Type a message...", ur: "پیغام ٹائپ کریں..." },
  "support.noMessages": { en: "Send a message to get help from the admin team.", ur: "ایڈمن ٹیم سے مدد حاصل کرنے کے لیے پیغام بھیجیں۔" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("fixora-lang") as Language) || "en";
    }
    return "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("fixora-lang", lang);
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, []);

  // Set initial dir
  if (typeof window !== "undefined") {
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }

  const t = useCallback((key: string): string => {
    return translations[key]?.[language] || key;
  }, [language]);

  const dir = language === "ur" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
