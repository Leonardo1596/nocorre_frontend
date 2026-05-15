
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
  ChevronRight,
  BarChart3,
  ArrowUpRight,
  Plus
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// --- Utilitários de Formatação ---
const formatBRL = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

function formatHours(hours: number) {
  const totalMinutes = Math.round((hours || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// --- Componentes Reutilizáveis ---

const HeroCard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/20 to-card shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-headline font-bold text-foreground">{value}</h3>
          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            {trend && <ArrowUpRight className="w-3 h-3 text-primary" />}
            {subtext}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="absolute -bottom-2 -right-2 opacity-5">
        <Icon className="w-24 h-24" />
      </div>
    </CardContent>
  </Card>
);

const OperationCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <Card className="border-border/50 bg-card/40 hover:bg-card/60 transition-all duration-300">
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-xl bg-secondary", colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
      </div>
      <div className="space-y-0.5">
        <h4 className="text-xl font-headline font-bold">{value}</h4>
        <p className="text-[10px] text-muted-foreground">{subtext}</p>
      </div>
    </CardContent>
  </Card>
);

const AnalyticsRow = ({ label, value, sublabel }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{sublabel}</p>
    </div>
    <span className="text-sm font-bold font-headline">{value}</span>
  </div>
);

// --- Componente Principal ---

export default function Dashboard() {
  const { toast } = useToast();
  const [filter, setFilter] = useState('Semana Atual');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [fuelPrice, setFuelPrice] = useState<number>(0);
  const [updatingFuel, setUpdatingFuel] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      const [dashRes, settingsRes] = await Promise.all([
        api.get(`/dashboard?start=${startDateStr}&end=${endDateStr}`),
        api.get('/maintenance-settings')
      ]);

      setData(dashRes.data);
      if (settingsRes.data?.fuel?.fuelPrice) {
        setFuelPrice(Number(settingsRes.data.fuel.fuelPrice));
      }
    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleFuelUpdate = async () => {
    setUpdatingFuel(true);
    try {
      // Para o PUT, precisamos da estrutura completa conforme o backend espera
      // Buscamos as settings atuais primeiro para não sobrescrever o resto
      const settingsRes = await api.get('/maintenance-settings');
      const currentSettings = settingsRes.data;

      const payload = {
        ...currentSettings,
        fuel: {
          ...currentSettings.fuel,
          fuelPrice: Number(fuelPrice)
        }
      };

      await api.put('/maintenance-settings/update', payload);
      toast({ title: "Sucesso!", description: "Preço do combustível atualizado." });
      setShowFuelModal(false);
      // Recarrega os dados para refletir mudanças nos cálculos se necessário
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro", description: "Não foi possível atualizar o preço." });
    } finally {
      setUpdatingFuel(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Sincronizando seus lucros...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const days = data?.days || {};

  const grossAmount = Number(summary.grossAmount || 0);
  const netProfit = Number(summary.netProfit || 0);
  const totalExpenses = Number(summary.totalExpenses || 0);
  const totalKm = Number(summary.totalKm || 0);
  const productiveHours = Number(summary.productiveHours || 0);
  const totalHours = Number(summary.totalHours || 0);

  const netPerHour = productiveHours > 0 ? netProfit / productiveHours : 0;
  const netPerKm = totalKm > 0 ? netProfit / totalKm : 0;
  const grossPerKm = totalKm > 0 ? grossAmount / totalKm : 0;
  const grossPerHour = productiveHours > 0 ? grossAmount / productiveHours : 0;
  const costPerKm = totalKm > 0 ? totalExpenses / totalKm : 0;

  const chartData = Object.entries(days).map(([date, dayData]: [string, any]) => ({
    day: dayData.dayName ? dayData.dayName.substring(0, 3) : date.substring(8, 10),
    earnings: dayData.financial?.grossAmount || 0,
    profit: dayData.financial?.netProfit || 0,
  }));

  return (
    <div className="p-6 space-y-10 max-w-md mx-auto pb-28">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-headline font-bold tracking-tight">Painel de Controle</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Sua inteligência financeira</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showFuelModal} onOpenChange={setShowFuelModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 border-border/50 bg-card/50 text-primary">
                <Fuel className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-headline">Preço do Combustível</DialogTitle>
                <DialogDescription>Atualize o valor do litro para cálculos precisos.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelPriceInput">Preço por Litro (R$)</Label>
                  <Input 
                    id="fuelPriceInput" 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 5.89"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleFuelUpdate} disabled={updatingFuel} className="w-full h-12 font-bold">
                  {updatingFuel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  ATUALIZAR AGORA
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2 border-border/50 bg-card/50">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold">{filter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={() => setFilter('Semana Atual')}>Semana Atual</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('Mês Atual')}>Mês Atual</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 1. HERO METRICS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Indicadores de Sucesso</h3>
        <div className="grid grid-cols-1 gap-4">
          <HeroCard 
            title="Lucro Líquido" 
            value={formatBRL(netProfit)} 
            subtext="Dinheiro real no seu bolso" 
            icon={TrendingUp}
            trend={true}
          />
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/50 bg-card/40">
              <CardContent className="p-4 space-y-2 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Lucro / Hora</p>
                <p className="text-lg font-headline font-bold text-primary">{formatBRL(netPerHour)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/40">
              <CardContent className="p-4 space-y-2 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">KM Rodados</p>
                <p className="text-lg font-headline font-bold text-blue-400">{totalKm.toFixed(1)} km</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 2. OPERAÇÃO */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Gestão da Operação</h3>
        <div className="grid grid-cols-2 gap-4">
          <OperationCard 
            title="Faturamento Bruto" 
            value={formatBRL(grossAmount)} 
            subtext="Total recebido" 
            icon={DollarSign} 
            colorClass="text-primary"
          />
          <OperationCard 
            title="Despesas Totais" 
            value={formatBRL(totalExpenses)} 
            subtext="Custos operacionais" 
            icon={Fuel} 
            colorClass="text-orange-400"
          />
          <OperationCard 
            title="Horas Trabalhadas" 
            value={formatHours(productiveHours)} 
            subtext="Tempo produtivo" 
            icon={Clock} 
            colorClass="text-blue-400"
          />
          <OperationCard 
            title="Horas Ativas" 
            value={formatHours(totalHours)} 
            subtext="Tempo total em turno" 
            icon={Clock} 
            colorClass="text-accent"
          />
        </div>
      </section>

      {/* 3. ANALYTICS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Análise de Performance</h3>
        
        <Card className="border-border/50 bg-card/40 overflow-hidden">
          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Faturamento Semanal</CardTitle>
            <BarChart3 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D1011', border: '1px solid #1E293B', borderRadius: '12px' }}
                  cursor={{fill: 'rgba(16, 185, 129, 0.05)'}}
                  formatter={(value: any) => [formatBRL(value), 'Faturamento']}
                />
                <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.earnings > 0 ? '#10B981' : '#1E293B'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40">
          <CardContent className="p-4 divide-y divide-white/5">
            <AnalyticsRow label="Lucro por KM" value={formatBRL(netPerKm)} sublabel="Saldo líquido" />
            <AnalyticsRow label="Faturamento por KM" value={formatBRL(grossPerKm)} sublabel="Saldo bruto" />
            <AnalyticsRow label="Lucro por Hora" value={formatBRL(netPerHour)} sublabel="Saldo líquido" />
            <AnalyticsRow label="Faturamento por Hora" value={formatBRL(grossPerHour)} sublabel="Saldo bruto" />
            <AnalyticsRow label="Custo por KM" value={formatBRL(costPerKm)} sublabel="Eficiência de custo" />
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-center pb-8 pt-4">
        <Button variant="link" className="text-primary text-xs font-bold uppercase tracking-widest gap-2" asChild>
          <Link href="/history">
            Acessar Histórico Completo
            <ChevronRight className="w-3 h-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
