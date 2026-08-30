"use client";

import type { PropsWithChildren } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { HeaderTitleFlightRoot } from "@/components/layout/header-title-flight/header-title-flight-root";
import { ShellChromeProvider } from "@/components/layout/shell-chrome";
import { TabsKeepAlive } from "@/components/layout/tabs-keep-alive";

export default function TabsLayout({ children }: PropsWithChildren) {
  return (
    <HeaderTitleFlightRoot>
      <ShellChromeProvider>
        <AppShell>
          <TabsKeepAlive>{children}</TabsKeepAlive>
        </AppShell>
      </ShellChromeProvider>
    </HeaderTitleFlightRoot>
  );
}
