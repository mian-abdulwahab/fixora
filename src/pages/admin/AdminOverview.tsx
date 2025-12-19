import { Users, Briefcase, Calendar, FolderTree, DollarSign, TrendingUp, Clock } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdmin";
import { Link } from "react-router-dom";

const AdminOverview: React.FC = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "Approved Providers", value: stats?.totalProviders || 0, icon: Briefcase, color: "text-emerald-600 bg-emerald-100" },
    { label: "Pending Applications", value: stats?.pendingApplications || 0, icon: Clock, color: "text-amber-600 bg-amber-100", highlight: (stats?.pendingApplications || 0) > 0 },
    { label: "Total Bookings", value: stats?.totalBookings || 0, icon: Calendar, color: "text-purple-600 bg-purple-100" },
    { label: "Total Revenue", value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-primary bg-primary/10" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to the admin panel. Here's a summary of your platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className={`bg-card rounded-xl shadow-card p-5 ${stat.highlight ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm">{stat.label}</span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            {stat.highlight && stat.label === "Pending Applications" && (
              <Link to="/admin/providers" className="text-xs text-amber-600 hover:underline mt-1 block">
                Review now →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <a href="/admin/providers" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <p className="font-medium text-foreground">Review pending providers</p>
              <p className="text-sm text-muted-foreground">Approve or reject new provider applications</p>
            </a>
            <a href="/admin/categories" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <p className="font-medium text-foreground">Manage categories</p>
              <p className="text-sm text-muted-foreground">Add, edit, or remove service categories</p>
            </a>
            <a href="/admin/bookings" className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <p className="font-medium text-foreground">View all bookings</p>
              <p className="text-sm text-muted-foreground">Monitor and manage platform bookings</p>
            </a>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Platform Status</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Providers</span>
              <span className="font-medium text-foreground">{stats?.totalProviders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registered Users</span>
              <span className="font-medium text-foreground">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Service Categories</span>
              <span className="font-medium text-foreground">{stats?.totalCategories || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Transactions</span>
              <span className="font-medium text-foreground">{stats?.totalBookings || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
