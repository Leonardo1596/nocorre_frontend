
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
  Loader2
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
  const [shifts, setShifts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalProfit: 0,
    totalFuel: 0,
    totalKm: 0,
    margin: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await api.get('/shifts');
        const data = response.data;
        setShifts(data);

        // Simple calculation for MVP stats
        const totalEarnings = data.reduce((acc: number, curr: any) => acc + curr.totalEarnings, 0);
        const totalProfit = data.reduce((acc: number, curr: any) => acc + curr.netProfit, 0);
        const totalKm = data.reduce((acc: number, curr: any) => acc + curr.totalKm, 0);
        const totalFuel = totalEarnings - totalProfit; // Simplified assumption
        const margin = totalEarnings > 0 ? (totalProfit / totalEarnings) * 100 : 0;

        setStats({
          totalEarnings,
          totalProfit,
          totalFuel,
          totalKm,
          margin
        });
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

  const chartData = shifts.slice(-7).map((s: any) => ({
    day: new Date(s.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    earnings: s.totalEarnings,
    profit: s.netProfit,
    color: '#10B981'
  }));

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
            <DropdownMenuItem onClick={() => setFilter('Semana Anterior')}>Semana Anterior</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('Mês Atual')}>Mês Atual</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          title="Ganho Bruto" 
          value={`R$ ${stats.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subtext="Baseado em dados reais" 
          icon={DollarSign} 
          colorClass="text-primary"
        />
        <StatCard 
          title="Lucro Líquido" 
          value={`R$ ${stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subtext={`${stats.margin.toFixed(0)}% de margem`} 
          icon={TrendingUp} 
          colorClass="text-accent"
        />
        <StatCard 
          title="Custo Estimado" 
          value={`R$ ${stats.totalFuel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subtext="Combustível e Manutenção" 
          icon={Fuel} 
          colorClass="text-orange-400"
        />
        <StatCard 
          title="KM Rodados" 
          value={`${stats.totalKm} km`} 
          subtext="Total no período" 
          icon={Route} 
          colorClass="text-blue-400"
        />
      </div>

      <Card className="border-border/50 bg-card/40">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Desempenho Recente</CardTitle>
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
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-semibold">Últimos Corres</h3>
          <Button variant="link" className="text-primary p-0 h-auto" asChild>
            <Link href="/history">Ver tudo</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {shifts.slice(0, 3).map((shift, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/20">
              <div className="space-y-1">
                <p className="text-sm font-medium">{new Date(shift.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Route className="w-3 h-3" /> {shift.totalKm}km</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {shift.totalHours}h</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-primary font-bold">R$ {shift.netProfit.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Lucro Líquido</p>
              </div>
            </div>
          ))}
          {shifts.length === 0 && (
            <p className="text-center py-4 text-muted-foreground text-sm">Nenhum turno registrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';
