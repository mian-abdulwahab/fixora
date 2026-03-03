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
  "hero.title": { en: "Find Trusted Home Service Professionals", ur: "قابل اعتماد گھریلو خدمات کے ماہرین تلاش کریں" },
  "hero.subtitle": { en: "Book verified local experts for plumbing, electrical, HVAC, and more. Get it done right, every time.", ur: "پلمبنگ، الیکٹریکل، HVAC اور مزید کے لیے مقامی ماہرین بک کریں۔ ہر بار صحیح کام کروائیں۔" },
  "hero.searchPlaceholder": { en: "What service do you need?", ur: "آپ کو کون سی خدمت چاہیے؟" },
  "hero.cta": { en: "Search", ur: "تلاش کریں" },

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

  // Services Page
  "services.findProviders": { en: "Find Service Providers", ur: "خدمات فراہم کنندگان تلاش کریں" },
  "services.providersFound": { en: "providers found", ur: "فراہم کنندگان ملے" },
  "services.bookNow": { en: "Book Now", ur: "ابھی بک کریں" },
  "services.jobs": { en: "jobs", ur: "کام" },
  "services.reviews": { en: "reviews", ur: "جائزے" },
  "services.clearFilters": { en: "Clear Filters", ur: "فلٹرز صاف کریں" },
  "services.noProviders": { en: "No providers found matching your criteria.", ur: "آپ کے معیار سے مطابقت رکھنے والے فراہم کنندگان نہیں ملے۔" },

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

  // Featured Providers
  "featured.title": { en: "Featured Providers", ur: "نمایاں فراہم کنندگان" },
  "featured.subtitle": { en: "Top-rated professionals ready to help", ur: "اعلیٰ درجے کے ماہرین مدد کے لیے تیار" },

  // How It Works
  "howItWorks.title": { en: "How It Works", ur: "یہ کیسے کام کرتا ہے" },
  "howItWorks.step1": { en: "Search", ur: "تلاش کریں" },
  "howItWorks.step1Desc": { en: "Find the right service provider for your needs", ur: "اپنی ضروریات کے لیے صحیح فراہم کنندہ تلاش کریں" },
  "howItWorks.step2": { en: "Book", ur: "بک کریں" },
  "howItWorks.step2Desc": { en: "Schedule at your convenience", ur: "اپنی سہولت کے مطابق شیڈول کریں" },
  "howItWorks.step3": { en: "Get it Done", ur: "کام کروائیں" },
  "howItWorks.step3Desc": { en: "Sit back and let the experts handle it", ur: "آرام سے بیٹھیں اور ماہرین کو کام کرنے دیں" },

  // CTA
  "cta.title": { en: "Ready to Get Started?", ur: "شروع کرنے کے لیے تیار ہیں؟" },
  "cta.subtitle": { en: "Join thousands of satisfied customers", ur: "ہزاروں مطمئن صارفین میں شامل ہوں" },
  "cta.provider": { en: "Become a Provider", ur: "فراہم کنندہ بنیں" },
  "cta.customer": { en: "Find a Service", ur: "خدمت تلاش کریں" },
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
