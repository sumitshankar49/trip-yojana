"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: "class" | string | string[];
  defaultTheme?: Theme;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
};

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme, enableSystem: boolean): ResolvedTheme {
  if (theme === "system") {
    return enableSystem ? getSystemTheme() : "light";
  }
  return theme;
}

function applyThemeToDocument(
  resolved: ResolvedTheme,
  attribute: "class" | string | string[],
  enableColorScheme: boolean
) {
  const root = document.documentElement;
  const attrs = Array.isArray(attribute) ? attribute : [attribute];

  attrs.forEach((attr) => {
    if (attr === "class") {
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      return;
    }
    root.setAttribute(attr, resolved);
  });

  if (enableColorScheme) {
    root.style.colorScheme = resolved;
  }
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  enableColorScheme = true,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) as Theme | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeState(saved);
      }
    } catch {
      // Ignore storage access issues.
    }
    setMounted(true);
  }, [storageKey]);

  const resolvedTheme = React.useMemo(
    () => resolveTheme(theme, enableSystem),
    [theme, enableSystem]
  );

  React.useEffect(() => {
    if (!mounted) return;
    applyThemeToDocument(resolvedTheme, attribute, enableColorScheme);
  }, [mounted, resolvedTheme, attribute, enableColorScheme]);

  React.useEffect(() => {
    if (!enableSystem || theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      applyThemeToDocument(getSystemTheme(), attribute, enableColorScheme);
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [theme, enableSystem, attribute, enableColorScheme]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch {
        // Ignore storage access issues.
      }
    },
    [storageKey]
  );

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
