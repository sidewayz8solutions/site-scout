"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Globe, Mail, Zap } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [industry, setIndustry] = React.useState("");
  const [location, setLocation] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim() || !location.trim()) return;
    router.push(`/search?industry=${encodeURIComponent(industry)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <main className="flex flex-1 flex-col">
      {/* Nav */}
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              S
            </div>
            <span className="font-semibold tracking-tight">Site Scout</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Find businesses without websites.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Search any industry and city. We’ll show you which local businesses are missing a website,
            build them a free demo site, and help you send the perfect outreach email.
          </p>

          <form onSubmit={handleSearch} className="mt-8">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1 text-left">
                    <Label htmlFor="industry" className="text-sm font-medium">
                      Industry
                    </Label>
                    <Input
                      id="industry"
                      placeholder="e.g. roofing, plumbing, landscaping"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <Label htmlFor="location" className="text-sm font-medium">
                      City, State
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g. Tampa, FL"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" className="gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Features */}
        <div className="mx-auto mt-16 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <Globe className="h-6 w-6 text-primary" />
              <CardTitle className="text-base">Find Missing Websites</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Scan local businesses and instantly identify which ones don't have an online presence.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Zap className="h-6 w-6 text-primary" />
              <CardTitle className="text-base">Auto-Build Demos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Generate a beautiful one-page demo website tailored to their industry in one click.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Mail className="h-6 w-6 text-primary" />
              <CardTitle className="text-base">Send Outreach</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Email the business owner with a link to their demo and your service proposal.
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
