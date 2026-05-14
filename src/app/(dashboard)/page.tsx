
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  Fuel, 
  Route, 
  Clock, 
  Filter,
  Loader2,
  Percent
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek } from 'date-fns';

// Função para formatar horas decimais (ex: 0.25 -> 15min)
function formatHours(hours: number) {
  const totalMinutes = Math.round((hours || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <Card className="border-border/50 bg-card/40 hover:bg-card/60 transition-colors">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className={cn("p-2 rounded-lg bg-secondary/50", colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-headline font-bold">{value}</h3>
        <p className="text-[10px] text-muted-foreground">{subtext}</p>
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [filter, setFilter] = useState('Semana Atual');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        
        const startDateStr = format(start, 'yyyy-MM-dd');
        const endDateStr = format(end, 'yyyy-MM-dd');

        const response = await api.get(`/dashboard?start=${startDateStr}&end=${endDateStr}`);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const days = data?.days || {};

  const chartData = Object.entries(days).map(([date, dayData]: [string, any]) => ({
    day: dayData.dayName ? dayData.dayName.split('-')[0].substring(0, 3) : date.substring(8, 10),
    earnings: dayData.financial?.grossAmount || 0,
    profit: dayData.financial?.netProfit || 0,
    color: '#10B981'
  }));

  const grossAmount = Number(summary.grossAmount || 0);
  const netProfit = Number(summary.netProfit || 0);
  const totalExpenses = Number(summary.totalExpenses || 0);
  const totalKm = Number(summary.totalKm || 0);
  const totalHours = Number(summary.totalHours || 0);
  const productiveHours = Number(summary.productiveHours || 0);

  const margin = grossAmount > 0 ? (netProfit / grossAmount) * 100 : 0;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-headline font-bold">Resumo Financeiro</h2>
          <p className="text-sm text-muted-foreground">Visão geral do seu desempenho</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-border/50">
              <Filter className="w-4 h-4" />
              {filter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilter('Semana Atual')}>Semana Atual</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('Mês Atual')}>Mês Atual</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          title="Ganho Bruto" 
          value={`R$ ${grossAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subtext="Total recebido" 
          icon={DollarSign} 
          colorClass="text-primary"
        />
        <StatCard 
          title="Lucro Líquido" 
          value={`R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subtext={`${margin.toFixed(0)}% de margem`} 
          icon={TrendingUp} 
          colorClass="text-accent"
        />
        <StatCard 
          title="Custos Totais" 
          value={`R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subtext="Combustível e Manutenção" 
          icon={Fuel} 
          colorClass="text-orange-400"
        />
        <StatCard 
          title="KM Rodados" 
          value={`${totalKm.toFixed(1)} km`} 
          subtext="Total no período" 
          icon={Route} 
          colorClass="text-blue-400"
        />
      </div>

      <Card className="border-border/50 bg-card/40">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ganhos por Dia</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-4 h-[200px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D1011', border: '1px solid #1E293B', borderRadius: '8px' }}
                  itemStyle={{ color: '#10B981' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Ganhos']}
                />
                <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados suficientes para o gráfico.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-headline font-semibold">Resumo de Tempo</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border/50 bg-card/20 flex flex-col items-center gap-1 text-center">
             <Clock className="w-4 h-4 text-primary mb-1" />
             <span className="text-xl font-bold text-primary">{formatHours(productiveHours)}</span>
             <span className="text-[10px] text-muted-foreground uppercase font-medium">Trabalhadas</span>
          </div>
          <div className="p-4 rounded-xl border border-border/50 bg-card/20 flex flex-col items-center gap-1 text-center">
             <Clock className="w-4 h-4 text-blue-400 mb-1" />
             <span className="text-xl font-bold text-blue-400">{formatHours(totalHours)}</span>
             <span className="text-[10px] text-muted-foreground uppercase font-medium">Horas Ativas</span>
          </div>
        </div>

        <h3 className="font-headline font-semibold pt-2">Métricas de Eficiência</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 rounded-xl border border-border/50 bg-card/20 space-y-4">
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Base: Ganho Bruto</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ganho Bruto / Hora Trabalhada</span>
                <span className="font-bold text-primary">
                  R$ {productiveHours > 0 ? (grossAmount / productiveHours).toFixed(2) : '0.00'}/h
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ganho Bruto / KM</span>
                <span className="font-bold text-blue-400">
                  R$ {totalKm > 0 ? (grossAmount / totalKm).toFixed(2) : '0.00'}/km
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t border-white/5">
              <p className="text-[10px] text-accent uppercase font-bold tracking-widest">Base: Lucro Líquido</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Lucro Líquido / Hora Trabalhada</span>
                <span className="font-bold text-accent">
                  R$ {productiveHours > 0 ? (netProfit / productiveHours).toFixed(2) : '0.00'}/h
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Lucro Líquido / KM</span>
                <span className="font-bold text-accent">
                  R$ {totalKm > 0 ? (netProfit / totalKm).toFixed(2) : '0.00'}/km
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pb-4">
        <Button variant="link" className="text-primary p-0 h-auto" asChild>
          <Link href="/history">Ver Histórico Completo</Link>
        </Button>
      </div>
    </div>
  );
}
