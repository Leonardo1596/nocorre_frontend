
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar as CalendarIcon,
  Route,
  Clock,
  ChevronRight,
  Loader2,
  ChevronLeft,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '@/lib/api';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  startOfDay,
  endOfDay,
  parse,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const formatBRL = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const capitalize = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const AnalyticsRow = ({ label, value, sublabel }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
    <div className="space-y-0.5">
      <p className="text-sm font-medium text-foreground/80">{label}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{sublabel}</p>}
    </div>
    <span className="text-sm font-bold font-headline text-foreground">{value}</span>
  </div>
);

export default function HistoryPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const handleDayClick = (dayData: any) => {
    setSelectedDay(dayData);
    setIsDetailsModalOpen(true);
  };

  const fetchHistory = useCallback(async (start: Date, end: Date) => {
    try {
      setLoading(true);
      const startDate = startOfDay(start);
      const endDate = endOfDay(end);
      const timezoneOffset = new Date().getTimezoneOffset();

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      const response = await api.get(
        `/dashboard?start=${startDateStr}&end=${endDateStr}&timezoneOffset=${timezoneOffset}`
      );

      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchHistory(dateRange.from, dateRange.to);
    }
  }, [dateRange, fetchHistory]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!dateRange?.from || !dateRange?.to) return;

    const offset = direction === 'prev' ? -7 : 7;
    const newFrom = addDays(dateRange.from, offset);
    const newTo = addDays(dateRange.to, offset);

    setDateRange({ from: newFrom, to: newTo });
  };

  const handleDeleteRequest = async () => {
    if (!selectedDay) return;
    try {
      setLoading(true);
      setIsDetailsModalOpen(false);
      const date = selectedDay.date;
      const timezoneOffset = new Date().getTimezoneOffset();

      await Promise.all([
        api.delete(
          `/shifts/delete-by-date/${date}?timezoneOffset=${timezoneOffset}`
        ),
        api.delete(
          `/work-sessions/delete-by-date/${date}?timezoneOffset=${timezoneOffset}`
        ),
      ]);
      
      if (dateRange?.from && dateRange?.to) {
        await fetchHistory(dateRange.from, dateRange.to);
      }
      
      toast({
        title: 'Registro excluído',
        description: 'O dia foi removido do seu histórico.',
      });

      setSelectedDay(null);
    } catch (error) {
      console.error('Error deleting history:', error);

      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o registro.',
        variant: 'destructive',
      });
    } finally {
      document.body.style.pointerEvents = '';
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setSelectedDay(null);
    }
  };
  
  if (loading && !dashboard) {
    return (
      <div className='min-h-[80vh] flex flex-col items-center justify-center gap-4'>
        <Loader2 className='w-10 h-10 text-primary animate-spin' />
        <p className='text-sm text-muted-foreground animate-pulse font-medium'>
          Sincronizando seu histórico...
        </p>
      </div>
    );
  }

  const formattedRange =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, 'dd MMM', {
        locale: ptBR,
      })} - ${format(dateRange.to, 'dd MMM', { locale: ptBR })}`
      : dateRange?.from
        ? format(dateRange.from, 'dd MMM', { locale: ptBR })
        : 'Selecione o período';

  const daysArray = Array.isArray(dashboard?.days) ? dashboard.days : [];

  return (
    <>
      <div className='p-4 sm:p-6 space-y-6 max-w-md mx-auto pb-28 animate-in fade-in duration-300'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-headline font-black tracking-tight text-foreground'>
              Histórico
            </h2>
            <p className='text-[10px] text-muted-foreground font-semibold uppercase tracking-widest'>
              Desempenho por período
            </p>
          </div>
          {daysArray.length > 0 && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full">
              {daysArray.length} {daysArray.length === 1 ? 'dia' : 'dias'}
            </Badge>
          )}
        </div>

        {/* Date Selector */}
        <div className='flex items-center justify-between bg-card/70 border border-border/80 rounded-2xl p-1 shadow-sm'>
          <Button
            variant='ghost'
            size='icon'
            className='h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground'
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className='w-4 h-4' />
          </Button>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='ghost'
                className='flex-1 h-9 gap-2 font-bold text-xs uppercase tracking-wider hover:bg-primary/5 text-foreground/90 rounded-xl'
              >
                <CalendarIcon className='w-4 h-4 text-primary shrink-0' />
                <span>{formattedRange}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className='w-auto p-0 rounded-2xl border-border'
              align='center'
            >
              <Calendar
                initialFocus
                mode='range'
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
            variant='ghost'
            size='icon'
            className='h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground'
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className='w-4 h-4' />
          </Button>
        </div>

        <div className='space-y-6'>
          {/* Summary Cards */}
          {dashboard?.summary && (
            <div className='grid grid-cols-2 gap-3.5'>
              <Card className='relative overflow-hidden rounded-2xl border border-primary/20 bg-card/80 p-4 shadow-sm group hover:border-primary/40 transition-all'>
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
                <div className="space-y-2 relative z-10">
                  <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                    Lucro Líquido
                  </p>
                  <p className='text-xl sm:text-2xl font-headline font-black text-primary tabular-nums tracking-tight'>
                    {formatBRL(dashboard.summary.netProfit)}
                  </p>
                  <p className='text-[9px] text-muted-foreground/80 font-medium'>
                    Bruto: {formatBRL(dashboard.summary.grossAmount || 0)}
                  </p>
                </div>
              </Card>

              <Card className='relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm group hover:border-border transition-all'>
                <div className="space-y-2">
                  <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                    Distância Produtiva
                  </p>
                  <p className='text-xl sm:text-2xl font-headline font-black text-foreground tabular-nums tracking-tight'>
                    {(dashboard.summary.productiveKm || 0).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">km</span>
                  </p>
                  <p className='text-[9px] text-muted-foreground/80 font-medium'>
                    Total: {dashboard.summary.totalKm.toFixed(1)} km
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Daily Breakdown List */}
          <div className='space-y-3'>
            <div className="flex items-center justify-between px-1">
              <h3 className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                Jornadas Diárias
              </h3>
            </div>

            {daysArray.length > 0 ? (
              <div className="space-y-2.5">
                {daysArray.map((dayData: any) => {
                  const date = dayData.date;
                  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
                  const distanceKm = dayData.distance?.productiveKm || 0;
                  const productiveHours = dayData.distance?.productiveHoursHuman || '0min';

                  return (
                    <Card
                      key={date}
                      onClick={() => handleDayClick(dayData)}
                      className='rounded-2xl border border-border/70 bg-card/70 hover:bg-card/95 hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] group'
                    >
                      <CardContent className='p-4 flex items-center justify-between'>
                        <div className='space-y-1.5 flex-1 pr-3'>
                          <div className='flex items-center gap-2'>
                            <span className='font-headline font-bold text-base text-foreground'>
                              {format(parsedDate, 'dd/MM')}
                            </span>
                            <Badge
                              variant='secondary'
                              className='text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary/80 text-foreground/80 border border-white/5'
                            >
                              {dayData.dayName}
                            </Badge>
                          </div>
                          <div className='flex items-center gap-3.5 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1.5 font-medium'>
                              <Route className='w-3.5 h-3.5 text-primary/70' />
                              {distanceKm.toFixed(1)} km
                            </span>
                            <span className='flex items-center gap-1.5 font-medium'>
                              <Clock className='w-3.5 h-3.5 text-primary/70' />
                              {productiveHours}
                            </span>
                          </div>
                        </div>

                        <div className='text-right flex items-center gap-2.5'>
                          <div className='space-y-0.5'>
                            <p className='text-base sm:text-lg font-headline font-black text-primary tabular-nums tracking-tight'>
                              {formatBRL(dayData.financial.netProfit)}
                            </p>
                            <p className='text-[10px] text-muted-foreground font-semibold uppercase tracking-wider'>
                              Líquido
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            <ChevronRight className='w-4 h-4' />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className='py-16 text-center space-y-3 bg-card/40 rounded-2xl border border-dashed border-border/80'>
                {loading ? (
                  <Loader2 className='w-8 h-8 text-primary animate-spin mx-auto' />
                ) : (
                  <>
                    <CalendarIcon className='w-10 h-10 text-muted-foreground/40 mx-auto' />
                    <div className="space-y-1">
                      <p className='text-sm font-semibold text-foreground'>
                        Nenhum registro encontrado
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Não foram realizadas corridas neste período.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl bg-card border-border">
          {selectedDay && (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">
                  {capitalize(format(parse(selectedDay.date, 'yyyy-MM-dd', new Date()), 'eeee, dd/MM/yyyy', { locale: ptBR }))}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="financeiro" className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1.5 h-11 rounded-2xl bg-secondary/70 border border-border/60">
                  <TabsTrigger value="financeiro" className="rounded-xl text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Financeiro</TabsTrigger>
                  <TabsTrigger value="desempenho" className="rounded-xl text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Desempenho</TabsTrigger>
                </TabsList>
                <TabsContent value="financeiro" className="pt-2">
                  <Card className="border-none bg-transparent shadow-none">
                    <CardContent className="p-0 divide-y divide-border/40">
                      <AnalyticsRow label="Lucro Líquido" value={<span className="text-primary font-bold">{formatBRL(selectedDay.financial.netProfit)}</span>} />
                      <AnalyticsRow label="Faturamento Bruto" value={formatBRL(selectedDay.financial.grossAmount)} />
                      <AnalyticsRow label="Combustível" value={formatBRL(selectedDay.financial.fuelExpense)} sublabel="Despesa" />
                      <AnalyticsRow label="Alimentação" value={formatBRL(selectedDay.financial.foodExpense)} sublabel="Despesa" />
                      <AnalyticsRow label="Outros" value={formatBRL(selectedDay.financial.otherExpense)} sublabel="Despesa" />
                      <AnalyticsRow label="Total de Despesas" value={formatBRL(selectedDay.financial.totalExpenses)} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="desempenho" className="pt-2">
                  <Card className="border-none bg-transparent shadow-none">
                    <CardContent className="p-0 divide-y divide-border/40">
                      <AnalyticsRow label="Horas Produtivas" value={selectedDay.distance.productiveHoursHuman} />
                      <AnalyticsRow label="Horas Totais" value={selectedDay.distance.totalHoursHuman} />
                      <AnalyticsRow label="Distância Produtiva" value={`${selectedDay.distance.productiveKm.toFixed(1)} km`} />
                      <AnalyticsRow label="Distância Total" value={`${selectedDay.distance.totalKm.toFixed(1)} km`} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <DialogFooter className="pt-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(true)} 
                  className="gap-2 w-full h-11 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold text-xs uppercase tracking-wider transition-colors"
                >
                  <Trash2 className="w-4 h-4"/>
                  Excluir Registro do Dia
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              registro do dia e removerá os dados de nossos servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequest}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
