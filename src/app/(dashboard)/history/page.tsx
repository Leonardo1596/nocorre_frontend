
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
      <div className='p-6 space-y-6 max-w-md mx-auto pb-28'>
        <div className='space-y-2'>
          <h2 className='text-3xl font-headline font-bold'>
            Histórico
          </h2>
          <p className='text-sm text-muted-foreground'>
            Revise seu desempenho por período.
          </p>
        </div>

        <div className='flex items-center justify-between bg-card border border-border rounded-2xl p-1.5 shadow-sm'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors'
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className='w-4 h-4' />
          </Button>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='ghost'
                className='flex-1 h-8 gap-2 font-bold text-xs uppercase tracking-wider hover:bg-transparent text-foreground/80'
              >
                <CalendarIcon className='w-3.5 h-3.5 text-primary' />
                {formattedRange}
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
            className='h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors'
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className='w-4 h-4' />
          </Button>
        </div>

        <div className='space-y-6'>
          {dashboard?.summary && (
            <div className='grid grid-cols-2 gap-4'>
              <Card className='border-border bg-card'>
                <CardContent className='p-4'>
                  <p className='text-xs uppercase font-medium text-muted-foreground'>
                    Lucro líquido
                  </p>
                  <p className='text-xl font-bold text-primary'>
                    {formatBRL(dashboard.summary.netProfit)}
                  </p>
                </CardContent>
              </Card>
              <Card className='border-border bg-card'>
                <CardContent className='p-4'>
                  <p className='text-xs uppercase font-medium text-muted-foreground'>
                    Distância
                  </p>
                  <p className='text-xl font-bold text-foreground'>
                    {dashboard.summary.totalKm.toFixed(1)} km
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className='space-y-4'>
            <h3 className='text-sm font-medium text-muted-foreground px-1'>
              Detalhamento Diário
            </h3>
            {daysArray.length > 0 ? (
              daysArray.map((dayData: any) => {
                const date = dayData.date;
                const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
                const distanceKm = dayData.distance?.productiveKm || 0;
                const productiveHours = dayData.distance?.productiveHoursHuman || '0min';

                return (
                  <Card
                    key={date}
                    onClick={() => handleDayClick(dayData)}
                    className='border-border bg-card transition-all duration-200 cursor-pointer hover:border-primary/50'
                  >
                    <CardContent className='p-4 flex items-center justify-between'>
                      <div className='space-y-1.5 flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-bold text-foreground'>
                            {format(parsedDate, 'dd/MM')}
                          </span>
                          <Badge
                            variant='secondary'
                            className='text-xs font-medium'
                          >
                            {dayData.dayName}
                          </Badge>
                        </div>
                        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                          <span className='flex items-center gap-1.5'>
                            <Route className='w-4 h-4' />
                            {distanceKm.toFixed(1)} km
                          </span>
                          <span className='flex items-center gap-1.5'>
                            <Clock className='w-4 h-4' />
                            {productiveHours}
                          </span>
                        </div>
                      </div>
                      <div className='text-right flex items-center gap-2'>
                        <div className='space-y-0.5'>
                          <p className='text-lg font-headline font-bold text-primary'>
                            {formatBRL(dayData.financial.netProfit)}
                          </p>
                          <p className='text-xs text-muted-foreground font-medium'>
                            Líquido
                          </p>
                        </div>
                        <ChevronRight className='w-5 h-5 text-muted-foreground/50' />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className='py-20 text-center space-y-4'>
                {loading ? (
                  <Loader2 className='w-8 h-8 text-primary animate-spin mx-auto' />
                ) : (
                  <>
                    <CalendarIcon className='w-12 h-12 text-muted-foreground mx-auto opacity-20' />
                    <p className='text-sm text-muted-foreground'>
                      Nenhum registro neste período.
                    </p>
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
                <TabsList className="grid w-full grid-cols-2 bg-background border-border">
                  <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                  <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
                </TabsList>
                <TabsContent value="financeiro" className="pt-4">
                  <Card className="border-none bg-transparent shadow-none">
                    <CardContent className="p-0 divide-y divide-border">
                      <AnalyticsRow label="Lucro Líquido" value={<span className="text-primary font-bold">{formatBRL(selectedDay.financial.netProfit)}</span>} />
                      <AnalyticsRow label="Faturamento Bruto" value={formatBRL(selectedDay.financial.grossAmount)} />
                      <AnalyticsRow label="Combustível" value={formatBRL(selectedDay.financial.fuelExpense)} sublabel="Despesa" />
                      <AnalyticsRow label="Alimentação" value={formatBRL(selectedDay.financial.foodExpense)} sublabel="Despesa" />
                      <AnalyticsRow label="Outros" value={formatBRL(selectedDay.financial.otherExpense)} sublabel="Despesa" />
                      <AnalyticsRow label="Total de Despesas" value={formatBRL(selectedDay.financial.totalExpenses)} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="desempenho" className="pt-4">
                  <Card className="border-none bg-transparent shadow-none">
                    <CardContent className="p-0 divide-y divide-border">
                      <AnalyticsRow label="Horas Produtivas" value={selectedDay.distance.productiveHoursHuman} />
                      <AnalyticsRow label="Horas Totais" value={selectedDay.distance.totalHoursHuman} />
                      <AnalyticsRow label="Distância Produtiva" value={`${selectedDay.distance.productiveKm.toFixed(1)} km`} />
                      <AnalyticsRow label="Distância Total" value={`${selectedDay.distance.totalKm.toFixed(1)} km`} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <DialogFooter className="pt-4">
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="gap-2 w-full">
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
