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
import Link from 'next/link';
import { format, startOfWeek, endOfWeek } from 'date-fns';

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

  const margin = (summary.grossAmount || 0) > 0 
    ? ((summary.netProfit || 0) / (summary.grossAmount || 1)) * 100 
    : 0;

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
          value={`R$ ${(summary.grossAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subtext="Total recebido das plataformas" 
          icon={DollarSign} 
          colorClass="text-primary"
        />
        <StatCard 
          title="Lucro Líquido" 
          value={`R$ ${(summary.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subtext={`${margin.toFixed(0)}% de margem`} 
          icon={TrendingUp} 
          colorClass="text-accent"
        />
        <StatCard 
          title="Custos Totais" 
          value={`R$ ${(summary.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subtext="Combustível, Manutenção e outros" 
          icon={Fuel} 
          colorClass="text-orange-400"
        />
        <StatCard 
          title="KM Rodados" 
          value={`${(summary.totalKm || 0).toFixed(1)} km`} 
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
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-semibold">Resumo de Horas</h3>
          <div className="flex items-center gap-2 text-primary font-bold">
            <Clock className="w-4 h-4" />
            <span>{(summary.totalHours || 0).toFixed(1)}h trabalhadas</span>
          </div>
        </div>
        
        <div className="p-4 rounded-xl border border-border/50 bg-card/20 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Ganhos por Hora</span>
            <span className="font-bold text-primary">
              R$ {(summary.totalHours || 0) > 0 ? ((summary.grossAmount || 0) / summary.totalHours).toFixed(2) : '0.00'}/h
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Ganhos por KM</span>
            <span className="font-bold text-blue-400">
              R$ {(summary.totalKm || 0) > 0 ? ((summary.grossAmount || 0) / summary.totalKm).toFixed(2) : '0.00'}/km
            </span>
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
