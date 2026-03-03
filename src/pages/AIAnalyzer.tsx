import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useCustomerCity } from "@/hooks/useCustomerCity";
import {
  Camera,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  DollarSign,
  Clock,
  ShieldAlert,
  Lightbulb,
  Star,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

interface AnalysisResult {
  issue_title: string;
  description: string;
  damage_level: "low" | "medium" | "high" | "critical";
  damage_percentage: number;
  diy_solution: {
    difficulty: "easy" | "moderate" | "hard";
    steps: string[];
    tools_needed: string[];
    estimated_time: string;
  };
  professional_repair: {
    estimated_cost_pkr_min: number;
    estimated_cost_pkr_max: number;
    service_type: string;
    urgency: "can wait" | "soon" | "immediate";
  };
  safety_warnings: string[];
  recommendation: string;
}

const AIAnalyzer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { customerCity } = useCustomerCity();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Fetch recommended providers based on analysis result & customer city
  const { data: recommendedProviders = [] } = useQuery({
    queryKey: ["ai-recommended-providers", result?.professional_repair?.service_type, customerCity],
    queryFn: async () => {
      if (!result?.professional_repair?.service_type) return [];
      let query = supabase
        .from("service_providers")
        .select("id, business_name, rating, total_reviews, total_jobs, verified, location, avatar_url")
        .eq("is_active", true)
        .eq("verified", true)
        .order("rating", { ascending: false })
        .limit(3);

      if (customerCity) {
        query = query.ilike("location", `%${customerCity}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!result?.professional_repair?.service_type,
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!selectedImage || !user) return;
    setIsAnalyzing(true);
    try {
      const base64 = selectedImage.split(",")[1];
      const ext = selectedImage.split(";")[0].split("/")[1] || "jpg";
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from("issue-images")
        .upload(fileName, byteArray, { contentType: `image/${ext}` });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("issue-images").getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      const { data, error } = await supabase.functions.invoke("analyze-issue", {
        body: { imageUrl },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Analysis failed", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDamageColor = (level: string) => {
    switch (level) {
      case "low": return "bg-emerald-500";
      case "medium": return "bg-amber-500";
      case "high": return "bg-orange-500";
      case "critical": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getDamageBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case "critical": case "high": return "destructive";
      default: return "secondary";
    }
  };

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case "immediate": return "text-destructive font-bold";
      case "soon": return "text-amber-600 font-semibold";
      default: return "text-emerald-600";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 md:pt-28 pb-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">🔍 AI Issue Analyzer</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Upload a photo of your home maintenance issue and get instant AI-powered analysis
            </p>
          </div>

          {!user ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Please log in to use the AI Analyzer.</p>
                <Button asChild><Link to="/login">Log In</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Upload Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Camera className="w-5 h-5" /> Upload Issue Photo</CardTitle>
                  <CardDescription>Take or upload a clear photo of the issue for best results</CardDescription>
                </CardHeader>
                <CardContent>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
                  {selectedImage ? (
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        <img src={selectedImage} alt="Selected issue" className="w-full max-h-72 sm:max-h-96 object-contain bg-muted" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" onClick={() => { setSelectedImage(null); setResult(null); }}>
                          Change Photo
                        </Button>
                        <Button onClick={analyzeImage} disabled={isAnalyzing} className="flex-1">
                          {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Wrench className="w-4 h-4 mr-2" /> Analyze Issue</>}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-xl p-8 sm:p-12 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium text-foreground text-sm sm:text-base">Click to upload or take a photo</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Supports JPG, PNG, WEBP • Max 10MB</p>
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* Loading State */}
              {isAnalyzing && (
                <Card className="mb-6">
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="font-medium text-foreground">AI is analyzing your issue...</p>
                    <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-4">
                  {/* Title & Description */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <CardTitle className="text-lg sm:text-xl">{result.issue_title}</CardTitle>
                        <Badge variant={getDamageBadgeVariant(result.damage_level)} className="capitalize">
                          {result.damage_level} damage
                        </Badge>
                      </div>
                      <CardDescription className="text-sm sm:text-base">{result.description}</CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Damage Meter */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Damage Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Severity</span>
                          <span className="font-semibold">{result.damage_percentage}%</span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                          <div className={`h-full rounded-full transition-all ${getDamageColor(result.damage_level)}`} style={{ width: `${result.damage_percentage}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{result.damage_level} severity level</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* DIY Solution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2"><Wrench className="w-4 h-4" /> DIY Solution</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize">{result.diy_solution.difficulty}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />{result.diy_solution.estimated_time}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Steps:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          {result.diy_solution.steps.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-sm mb-2">Tools Needed:</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.diy_solution.tools_needed.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Professional Repair */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" /> Professional Repair Estimate</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated Cost</p>
                          <p className="text-lg font-bold text-foreground">
                            PKR {result.professional_repair.estimated_cost_pkr_min.toLocaleString()} – {result.professional_repair.estimated_cost_pkr_max.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Service Type</p>
                          <p className="font-semibold">{result.professional_repair.service_type}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Urgency</p>
                        <p className={`capitalize ${getUrgencyColor(result.professional_repair.urgency)}`}>
                          {result.professional_repair.urgency}
                        </p>
                      </div>
                      <Separator />
                      <Button asChild className="w-full">
                        <Link to={`/services?search=${encodeURIComponent(result.professional_repair.service_type)}`}>
                          Find {result.professional_repair.service_type} Providers
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recommended Providers */}
                  {recommendedProviders.length > 0 && (
                    <Card className="border-primary/30">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Recommended Verified Providers {customerCity ? `in ${customerCity}` : ""}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recommendedProviders.map((p: any) => (
                            <Link
                              key={p.id}
                              to={`/provider/${p.id}`}
                              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                {p.avatar_url ? (
                                  <img src={p.avatar_url} alt={p.business_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  p.business_name?.charAt(0) || "P"
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate flex items-center gap-1">
                                  {p.business_name}
                                  {p.verified && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 text-accent fill-accent" />
                                    {Number(p.rating || 0).toFixed(1)}
                                  </span>
                                  <span>• {p.total_jobs || 0} jobs</span>
                                  {p.location && (
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="w-3 h-3" />
                                      {p.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="shrink-0 text-xs">
                                View
                              </Button>
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Safety Warnings */}
                  {result.safety_warnings.length > 0 && (
                    <Card className="border-destructive/30">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-destructive"><ShieldAlert className="w-4 h-4" /> Safety Warnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.safety_warnings.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendation */}
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">AI Recommendation</h4>
                          <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AIAnalyzer;
