import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  User,
  Settings,
  CreditCard,
  Bell,
  LogOut,
  Home,
  FileText,
  MessageSquare
} from "lucide-react";

const mockBookings = [
  {
    id: "1",
    service: "Leak Repair",
    provider: "Ahmed's Plumbing",
    date: "Dec 20, 2025",
    time: "10:00 AM",
    status: "confirmed",
    price: "$75",
    address: "123 Main Street, Sahiwal",
  },
  {
    id: "2",
    service: "AC Maintenance",
    provider: "CoolBreeze HVAC",
    date: "Dec 25, 2025",
    time: "02:00 PM",
    status: "pending",
    price: "$120",
    address: "456 Oak Avenue, Sahiwal",
  },
  {
    id: "3",
    service: "Electrical Wiring",
    provider: "PowerFix Electrical",
    date: "Dec 15, 2025",
    time: "11:00 AM",
    status: "completed",
    price: "$200",
    address: "789 Pine Road, Sahiwal",
  },
];

const sidebarLinks = [
  { icon: Home, label: "Dashboard", href: "/dashboard", active: true },
  { icon: Calendar, label: "My Bookings", href: "/dashboard/bookings" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
  { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-primary/10 text-primary";
      case "pending":
        return "bg-accent/10 text-accent";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "cancelled":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const upcomingBookings = mockBookings.filter(b => b.status !== "completed");
  const pastBookings = mockBookings.filter(b => b.status === "completed");

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <div className="pt-20 md:pt-24 flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-6rem)] bg-card border-r border-border p-4">
          <div className="flex items-center gap-3 p-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Abdul Wahab</p>
              <p className="text-sm text-muted-foreground">Customer</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  link.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </nav>

          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-4">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Welcome back, Abdul! 👋
              </h1>
              <p className="text-muted-foreground">
                Here's an overview of your recent activity and upcoming bookings.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-card rounded-xl shadow-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Total Bookings</span>
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
              <div className="bg-card rounded-xl shadow-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Upcoming</span>
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
              <div className="bg-card rounded-xl shadow-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Total Spent</span>
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-foreground">$845</p>
              </div>
            </div>

            {/* Bookings */}
            <div className="bg-card rounded-2xl shadow-card">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">My Bookings</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab("upcoming")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "upcoming"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setActiveTab("past")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "past"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      Past
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {(activeTab === "upcoming" ? upcomingBookings : pastBookings).map((booking) => (
                  <div key={booking.id} className="p-6 hover:bg-secondary/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{booking.service}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">{booking.provider}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.address}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-foreground">{booking.price}</span>
                        <Button variant="outline" size="sm">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {(activeTab === "upcoming" ? upcomingBookings : pastBookings).length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-muted-foreground mb-4">No {activeTab} bookings found.</p>
                    <Button asChild>
                      <Link to="/services">Browse Services</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {activeTab === "past" && pastBookings.length > 0 && (
              <div className="mt-8 bg-card rounded-2xl shadow-card p-6">
                <h3 className="font-semibold text-foreground mb-4">Rate Your Experience</h3>
                <div className="flex items-center gap-4">
                  <p className="text-muted-foreground text-sm">
                    How was your experience with {pastBookings[0].provider}?
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} className="p-1 hover:scale-110 transition-transform">
                        <Star className="w-6 h-6 text-muted hover:text-accent hover:fill-accent" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
