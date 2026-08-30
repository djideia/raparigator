import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { mediaHighlights } from "@/lib/mock-data";

interface TrendingMediaScreenProps {
  kind: "foto" | "video";
  title: string;
}

export function TrendingMediaScreen({ kind, title }: TrendingMediaScreenProps) {
  const filtered = mediaHighlights.filter((item) => item.kind === kind);
  const categories = Array.from(new Set(filtered.map((item) => item.category)));

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        {categories.map((category) => {
          const items = filtered
            .filter((item) => item.category === category)
            .sort((a, b) => b.likes + b.views - (a.likes + a.views))
            .slice(0, 4);
          return (
            <Card key={category} className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-900">{category}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-zinc-200"
                  >
                    <div className="relative h-36">
                      <Image
                        src={item.coverUrl}
                        alt={`${item.kind} de ${item.professionalName}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <div className="space-y-1 p-3 text-sm">
                      <p className="font-medium text-zinc-900">{item.professionalName}</p>
                      <p className="text-zinc-600">
                        Curtidas: {item.likes.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-zinc-600">Views: {item.views.toLocaleString("pt-BR")}</p>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
