"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  Fuel, 
  Route, 
  Clock, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
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

const mockData = [
  { day: 'Seg', earnings: 120, profit: 85, color: '#10B981' },
  { day: 'Ter', earnings: 150, profit: 110, color: '#10B981' },
  { day: 'Qua', earnings: 180, profit: 130, color: '#10B981' },
  { day: 'Qui', earnings: 140, profit: 95, color: '#10B981' },
  { day: 'Sex', earnings: 250, profit: 190, color: '#10B981' },
  { day: 'Sáb', earnings: 320, profit: 240, color: '#10B981' },
  { day: 'Dom', earnings: 210, profit: 150, color: '#10B981' },
];

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

import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [filter, setFilter] = useState('Semana Atual');

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
          value="R$ 1.370,00" 
          subtext="+12% que semana passada" 
          icon={DollarSign} 
          colorClass="text-primary"
        />
        <StatCard 
          title="Lucro Líquido" 
          value="R$ 985,50" 
          subtext="72% de margem" 
          icon={TrendingUp} 
          colorClass="text-accent"
        />
        <StatCard 
          title="Combustível" 
          value="R$ 280,00" 
          subtext="R$ 0,42 por KM" 
          icon={Fuel} 
          colorClass="text-orange-400"
        />
        <StatCard 
          title="KM Rodados" 
          value="665 km" 
          subtext="Média 95km/dia" 
          icon={Route} 
          colorClass="text-blue-400"
        />
      </div>

      <Card className="border-border/50 bg-card/40">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Desempenho Semanal</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-4 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0D1011', border: '1px solid #1E293B', borderRadius: '8px' }}
                itemStyle={{ color: '#10B981' }}
              />
              <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                {mockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-semibold">Últimos Dias</h3>
          <Button variant="link" className="text-primary p-0 h-auto">Ver tudo</Button>
        </div>
        <div className="space-y-3">
          {[
            { date: 'Sábado, 10 Mai', gain: 'R$ 320', profit: 'R$ 240', km: '112km', hours: '8h 20m' },
            { date: 'Sexta, 09 Mai', gain: 'R$ 250', profit: 'R$ 190', km: '95km', hours: '7h 15m' },
            { date: 'Quinta, 08 Mai', gain: 'R$ 140', profit: 'R$ 95', km: '62km', hours: '5h 40m' },
          ].map((day, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/20">
              <div className="space-y-1">
                <p className="text-sm font-medium">{day.date}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Route className="w-3 h-3" /> {day.km}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {day.hours}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-primary font-bold">{day.profit}</p>
                <p className="text-[10px] text-muted-foreground">Lucro Líquido</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}