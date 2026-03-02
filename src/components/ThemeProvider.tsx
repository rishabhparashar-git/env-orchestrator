"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEnvStore } from "@/store/useEnvStore";
import { useEffect } from "react";

function ThemeSyncer() {
  const storeTheme = useEnvStore((state) => state.theme);
  const { setTheme } = useTheme();

  useEffect(() => {
    if (storeTheme && setTheme) {
      setTheme(storeTheme);
    }
  }, [storeTheme, setTheme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSyncer />
      {children}
    </NextThemesProvider>
  );
}
