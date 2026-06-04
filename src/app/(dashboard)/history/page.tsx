"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  Route,
  Clock,
  ChevronRight,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import api from "@/lib/api";

import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  startOfDay,
  endOfDay,
  parse,
} from "date-fns";

import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function HistoryPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<any | null>(null);
  const [pressingItem, setPressingItem] = useState<string | null>(null);

  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const handlePressStart = (date: string, data: any) => {
    pressTimer.current = setTimeout(() => {
      setDayToDelete(data);
      setIsDeleteDialogOpen(true);
      setPressingItem(null);
    }, 700); // 700ms para acionar a exclusão
    setPressingItem(date);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    setPressingItem(null);
  };

  const fetchHistory = useCallback(async (start: Date, end: Date) => {
    try {
      setLoading(true);
      const startDate = startOfDay(start);
      const endDate = endOfDay(end);
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      const response = await api.get(
        `/dashboard?start=${encodeURIComponent(
          startDateStr
        )}&end=${encodeURIComponent(endDateStr)}`
      );

      setDashboard(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchHistory(dateRange.from, dateRange.to);
    }
  }, [dateRange, fetchHistory]);

  const navigateWeek = (direction: "prev" | "next") => {
    if (!dateRange?.from || !dateRange?.to) return;

    const offset = direction === "prev" ? -7 : 7;
    const newFrom = addDays(dateRange.from, offset);
    const newTo = addDays(dateRange.to, offset);

    setDateRange({ from: newFrom, to: newTo });
  };

  const handleDeleteRequest = async () => {
    if (!dayToDelete) return;
    try {
      setLoading(true);
      const date = dayToDelete.date;
      console.log(`Requesting to delete data for date: ${date}`);
      await Promise.all([
        api.delete(`/shifts/delete-by-date/${date}`),
        api.delete(`/work-sessions/delete-by-date/${date}`),
      ]);
      console.log(`Successfully deleted data for date: ${date}`);
      toast({
        title: "Registro excluído",
        description: "O dia foi removido do seu histórico.",
      });
      if (dateRange?.from && dateRange?.to) {
        fetchHistory(dateRange.from, dateRange.to);
      }
    } catch (error) {
      console.error("Error deleting history:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover o registro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setDayToDelete(null);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          Sincronizando seu histórico...
        </p>
      </div>
    );
  }

  const formattedRange =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "dd MMM", {
          locale: ptBR,
        })} - ${format(dateRange.to, "dd MMM", { locale: ptBR })}`
      : dateRange?.from
      ? format(dateRange.from, "dd MMM", { locale: ptBR })
      : "Selecione o período";

  const daysArray = Array.isArray(dashboard?.days) ? dashboard.days : [];

  return (
    <>
      <div className="p-6 space-y-6 max-w-md mx-auto pb-28">
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold">
            Histórico de Corres
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Revise seu desempenho por período
          </p>
        </div>

        <div className="flex items-center justify-between bg-card/40 border border-border/50 rounded-2xl p-1.5 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => navigateWeek("prev")}
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
            <PopoverContent
              className="w-auto p-0 rounded-2xl border-border"
              align="center"
            >
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
            onClick={() => navigateWeek("next")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {dashboard?.summary && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/50 bg-card/40">
                <CardContent className="p-3">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">
                    Lucro líquido
                  </p>
                  <p className="text-lg font-bold text-primary">
                    R$ {dashboard.summary.netProfit.toFixed(2).replace(".", ",")}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/40">
                <CardContent className="p-3">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">
                    Km total
                  </p>
                  <p className="text-lg font-bold">
                    {dashboard.summary.totalKm.toFixed(1)} km
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/40">
                <CardContent className="p-3">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">
                    Horas produtivas
                  </p>
                  <p className="text-lg font-bold">
                    {dashboard.summary.productiveHoursHuman || "0h"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/40">
                <CardContent className="p-3">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">
                    Faturamento
                  </p>
                  <p className="text-lg font-bold">
                    R$ {dashboard.summary.grossAmount
                      .toFixed(2)
                      .replace(".", ",")}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
              Detalhamento Diário
            </h3>
            {daysArray.length > 0 ? (
              daysArray.map((data: any) => {
                try {
                  const date = data.date;
                  const parsedDate = parse(date, "yyyy-MM-dd", new Date());

                  if (isNaN(parsedDate.getTime())) {
                    console.error(`Invalid date format for: ${date}`);
                    return null;
                  }

                  const distanceKm =
                    typeof data.distance === "object" && data.distance !== null
                      ? data.distance.productiveKm
                      : typeof data.distance === "number"
                      ? data.distance
                      : 0;

                  const productiveHours =
                    typeof data.distance === "object" && data.distance !== null
                      ? data.distance.productiveHoursHuman
                      : "0min";

                  const isPressing = pressingItem === date;

                  return (
                    <Card
                      key={date}
                      onMouseDown={() => handlePressStart(date, data)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                      onTouchStart={() => handlePressStart(date, data)}
                      onTouchEnd={handlePressEnd}
                      className={`border-border/50 bg-card/20 transition-all duration-200 cursor-pointer ${isPressing ? 'transform scale-95 bg-card/30' : 'hover:bg-card/40'}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {format(parsedDate, "dd/MM")}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[9px] font-bold uppercase tracking-wider h-4"
                            >
                              {data.dayName}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Route className="w-3 h-3" />
                              {distanceKm.toFixed(2)} km
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {productiveHours || "0min"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div className="space-y-0.5">
                            <p className="text-lg font-headline font-bold text-primary">
                              R$ {data.financial.netProfit
                                .toFixed(2)
                                .replace(".", ",")}
                            </p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">
                              Líquido
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                } catch (error) {
                  console.error(
                    `Failed to render history item for date: ${data.date}`,
                    error
                  );
                  return null;
                }
              })
            ) : (
              <div className="py-20 text-center space-y-4">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                ) : (
                  <>
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum registro neste período.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
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
            <AlertDialogCancel onClick={handlePressEnd}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequest}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}