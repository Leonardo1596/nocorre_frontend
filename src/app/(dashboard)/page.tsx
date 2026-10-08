
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
  Calendar as CalendarIcon,
  RotateCcw
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
import { format, startOfWeek, endOfWeek, addDays, subDays, startOfDay, endOfDay, isSameDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from "react-day-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Utilitários de Formatação ---
const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

// Converte strings 'YYYY-MM-DD' ou ISO em Date no fuso horário local exato sem deslocamento de UTC
const parseDateString = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (typeof dateStr === 'string' && dateStr.length >= 10) {
    const ymd = dateStr.substring(0, 10);
    const parts = ymd.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
    }
  }
  return new Date(dateStr);
};

// --- Componentes Reutilizáveis ---

const HeroCard = ({ title, value, subtext, icon: Icon, trendIcon: TrendIcon, trendColor }: any) => (
  <Card className="relative overflow-hidden rounded-3xl border border-primary/20 hero-gradient shadow-xl shadow-primary/5 transition-all duration-300">
    <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
    <CardContent className="p-5 sm:p-6 relative z-10">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl sm:text-4xl font-headline font-black text-foreground tracking-tight tabular-nums">{value}</h3>
          <div className="flex items-center gap-1.5 pt-1">
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
              trendColor?.includes('destructive')
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : trendColor?.includes('primary')
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-secondary text-muted-foreground border-border"
            )}>
              {TrendIcon && <TrendIcon className="w-3.5 h-3.5 shrink-0" />}
              {subtext}
            </span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-primary/15 text-primary border border-primary/25 shadow-inner shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const OperationCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <Card className="rounded-2xl border border-border/70 bg-card/70 hover:bg-card/95 hover:border-border transition-all duration-200 h-full shadow-sm group">
    <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider line-clamp-1 leading-tight">
          {title}
        </p>
        <div className={cn("p-2 rounded-xl bg-secondary/80 border border-white/5 shrink-0 transition-transform group-hover:scale-105", colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="space-y-0.5">
        <h4 className="text-lg sm:text-xl font-headline font-black text-foreground tracking-tight tabular-nums truncate">
          {value}
        </h4>
        <p className="text-[10px] text-muted-foreground font-medium line-clamp-1">
          {subtext}
        </p>
      </div>
    </CardContent>
  </Card>
);

const AnalyticsRow = ({ label, value, sublabel }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-border/40 last:border-0">
    <div className="space-y-0.5">
      <p className="text-xs font-semibold text-foreground/90">{label}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{sublabel}</p>}
    </div>
    <span className="text-sm font-bold font-headline tabular-nums text-foreground">{value}</span>
  </div>
);

// --- Componente Principal ---

