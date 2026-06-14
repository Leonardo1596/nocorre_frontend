
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  Fuel,
  Clock,
  Loader2,
  ChevronRight,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  Calendar as CalendarIcon
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from "react-day-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const HeroCard = ({ title, value, subtext, icon: Icon, trendIcon: TrendIcon, trendColor }: any) => (
  <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/20 to-card shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-headline font-bold text-foreground">{value}</h3>
          <p className={cn("text-[10px] text-muted-foreground font-medium flex items-center gap-1", trendColor)}>
            {TrendIcon && <TrendIcon className="w-3 h-3" />}
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
      {sublabel && <p className="text-[10px] text-muted-foreground uppercase">{sublabel}</p>}
    </div>
    <span className="text-sm font-bold font-headline">{value}</span>
  </div>
);

// --- Componente Principal ---

export default function Dashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [previousWeekData, setPreviousWeekData] = useState<any>(null);
  const [profitComparison, setProfitComparison] = useState<any>(null);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [fuelPrice, setFuelPrice] = useState<number>(0);
  const [updatingFuel, setUpdatingFuel] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Estados do Filtro de Data
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const fetchData = useCallback(async (start: Date, end: Date) => {
    try {
      setLoading(true);
      const timezoneOffset = new Date().getTimezoneOffset();
      const startDateStr = start.toISOString();
      const endDateStr = end.toISOString();

      const prevWeekStart = subDays(start, 7);
      const prevWeekEnd = subDays(end, 7);
      const prevStartDateStr = prevWeekStart.toISOString();
      const prevEndDateStr = prevWeekEnd.toISOString();

      const [dashRes, prevWeekRes, settingsRes] = await Promise.all([
        api.get(`/dashboard?start=${startDateStr}&end=${endDateStr}&timezoneOffset=${timezoneOffset}`),
        api.get(`/dashboard?start=${prevStartDateStr}&end=${prevEndDateStr}&timezoneOffset=${timezoneOffset}`),
        api.get('/maintenance-settings')
      ]);

      setData(dashRes.data);
      setPreviousWeekData(prevWeekRes.data);

      if (settingsRes.data?.fuel?.fuelPrice) {
        setFuelPrice(Number(settingsRes.data.fuel.fuelPrice));
      }
    } catch (error) {
      console.error('Dashboard Error:', error);
      toast({ variant: 'destructive', title: "Erro", description: "Falha ao sincronizar dados." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchData(dateRange.from, dateRange.to);
    }
  }, [dateRange, fetchData]);

  useEffect(() => {
    if (data && previousWeekData) {
      const currentProfit = data.summary?.netProfit || 0;
      const previousProfit = previousWeekData.summary?.netProfit || 0;

      if (previousProfit > 0) {
        const percentageChange = ((currentProfit - previousProfit) / previousProfit) * 100;
        setProfitComparison({
          percentage: Math.abs(Number(percentageChange.toFixed(0))),
          isIncrease: percentageChange >= 0,
        });
      } else {
        setProfitComparison(null);
      }
    } else {
      setProfitComparison(null);
    }
  }, [data, previousWeekData]);


  const handleFuelUpdate = async () => {
    setUpdatingFuel(true);
    try {
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
      if (dateRange?.from && dateRange?.to) {
        fetchData(dateRange.from, dateRange.to);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro", description: "Não foi possível atualizar o preço." });
    } finally {
      setUpdatingFuel(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!dateRange?.from || !dateRange?.to) return;
    const offset = direction === 'prev' ? -7 : 7;
    const newFrom = addDays(dateRange.from, offset);
    const newTo = addDays(dateRange.to, offset);
    setDateRange({ from: newFrom, to: newTo });
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
  const productiveKm = Number(summary.productiveKm || 0);
  const productiveHours = Number(summary.productiveHours || 0);
  const totalHours = Number(summary.totalHours || 0);

  const fuelExpenses = Number(summary.fuelExpense || 0);
  const maintenanceExpenses = Number(summary.maintenanceExpense || 0);
  const foodExpenses = Number(summary.foodExpense || 0);
  const otherExpenses = Number(summary.otherExpense || 0);

  // Métricas Produtivas
  const netPerHourProductive = productiveHours > 0 ? netProfit / productiveHours : 0;
  const grossPerHourProductive = productiveHours > 0 ? grossAmount / productiveHours : 0;

  // Métricas Totais
  const netPerHourTotal = totalHours > 0 ? netProfit / totalHours : 0;
  const grossPerHourTotal = totalHours > 0 ? grossAmount / totalHours : 0;

  const totalKmSafe = totalKm > 0 ? totalKm : 1;
  const netPerKm = netProfit / totalKmSafe;
  const grossPerKm = grossAmount / totalKmSafe;
  const costPerKm = totalExpenses / totalKmSafe;

  const chartData = Object.entries(days).map(([date, dayData]: [string, any]) => ({
    day: dayData.dayName ? dayData.dayName.substring(0, 3) : date.substring(8, 10),
    earnings: dayData.financial?.grossAmount || 0,
    profit: dayData.financial?.netProfit || 0,
  }));

  const formattedRange = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, "dd MMM", { locale: ptBR })} - ${format(dateRange.to, "dd MMM", { locale: ptBR })}`
    : dateRange?.from
      ? format(dateRange.from, "dd MMM", { locale: ptBR })
      : "Selecione o período";

  return (
    <div className="p-6 space-y-8 max-w-md mx-auto pb-28">

      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-headline font-bold tracking-tight">Painel de Controle</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Sua inteligência financeira</p>
          </div>

          <Dialog open={showFuelModal} onOpenChange={setShowFuelModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 border-border/50 bg-card/50 text-primary rounded-xl shadow-sm px-3">
                <Fuel className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Abastecer</span>
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
                  <CurrencyInput
                    id="fuelPriceInput"
                    placeholder="R$ 0,00"
                    value={fuelPrice}
                    onChange={(val) => setFuelPrice(val)}
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
        </div>

        {/* DATE SELECTOR */}
        <div className="flex items-center justify-between bg-card/40 border border-border/50 rounded-2xl p-1.5 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 h-8 gap-2 font-bold text-xs uppercase tracking-wider hover:bg-transparent"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                {formattedRange}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border-border" align="center">
              <Calendar
                initialFocus
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (range?.from && range?.to) {
                    setIsCalendarOpen(false);
                  }
                }}
                numberOfMonths={1}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="produtivo">Produtivo</TabsTrigger>
          <TabsTrigger value="total">Total</TabsTrigger>
        </TabsList>
        <TabsContent value="geral">
          <div>
            {/* 1. HERO METRICS */}
            <section className="space-y-4 mt-6">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Resumo da Semana</h3>
              <div className="grid grid-cols-1 gap-4">
                <HeroCard
                  title="Lucro Líquido"
                  value={formatBRL(netProfit)}
                  icon={TrendingUp}
                  subtext={profitComparison
                    ? `${profitComparison.percentage}% a ${profitComparison.isIncrease ? 'mais' : 'menos'} que na semana anterior`
                    : "Dinheiro real no seu bolso"}
                  trendIcon={profitComparison ? (profitComparison.isIncrease ? ArrowUpRight : ArrowDownRight) : null}
                  trendColor={profitComparison ? (profitComparison.isIncrease ? 'text-primary' : 'text-destructive') : 'text-muted-foreground'}
                />
                <div className="grid grid-cols-2 gap-4">
                  <OperationCard
                    title="Horas Ativas"
                    value={formatHours(totalHours)}
                    subtext="Tempo total em turno"
                    icon={Clock}
                    colorClass="text-accent"
                  />
                  <OperationCard
                    title="Horas Trabalhadas"
                    value={formatHours(productiveHours)}
                    subtext="Tempo produtivo"
                    icon={Clock}
                    colorClass="text-blue-400"
                  />
                </div>
              </div>
            </section>

            {/* 2. OPERAÇÃO */}
            <section className="space-y-4 mt-6">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Gestão da Operação</h3>
              <div className="grid grid-cols-2 gap-4">
                <OperationCard
                  title="Faturamento Bruto"
                  value={formatBRL(grossAmount)}
                  subtext="Total recebido"
                  icon={DollarSign}
                  colorClass="text-primary"
                />
                <Dialog open={showExpenseDetails} onOpenChange={setShowExpenseDetails}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer">
                      <OperationCard
                        title="Despesas Totais"
                        value={formatBRL(totalExpenses)}
                        subtext="Toque para ver detalhes"
                        icon={Fuel}
                        colorClass="text-orange-400"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="font-headline">Detalhes das Despesas</DialogTitle>
                      <DialogDescription>
                        Detalhes das despesas para o período selecionado.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Card className="border-border/50 bg-card/40">
                        <CardContent className="p-4 divide-y divide-white/5">
                          <AnalyticsRow label="Combustível" value={formatBRL(fuelExpenses)} />
                          <AnalyticsRow label="Manutenção" value={formatBRL(maintenanceExpenses)} />
                          <AnalyticsRow label="Alimentação" value={formatBRL(foodExpenses)} />
                          <AnalyticsRow label="Outros" value={formatBRL(otherExpenses)} />
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </section>

            {/* 3. ANALYTICS */}
            <section className="space-y-4 mt-6">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Análise de Performance</h3>

              <Card className="border-border/50 bg-card/40 overflow-hidden">
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Faturamento Semanal</CardTitle>
                  <BarChart3 className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent className="p-4 pt-0 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }}
                        cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                        formatter={(value: any) => [formatBRL(value), 'Faturamento']}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.earnings > 0 ? '#10B981' : 'hsl(var(--muted))'} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="produtivo">
          <div>
            <section className="space-y-4 mt-6">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Análise Produtiva</h3>
              <Card className="border-border/50 bg-card/40">
                <CardContent className="p-4 divide-y divide-white/5">
                  <AnalyticsRow label="Distância Percorrida" value={`${productiveKm.toFixed(1)} km`} sublabel="Km em corrida" />
                  <AnalyticsRow label="Lucro por Hora" value={formatBRL(netPerHourProductive)} sublabel="Saldo líquido" />
                  <AnalyticsRow label="Faturamento por Hora" value={formatBRL(grossPerHourProductive)} sublabel="Saldo bruto" />
                </CardContent>
              </Card>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="total">
          <div>
            <section className="space-y-4 mt-6">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Análise Total</h3>
              <Card className="border-border/50 bg-card/40">
                <CardContent className="p-4 divide-y divide-white/5">
                  <AnalyticsRow label="Distância Percorrida" value={`${totalKm.toFixed(1)} km`} sublabel="Km total no turno" />
                  <AnalyticsRow label="Lucro por Hora" value={formatBRL(netPerHourTotal)} sublabel="Saldo líquido" />
                  <AnalyticsRow label="Faturamento por Hora" value={formatBRL(grossPerHourTotal)} sublabel="Saldo bruto" />
                  <AnalyticsRow label="Custo por KM" value={formatBRL(costPerKm)} sublabel="Eficiência de custo" />
                </CardContent>
              </Card>
            </section>
          </div>
        </TabsContent>
      </Tabs>

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
