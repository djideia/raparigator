"use client";

import { Card } from "@/components/ui/card";
import { TrafficDiscoveryCard } from "@/components/screens/professional-dashboard/traffic-discovery-card";
import { dashboardSummary } from "@/lib/mock-data";
import { currency, cn } from "@/lib/utils";

function MetricCardComDica({
  title,
  value,
  change,
  icon,
  tip,
}: {
  title: string;
  value: string;
  change: number;
  icon: string;
  tip: string;
}) {
  const isPositive = change >= 0;
  return (
    <Card className="p-4 hover:border-wine-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        <span
          className={cn("text-xs font-semibold", isPositive ? "text-emerald-600" : "text-red-600")}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(change)}%
        </span>
        <span className="text-xs text-zinc-500">vs. mês anterior</span>
      </div>
      <p className="text-xs text-zinc-600 mt-2 bg-zinc-50 px-2 py-1 rounded">{tip}</p>
    </Card>
  );
}

export function SummaryTab() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Grid Principal - 4 Métricas */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCardComDica
          title="Receita do mês"
          value={currency(dashboardSummary.monthRevenue)}
          change={12}
          icon="💰"
          tip="R$ 200 acima da meta"
        />
        <MetricCardComDica
          title="Contatos"
          value={String(dashboardSummary.contacts)}
          change={8}
          icon="👥"
          tip="Média de 1,5 por dia"
        />
        <MetricCardComDica
          title="Visualizações"
          value={String(dashboardSummary.profileViews)}
          change={-5}
          icon="👁️"
          tip="142 este mês"
        />
        <MetricCardComDica
          title="Conversão"
          value={`${dashboardSummary.conversionRate}%`}
          change={3}
          icon="📈"
          tip="2.2% acima da média"
        />
      </section>

      <TrafficDiscoveryCard />

      {/* Card de Dicas e Orientações */}
      <Card className="bg-linear-to-r from-wine-50 to-wine-100/50 border border-wine-200 p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-wine-900 mb-2">Dica para aumentar conversão</h3>
            <p className="text-sm text-wine-800">
              Adicione mais fotos de alta qualidade à sua galeria. Perfis com +5 fotos têm 35% mais
              conversões!
            </p>
            <button className="mt-3 text-wine-700 font-semibold text-sm hover:underline">
              → Ir para galeria
            </button>
          </div>
        </div>
      </Card>

      {/* Comparativo com Período Anterior */}
      <Card className="space-y-4 p-4 sm:p-6">
        <h3 className="font-bold text-lg text-zinc-900">Comparativo - Mês Anterior</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-emerald-600 font-semibold uppercase">Receita ↑</p>
            <p className="text-lg font-bold text-emerald-900 mt-1">+12% (R$ 3.200)</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-emerald-600 font-semibold uppercase">Contatos ↑</p>
            <p className="text-lg font-bold text-emerald-900 mt-1">+8% (4 contatos)</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-600 font-semibold uppercase">Visualizações ↓</p>
            <p className="text-lg font-bold text-red-900 mt-1">-5% (142 views)</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-semibold uppercase">Taxa de Conversão ↑</p>
            <p className="text-lg font-bold text-blue-900 mt-1">+3% (18.2%)</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
