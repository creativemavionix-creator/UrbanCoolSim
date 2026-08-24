import "@/styles/globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "UrbanCoolSim — AI Urban Heat Intelligence & Decision Twin",
  description: "Physics-informed surface energy balance digital twin, LightGBM surrogate acceleration, and NSGA-II multi-objective decision support platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-obsidian-base text-obsidian-textPrimary antialiased overflow-x-hidden">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
