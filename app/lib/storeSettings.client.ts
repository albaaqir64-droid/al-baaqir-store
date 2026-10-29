"use client";

import { useEffect, useState } from "react";
import { readApiJson } from "./api/client";
import {
  DEFAULT_PUBLIC_STORE_SETTINGS,
  type PublicStoreSettings,
} from "./storeSettings";

let publicSettingsRequest: Promise<PublicStoreSettings> | null = null;

async function loadPublicStoreSettings() {
  if (!publicSettingsRequest) {
    publicSettingsRequest = (async () => {
      const response = await fetch("/api/store-settings");
      const result = await readApiJson<PublicStoreSettings>(response);
      if (!result.ok || !result.data) {
        throw new Error(result.error || "Could not load store settings.");
      }
      return { ...DEFAULT_PUBLIC_STORE_SETTINGS, ...result.data };
    })().catch((error: unknown) => {
      publicSettingsRequest = null;
      throw error;
    });
  }
  return publicSettingsRequest;
}

export function usePublicStoreSettings(enabled = true) {
  const [settings, setSettings] = useState(DEFAULT_PUBLIC_STORE_SETTINGS);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void loadPublicStoreSettings()
      .then((result) => {
        if (active) setSettings(result);
      })
      .catch((error: unknown) => {
        console.error("Could not load storefront settings:", error);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return settings;
}
