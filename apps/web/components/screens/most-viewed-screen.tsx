import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { ads } from "@/lib/mock-data";

export function MostViewedScreen() {
  const categories = Array.from(new Set(ads.map((item) => item.category)));

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Mais vistas</h1>
        {categories.map((category) => {
          const items = ads
            .filter((ad) => ad.category === category)
            .sort((a, b) => b.profileViews - a.profileViews)
            .slice(0, 5);
          return (
            <Card key={category} className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-900">{category}</h2>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 text-sm"
                >
                  <span>{item.artisticName}</span>
                  <span>{item.profileViews.toLocaleString("pt-BR")} visualizacoes</span>
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
