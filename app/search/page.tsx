"use client";

import * as React from "react";
import { SearchPageContent } from "./SearchPageContent";

export default function SearchPage() {
  return (
    <React.Suspense fallback={<div className="p-10 text-center text-muted-foreground">Loading...</div>}>
      <SearchPageContent />
    </React.Suspense>
  );
}
