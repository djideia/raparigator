import Link from "next/link";
import { popularSections } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";

export function PopularLinksSection() {
  return (
    <section className="mt-2 md:mt-4 space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Informacoes mais vistas</h2>
        <p className="text-sm text-zinc-600">Acesse os blocos populares com um toque.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {popularSections.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-wine-200 hover:shadow-md">
              <p className="text-base font-semibold text-zinc-900">{item.label}</p>
              <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
              <p className="mt-3 text-sm font-medium text-wine-700">Abrir</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
