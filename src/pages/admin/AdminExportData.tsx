import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const TABLES = [
  "profiles",
  "service_providers",
  "service_categories",
  "services",
  "bookings",
  "booking_status_history",
  "reviews",
  "messages",
  "notifications",
  "favorites",
  "disputes",
  "provider_categories",
  "provider_availability",
  "provider_portfolios",
  "blocked_dates",
  "user_roles",
  "referral_codes",
  "referrals",
  "referral_credits",
] as const;

function toCsv(data: Record<string, unknown>[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const AdminExportData = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  const exportTable = async (table: string) => {
    setLoading(table);
    try {
      const { data, error } = await supabase.from(table as any).select("*");
      if (error) throw error;
      if (!data?.length) {
        toast.info(`${table} is empty`);
        setLoading(null);
        return;
      }
      const csv = toCsv(data as unknown as Record<string, unknown>[]);
      downloadFile(`${table}.csv`, csv);
      toast.success(`${table}.csv downloaded`);
    } catch (e: any) {
      toast.error(`Failed to export ${table}: ${e.message}`);
    }
    setLoading(null);
  };

  const exportAll = async () => {
    setLoadingAll(true);
    for (const table of TABLES) {
      try {
        const { data, error } = await supabase.from(table as any).select("*");
        if (error || !data?.length) continue;
        const csv = toCsv(data as Record<string, unknown>[]);
        downloadFile(`${table}.csv`, csv);
      } catch {}
    }
    toast.success("All tables exported!");
    setLoadingAll(false);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Export Database</h1>
          <p className="text-muted-foreground">Download CSV files for each table to import elsewhere.</p>
        </div>
        <Button onClick={exportAll} disabled={loadingAll} size="lg">
          {loadingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Export All Tables
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TABLES.map(table => (
          <Card key={table}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{table}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTable(table)}
                disabled={loading === table}
                className="w-full"
              >
                {loading === table ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminExportData;
