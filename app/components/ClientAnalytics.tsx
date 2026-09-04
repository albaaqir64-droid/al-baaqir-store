"use client";

import { useEffect } from "react";
import { trackVisit } from "../lib/analytics";

export default function ClientAnalytics() {
  useEffect(() => {
    void trackVisit();
  }, []);

  return null;
}
