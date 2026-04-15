"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ArrowLeft, Globe, GlobeOff, Hammer, Mail, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { buildDefaultEmail } from "@/lib/email-template";

export type Business = {
  id: number;
  name: string;
  industry: string;
  location: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  hasWebsite: boolean;
};

export function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialIndustry = searchParams.get("industry") || "";
  const initialLocation = searchParams.get("location") || "";

  const [industry, setIndustry] = React.useState(initialIndustry);
  const [location, setLocation] = React.useState(initialLocation);
  const [businesses, setBusinesses] = React.useState<Business[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "no-website" | "has-website">("all");
  const [generatedSites, setGeneratedSites] = React.useState<Record<number, string>>({});
  const [buildingId, setBuildingId] = React.useState<number | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [activeBusiness, setActiveBusiness] = React.useState<Business | null>(null);
  const [emailTo, setEmailTo] = React.useState("");
  const [emailSubject, setEmailSubject] = React.useState("");
  const [emailBody, setEmailBody] = React.useState("");
  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [findingEmailIds, setFindingEmailIds] = React.useState<number[]>([]);

  const fetchBusinesses = async (ind: string, loc: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?industry=${encodeURIComponent(ind)}&location=${encodeURIComponent(loc)}`);
      const data = await res.json();
      if (data.businesses) {
        setBusinesses(data.businesses);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to search businesses");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialIndustry && initialLocation) {
      fetchBusinesses(initialIndustry, initialLocation);
    }
  }, [initialIndustry, initialLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim() || !location.trim()) return;
    router.push(`/search?industry=${encodeURIComponent(industry)}&location=${encodeURIComponent(location)}`);
    fetchBusinesses(industry, location);
  };

  const filteredBusinesses = React.useMemo(() => {
    if (filter === "no-website") return businesses.filter((b) => !b.hasWebsite);
    if (filter === "has-website") return businesses.filter((b) => b.hasWebsite);
    return businesses;
  }, [businesses, filter]);

  const noWebsiteCount = businesses.filter((b) => !b.hasWebsite).length;

  const handleBuildSite = async (business: Business) => {
    setBuildingId(business.id);
    try {
      const res = await fetch("/api/build-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedSites((prev) => ({ ...prev, [business.id]: data.url }));
        toast.success(`Demo site built for ${business.name}`);
      } else {
        toast.error(data.error || "Failed to build site");
      }
    } catch {
      toast.error("Failed to build site");
    } finally {
      setBuildingId(null);
    }
  };

  const handleFindEmail = async (business: Business) => {
    console.log("[FindEmail] clicked for", business.id, business.name);
    setFindingEmailIds((prev) => [...prev, business.id]);
    try {
      const res = await fetch("/api/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, business }),
      });
      console.log("[FindEmail] response status", res.status);
      const data = await res.json();
      console.log("[FindEmail] response data", data);
      if (data.email) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === business.id ? { ...b, email: data.email } : b))
        );
        toast.success(`Email found for ${business.name}`);
      } else {
        toast.error(`No email found for ${business.name}`);
      }
    } catch (err) {
      console.error("[FindEmail] error", err);
      toast.error("Failed to find email");
    } finally {
      setFindingEmailIds((prev) => prev.filter((id) => id !== business.id));
    }
  };

  const openEmailDialog = (business: Business) => {
    setActiveBusiness(business);
    const rawUrl = generatedSites[business.id] || "";
    const siteUrl = rawUrl.startsWith("http")
      ? rawUrl
      : rawUrl
      ? `${typeof window !== "undefined" ? window.location.origin : ""}${rawUrl}`
      : "";
    const services = `- Custom website design & development\n- Local SEO & Google Business setup\n- Hosting, maintenance & support\n- Logo design & branding`;
    const defaultEmail = buildDefaultEmail({
      businessName: business.name,
      siteUrl: siteUrl || "[demo link will appear after building site]",
      services,
    });
    setEmailTo(business.email || "");
    setEmailSubject(defaultEmail.subject);
    setEmailBody(defaultEmail.body);
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!activeBusiness || !emailTo.trim()) return;
    setSendingEmail(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          toEmail: emailTo.trim(),
          subject: emailSubject,
          body: emailBody,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email sent successfully");
        setEmailDialogOpen(false);
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              S
            </div>
            <span className="font-semibold tracking-tight">Site Scout</span>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <section className="border-b bg-muted/30 px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="text-xs font-medium uppercase text-muted-foreground">Industry</Label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. roofing, plumbing"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs font-medium uppercase text-muted-foreground">Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Tampa, FL"
              />
            </div>
            <Button type="submit" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Results for {initialIndustry} in {initialLocation}</h2>
              <p className="text-sm text-muted-foreground">
                {businesses.length} businesses found · {noWebsiteCount} without a website
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="no-website">No Website</TabsTrigger>
                  <TabsTrigger value="has-website">Has Website</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a
                  href={`/api/export?industry=${encodeURIComponent(initialIndustry)}&location=${encodeURIComponent(initialLocation)}&filter=${filter}`}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </a>
              </Button>
            </div>
          </div>

          {loading && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Searching real businesses via Google Maps...</p>
              <p className="text-xs text-muted-foreground mt-1">This may take 15–30 seconds</p>
            </div>
          )}

          {!loading && filteredBusinesses.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              No businesses found. Try a different search.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((b) => (
              <Card key={b.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{b.name}</h3>
                      <p className="text-sm text-muted-foreground">{b.address}</p>
                    </div>
                    {b.hasWebsite ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
                        <Globe className="h-3 w-3" />
                        Website
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200">
                        <GlobeOff className="h-3 w-3" />
                        No Site
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    <a href={`tel:${b.phone?.replace(/\D/g, "")}`} className="font-medium hover:underline">
                      {b.phone}
                    </a>
                  </div>

                  {b.email && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <a href={`mailto:${b.email}`} className="font-medium text-primary hover:underline truncate max-w-[220px] inline-block align-bottom">
                        {b.email}
                      </a>
                    </div>
                  )}

                  {b.hasWebsite && b.website && (
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {b.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  <div className="mt-auto flex flex-col gap-2 pt-3">
                    {!b.hasWebsite && (
                      <>
                        {generatedSites[b.id] ? (
                          <Button variant="outline" size="sm" className="gap-1.5 w-full" asChild>
                            <a href={generatedSites[b.id]} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              View Demo Site
                            </a>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-1.5 w-full"
                            onClick={() => handleBuildSite(b)}
                            disabled={buildingId === b.id}
                          >
                            <Hammer className="h-4 w-4" />
                            {buildingId === b.id ? "Building..." : "Build Demo Site"}
                          </Button>
                        )}

                        {!b.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 w-full"
                            onClick={() => handleFindEmail(b)}
                            disabled={findingEmailIds.includes(b.id)}
                          >
                            <Mail className="h-4 w-4" />
                            {findingEmailIds.includes(b.id) ? "Finding..." : "Find Email"}
                          </Button>
                        )}
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 w-full"
                      onClick={() => openEmailDialog(b)}
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send outreach email</DialogTitle>
            <DialogDescription>
              {activeBusiness ? `Emailing ${activeBusiness.name}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>To Email</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="owner@business.com"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject line"
              />
            </div>
            <div>
              <Label>Body (HTML supported)</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail || !emailTo.trim()}>
              {sendingEmail ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
