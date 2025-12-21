import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";

interface SidebarLink {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
}

interface MobileSidebarProps {
  links: SidebarLink[];
  onSignOut: () => void;
  userInfo?: {
    name: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBgClass?: string;
    iconClass?: string;
  };
}

const MobileSidebar = ({ links, onSignOut, userInfo }: MobileSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === location.pathname) return true;
    // Check if it's a dashboard subpage
    if (href !== "/" && location.pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden fixed bottom-4 left-4 z-40 shadow-lg rounded-full w-12 h-12">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full bg-card">
          {userInfo && (
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userInfo.iconBgClass || "bg-primary/10"}`}>
                <userInfo.icon className={`w-5 h-5 ${userInfo.iconClass || "text-primary"}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{userInfo.name}</p>
                <p className="text-xs text-muted-foreground">{userInfo.subtitle}</p>
              </div>
            </div>
          )}

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-border">
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
