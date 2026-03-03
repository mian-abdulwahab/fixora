import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Wrench, User, LogIn, LogOut, LayoutDashboard, UserCircle, Heart, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, loading } = useAuth();
  const { t } = useLanguage();

  const getNavLinks = () => {
    if (!user) {
      return [
        { href: "/", label: t("nav.home") },
        { href: "/services", label: t("nav.services") },
        { href: "/how-it-works", label: t("nav.howItWorks") },
        { href: "/register?role=provider", label: t("nav.becomeProvider") },
      ];
    }
    if (userRole === "provider") {
      return [
        { href: "/", label: t("nav.home") },
        { href: "/provider-dashboard", label: t("nav.dashboard") },
        { href: "/provider-dashboard/profile", label: t("nav.myProfile") },
      ];
    }
    if (userRole === "admin") {
      return [
        { href: "/", label: t("nav.home") },
        { href: "/admin", label: t("nav.adminPanel") },
      ];
    }
    return [
      { href: "/", label: t("nav.home") },
      { href: "/dashboard", label: t("nav.dashboard") },
      { href: "/services", label: t("nav.findServices") },
      { href: "/ai-analyzer", label: t("nav.aiAnalyzer") },
    ];
  };

  const navLinks = getNavLinks();
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (userRole === "provider") return "/provider-dashboard";
    if (userRole === "admin") return "/admin";
    return "/dashboard";
  };

  const getProfileLink = () => {
    if (userRole === "provider") return "/provider-dashboard/profile";
    return "/dashboard/profile";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow duration-300">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Fixora</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href.split("?")[0])
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            {loading ? (
              <div className="h-9 w-20 animate-pulse bg-muted rounded-lg" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {user.user_metadata?.name?.split(" ")[0] || t("nav.account")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()} className="flex items-center cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  {userRole !== "admin" && (
                    <DropdownMenuItem asChild>
                      <Link to={getProfileLink()} className="flex items-center cursor-pointer">
                        <UserCircle className="w-4 h-4 mr-2" />
                        {t("nav.myProfile")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {userRole === "user" && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/favorites" className="flex items-center cursor-pointer">
                        <Heart className="w-4 h-4 mr-2" />
                        {t("customer.favorites")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {userRole === "user" && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/referrals" className="flex items-center cursor-pointer">
                        <Gift className="w-4 h-4 mr-2" />
                        Referral Program
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">
                    <LogIn className="w-4 h-4 mr-1" />
                    {t("nav.signIn")}
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">
                    <User className="w-4 h-4 mr-1" />
                    {t("nav.signUp")}
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <button
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-down">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive(link.href.split("?")[0])
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user && userRole === "user" && (
                <Link
                  to="/dashboard/favorites"
                  className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Heart className="w-4 h-4" /> {t("customer.favorites")}
                </Link>
              )}
              <div className="flex gap-3 mt-4 px-4">
                {user ? (
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.signOut")}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>{t("nav.signIn")}</Link>
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)}>{t("nav.signUp")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
