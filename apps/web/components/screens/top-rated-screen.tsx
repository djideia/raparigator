import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ads } from "@/lib/mock-data";

export function TopRatedScreen() {
  const grouped = groupByCategory(
    [...ads].sort((a, b) => b.rating - a.rating),
    (ad) => ({
      name: ad.artisticName,
      category: ad.category,
      score: ad.rating.toFixed(1),
      count: ad.reviewsCount,
    }),
  );

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Mais avaliadas</h1>
        {grouped.length === 0 ? (
          <EmptyState
            title="Ainda sem elogios por aqui"
            description="Quando as avaliações chegarem, elas aparecem aqui — bem cheinhas de carinho."
          />
        ) : null}
        {grouped.map((item) => (
          <Card key={item.category} className="space-y-3">
            <h2 className="text-base font-semibold text-zinc-900">{item.category}</h2>
            {item.items.map((profile) => (
              <div
                key={`${item.category}-${profile.name}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 text-sm"
              >
                <span>{profile.name}</span>
                <span>
                  ⭐ {profile.score} ({profile.count} avaliacoes)
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function groupByCategory<T>(source: typeof ads, mapper: (item: (typeof ads)[number]) => T) {
  const categories = Array.from(new Set(source.map((item) => item.category)));
  return categories.map((category) => ({
    category,
    items: source
      .filter((ad) => ad.category === category)
      .map(mapper)
      .slice(0, 5),
  }));
}