export default function Dashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [previousWeekData, setPreviousWeekData] = useState<any>(null);
  const [profitComparison, setProfitComparison] = useState<any>(null);
  const [efficiencyProfitComparison, setEfficiencyProfitComparison] = useState<any>(null);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [showEfficiencyExpenseDetails, setShowEfficiencyExpenseDetails] = useState(false);
  const [fuelPrice, setFuelPrice] = useState<number>(0);
  const [updatingFuel, setUpdatingFuel] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [weeklyDaysCache, setWeeklyDaysCache] = useState<any[]>([]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const isSingleDay = Boolean(
    dateRange?.from &&
    dateRange?.to &&
    isSameDay(dateRange.from, dateRange.to)
  );

  const isTodaySelected = isSingleDay && dateRange?.from && isSameDay(dateRange.from, new Date());
  const isYesterdaySelected = isSingleDay && dateRange?.from && isSameDay(dateRange.from, subDays(new Date(), 1));

  const fetchData = useCallback(async (start: Date, end: Date) => {
    try {
      setLoading(true);
      const startDate = startOfDay(start);
      const endDate = endOfDay(end);
      const timezoneOffset = new Date().getTimezoneOffset();
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      const prevWeekStart = startOfDay(subDays(start, 7));
      const prevWeekEnd = endOfDay(subDays(end, 7));
      const prevStartDateStr = prevWeekStart.toISOString();
      const prevEndDateStr = prevWeekEnd.toISOString();

      const [dashRes, prevWeekRes, settingsRes] = await Promise.all([
        api.get(`/dashboard?start=${startDateStr}&end=${endDateStr}&timezoneOffset=${timezoneOffset}`),
        api.get(`/dashboard?start=${prevStartDateStr}&end=${prevEndDateStr}&timezoneOffset=${timezoneOffset}`),
        api.get('/maintenance-settings')
      ]);

      setData(dashRes.data);
      setPreviousWeekData(prevWeekRes.data);

      if (dashRes.data?.days && dashRes.data.days.length > 1) {
        setWeeklyDaysCache(dashRes.data.days);
      }

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

      const currentEffProfit = data.summary?.efficiency?.netProfit ?? 0;
      const previousEffProfit = previousWeekData.summary?.efficiency?.netProfit ?? 0;

      if (previousEffProfit > 0) {
        const effChange = ((currentEffProfit - previousEffProfit) / previousEffProfit) * 100;
        setEfficiencyProfitComparison({
          percentage: Math.abs(Number(effChange.toFixed(0))),
          isIncrease: effChange >= 0,
        });
      } else {
        setEfficiencyProfitComparison(null);
      }
    } else {
      setProfitComparison(null);
      setEfficiencyProfitComparison(null);
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

  const navigateDate = (direction: 'prev' | 'next') => {
    if (!dateRange?.from || !dateRange?.to) return;
    if (isSingleDay) {
      const offset = direction === 'prev' ? -1 : 1;
      const newFrom = addDays(dateRange.from, offset);
      setDateRange({ from: startOfDay(newFrom), to: endOfDay(newFrom) });
    } else {
      const offset = direction === 'prev' ? -7 : 7;
      const newFrom = addDays(dateRange.from, offset);
      const newTo = addDays(dateRange.to, offset);
      setDateRange({ from: newFrom, to: newTo });
    }
  };

  const handleFilterThisWeek = () => {
    const baseDate = dateRange?.from || new Date();
    setDateRange({
      from: startOfWeek(baseDate, { weekStartsOn: 1 }),
      to: endOfWeek(baseDate, { weekStartsOn: 1 }),
    });
    toast({
      title: "Visão Semanal",
      description: "Exibindo visão consolidada da semana.",
    });
  };

  const handleBarClick = (state: any) => {
    if (!state || !state.activePayload || state.activePayload.length === 0) return;
    const item = state.activePayload[0].payload;
    if (!item?.date) return;

    const clickedDate = parseDateString(item.date);
    if (isNaN(clickedDate.getTime())) return;

    // Se já estiver filtrando exatamente este dia, volta para a semana do período
    if (isSingleDay && dateRange?.from && isSameDay(dateRange.from, clickedDate)) {
      handleFilterThisWeek();
      return;
    }

    setDateRange({
      from: startOfDay(clickedDate),
      to: endOfDay(clickedDate),
    });

    const dayName = item.fullDayName || format(clickedDate, "EEEE", { locale: ptBR });
    toast({
      title: `Filtrando ${dayName}`,
      description: `Métricas de ${format(clickedDate, "dd 'de' MMMM", { locale: ptBR })}.`,
    });
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
  const days = data?.days || [];
  const efficiency = summary.efficiency || {};

  const grossAmount = Number(summary.grossAmount || 0);
  const netProfit = Number(summary.netProfit || 0);
  const efficiencyNetProfit = Number(efficiency.netProfit ?? 0);
  const totalExpenses = Number(summary.totalExpenses || 0);
  const totalKm = Number(summary.totalKm || 0);
  const productiveKm = Number(summary.productiveKm || 0);
  const productiveHours = Number(summary.productiveHours || 0);
  const totalHoursHuman = summary.totalHoursHuman || '0h 0min';
  const productiveHoursHuman = summary.productiveHoursHuman || '0h 0min';

  const fuelExpenses = Number(summary.fuelExpense || 0);
  const maintenanceExpenses = Number(summary.maintenanceExpense || 0);
  const foodExpenses = Number(summary.foodExpense || 0);
  const otherExpenses = Number(summary.otherExpense || 0);

  // Eficiência - Despesas pelo KM Total
  const efficiencyFuelExpenses = Number(efficiency.fuelExpense ?? 0);
  const efficiencyMaintenanceExpenses = Number(efficiency.maintenanceExpense ?? 0);
  const efficiencyTotalExpenses = efficiency.totalExpenses != null
    ? Number(efficiency.totalExpenses)
    : (efficiencyFuelExpenses + efficiencyMaintenanceExpenses + foodExpenses + otherExpenses);

  // Métricas Produtivas (somente período efetivamente trabalhado)
  const grossPerHourProductive = productiveHours > 0 ? grossAmount / productiveHours : 0;
  const netPerHourProductive = productiveHours > 0 ? netProfit / productiveHours : 0;
  const productiveProfitPerKm = Number(summary.productiveProfitPerKm ?? (productiveKm > 0 ? netProfit / productiveKm : 0));
  const grossAmountPerProductiveKm = Number(summary.grossAmountPerProductiveKm ?? (productiveKm > 0 ? grossAmount / productiveKm : 0));

  // Métricas Totais (utilização total do veículo no turno)
  const grossPerTotalKm = totalKm > 0 ? grossAmount / totalKm : 0;

  const displayDays = (isSingleDay && weeklyDaysCache.length > 0) ? weeklyDaysCache : days;

  const chartData = displayDays.map((day: any) => {
    const dayDate = day.date ? parseDateString(day.date) : null;
    return {
      day: day.dayName ? day.dayName.substring(0, 3) : (dayDate ? format(dayDate, 'dd') : ''),
      fullDayName: day.dayName || (dayDate ? format(dayDate, 'EEEE', { locale: ptBR }) : ''),
      date: day.date,
      parsedDate: dayDate,
      earnings: day.financial?.grossAmount || 0,
      profit: day.financial?.netProfit || 0,
    };
  });

  const formattedRange = dateRange?.from && dateRange?.to
    ? isSingleDay
      ? isTodaySelected
        ? `Hoje • ${format(dateRange.from, "dd 'de' MMM", { locale: ptBR })}`
        : isYesterdaySelected
          ? `Ontem • ${format(dateRange.from, "dd 'de' MMM", { locale: ptBR })}`
          : format(dateRange.from, "EEEE, dd 'de' MMM", { locale: ptBR })
      : `${format(dateRange.from, "dd MMM", { locale: ptBR })} - ${format(dateRange.to, "dd MMM", { locale: ptBR })}`
    : dateRange?.from
      ? format(dateRange.from, "dd MMM", { locale: ptBR })
      : "Selecione o período";

  return (
    <div className="p-6 space-y-8 max-w-md mx-auto pb-28">

      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-headline font-black tracking-tight text-foreground">Painel Financeiro</h2>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Sua inteligência de rentabilidade</p>
          </div>

          <Dialog open={showFuelModal} onOpenChange={setShowFuelModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm px-3.5 transition-all">
                <Fuel className="w-4 h-4" />
                <span>Abastecer</span>
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
                <Button onClick={handleFuelUpdate} disabled={updatingFuel} className="w-full h-12 font-bold rounded-2xl">
                  {updatingFuel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  ATUALIZAR AGORA
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* DATE SELECTOR */}
        <div className="flex items-center justify-between bg-card/70 border border-border/80 rounded-2xl p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
            onClick={() => navigateDate('prev')}
            title={isSingleDay ? "Dia anterior" : "Semana anterior"}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 h-9 gap-2 font-bold text-xs uppercase tracking-wider hover:bg-primary/5 text-foreground/90 rounded-xl"
              >
                <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                <span className="capitalize">{formattedRange}</span>
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
            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
            onClick={() => navigateDate('next')}
            title={isSingleDay ? "Próximo dia" : "Próxima semana"}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1.5 h-12 rounded-2xl bg-secondary/70 border border-border/60">
          <TabsTrigger value="geral" className="rounded-xl text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Geral</TabsTrigger>
          <TabsTrigger value="produtivo" className="rounded-xl text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Produtivo</TabsTrigger>
          <TabsTrigger value="total" className="rounded-xl text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Total</TabsTrigger>
          <TabsTrigger value="eficiencia" className="rounded-xl text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Eficiência</TabsTrigger>
        </TabsList>
        <TabsContent value="geral">
          <div className="space-y-6 mt-6">
            {/* 1. HERO METRICS */}
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

            {/* 2. CARDS PEQUENOS */}
            <div className="grid grid-cols-2 gap-3.5">
              <OperationCard
                title="Horas Ativas"
                value={totalHoursHuman}
                subtext="Tempo total em turno"
                icon={Clock}
                colorClass="text-primary"
              />
              <OperationCard
                title="Horas Trabalhadas"
                value={productiveHoursHuman}
                subtext="Tempo produtivo"
                icon={Clock}
                colorClass="text-blue-400"
              />
              <OperationCard
                title="Faturamento Bruto"
                value={formatBRL(grossAmount)}
                subtext="Total recebido"
                icon={DollarSign}
                colorClass="text-emerald-400"
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

            {/* 3. PERFORMANCE SEMANAL */}
            <Card className="border-border/50 bg-card/40 overflow-hidden">
              <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Faturamento por Dia
                    </CardTitle>
                    {isSingleDay && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                        Dia Filtrado
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {isSingleDay
                      ? "Toque na barra selecionada para voltar à semana completa"
                      : "Toque em uma barra para filtrar o dia específico"}
                  </p>
                </div>

                {isSingleDay ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleFilterThisWeek}
                    className="h-7 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2 rounded-lg gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Ver Semana
                  </Button>
                ) : (
                  <BarChart3 className="w-4 h-4 text-primary" />
                )}
              </CardHeader>
              <CardContent className="p-4 pt-1 h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData}
                    onClick={handleBarClick}
                    className="cursor-pointer"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        padding: '8px 12px'
                      }}
                      cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                      formatter={(value: any) => [formatBRL(value), 'Faturamento']}
                      labelFormatter={(label: any, payload: any) => {
                        const item = payload?.[0]?.payload;
                        return item?.fullDayName ? `${item.fullDayName} (Toque para filtrar)` : label;
                      }}
                      itemStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 600 }}
                    />
                    <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry: any, index: number) => {
                        const isSelected = isSingleDay && entry.parsedDate && isSameDay(entry.parsedDate, dateRange!.from!);
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isSelected ? '#10B981' : entry.earnings > 0 ? '#10B981' : 'hsl(var(--muted))'} 
                            fillOpacity={isSingleDay ? (isSelected ? 1 : 0.3) : (entry.earnings > 0 ? 0.8 : 0.4)}
                            stroke={isSelected ? '#34D399' : 'transparent'}
                            strokeWidth={isSelected ? 2 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="produtivo">
          <div className="space-y-4 mt-6">
            <div className="space-y-1 px-0.5">
              <h3 className="text-xs font-bold text-foreground">Desempenho em Trabalho Ativo</h3>
              <p className="text-[11px] text-muted-foreground">Métricas calculadas exclusivamente durante o período de trabalho efetivo (em corrida).</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <OperationCard
                  title="Distância Produtiva"
                  value={`${productiveKm.toFixed(1)} km`}
                  subtext="Total de quilômetros em corrida ativa"
                  icon={TrendingUp}
                  colorClass="text-emerald-400"
                />
              </div>
              <OperationCard
                title="Faturamento/Hora Produtiva"
                value={formatBRL(grossPerHourProductive)}
                subtext="Bruto ÷ horas trabalhadas"
                icon={DollarSign}
                colorClass="text-primary"
              />
              <OperationCard
                title="Lucro/Hora Produtiva"
                value={formatBRL(netPerHourProductive)}
                subtext="Líquido ÷ horas trabalhadas"
                icon={DollarSign}
                colorClass="text-blue-400"
              />
              <OperationCard
                title="Faturamento/KM Produtivo"
                value={`${formatBRL(grossAmountPerProductiveKm)}/km`}
                subtext="Bruto ÷ km produtivo"
                icon={DollarSign}
                colorClass="text-emerald-400"
              />
              <OperationCard
                title="Lucro/KM Produtivo"
                value={`${formatBRL(productiveProfitPerKm)}/km`}
                subtext="Líquido ÷ km produtivo"
                icon={DollarSign}
                colorClass="text-cyan-400"
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="total">
          <div className="space-y-4 mt-6">
            <div className="space-y-1 px-0.5">
              <h3 className="text-xs font-bold text-foreground">Utilização Total do Veículo</h3>
              <p className="text-[11px] text-muted-foreground">Métricas considerando toda a distância percorrida e tempo em turno, incluindo deslocamentos.</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <OperationCard
                title="Distância Total"
                value={`${totalKm.toFixed(1)} km`}
                subtext="Km total no turno"
                icon={TrendingUp}
                colorClass="text-blue-400"
              />
              <OperationCard
                title="Horas em Turno"
                value={totalHoursHuman}
                subtext="Tempo total em operação"
                icon={Clock}
                colorClass="text-primary"
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="eficiencia">
          <div className="space-y-4 mt-6">
            <HeroCard
              title="Lucro Líquido"
              value={formatBRL(efficiencyNetProfit)}
              icon={TrendingUp}
              subtext={efficiencyProfitComparison
                ? `${efficiencyProfitComparison.percentage}% a ${efficiencyProfitComparison.isIncrease ? 'mais' : 'menos'} que na semana anterior`
                : "Calculado com base no KM total"}
              trendIcon={efficiencyProfitComparison ? (efficiencyProfitComparison.isIncrease ? ArrowUpRight : ArrowDownRight) : null}
              trendColor={efficiencyProfitComparison ? (efficiencyProfitComparison.isIncrease ? 'text-primary' : 'text-destructive') : 'text-muted-foreground'}
            />

            <div className="space-y-1 px-0.5">
              <h3 className="text-xs font-bold text-foreground">Impacto da Ociosidade & KM Mortos</h3>
              <p className="text-[11px] text-muted-foreground">Quanto os deslocamentos e tempos sem corrida impactaram seus custos reais.</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <OperationCard
                title="Tempo Ocioso"
                value={efficiency.idleHoursHuman || '0h 0min'}
                subtext="Tempo em turno sem corridas"
                icon={Clock}
                colorClass="text-amber-400"
              />
              <OperationCard
                title="Lucro/Hora Turno"
                value={formatBRL(efficiency.turnProfitPerHour || 0)}
                subtext="Líquido pelas horas totais do turno"
                icon={DollarSign}
                colorClass="text-blue-400"
              />
              <OperationCard
                title="KM Mortos"
                value={`${(efficiency.deadKm || 0).toFixed(1)} km`}
                subtext="Quilometragem sem corrida"
                icon={Fuel}
                colorClass="text-red-400"
              />
              <Dialog open={showEfficiencyExpenseDetails} onOpenChange={setShowEfficiencyExpenseDetails}>
                <DialogTrigger asChild>
                  <div className="cursor-pointer">
                    <OperationCard
                      title="Despesas Totais"
                      value={formatBRL(efficiencyTotalExpenses)}
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
                      Despesas calculadas com base na quilometragem total.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Card className="border-border/50 bg-card/40">
                      <CardContent className="p-4 divide-y divide-white/5">
                        <AnalyticsRow label="Combustível" value={formatBRL(efficiencyFuelExpenses)} />
                        <AnalyticsRow label="Manutenção" value={formatBRL(efficiencyMaintenanceExpenses)} />
                        <AnalyticsRow label="Alimentação" value={formatBRL(foodExpenses)} />
                        <AnalyticsRow label="Outros" value={formatBRL(otherExpenses)} />
                      </CardContent>
                    </Card>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
