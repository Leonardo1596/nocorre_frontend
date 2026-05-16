"use client";

import React, {
  useState,
  useEffect
} from "react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { CurrencyInput } from "@/components/ui/currency-input";

import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import {
  Play,
  Pause,
  StopCircle,
  Car,
  Timer,
  Zap,
  Loader2,
  MapPin
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";

import { useToast } from "@/hooks/use-toast";

import { cn } from "@/lib/utils";

import api from "@/lib/api";

import { useGps } from "@/modules/gps/context/GpsContext";

export default function ShiftPage() {
  const {
    currentShift,
    setCurrentShift,
    currentSession,
    setCurrentSession
  } = useApp();

  const { toast } = useToast();

  const {
    startTracking,
    stopTracking,
    totalKm,
    currentPosition,
    isTracking,
    resetTracking
  } = useGps();

  const [elapsed, setElapsed] =
    useState(0);

  const [
    sessionElapsed,
    setSessionElapsed
  ] = useState(0);

  const [loading, setLoading] =
    useState(false);

  const [
    showFinishDialog,
    setShowFinishDialog
  ] = useState(false);

  /**
   * FINISH SESSION FORM
   */
  const [formData, setFormData] =
    useState({
      grossAmount: 0,
      foodExpense: 0,
      otherExpense: 0
    });

  /**
   * SHIFT TIMER
   */
  useEffect(() => {
    let interval: any;

    if (
      currentShift.isActive &&
      currentShift.startTime
    ) {
      interval = setInterval(() => {
        const start = new Date(
          currentShift.startTime!
        ).getTime();

        setElapsed(
          Math.floor(
            (Date.now() - start) / 1000
          )
        );
      }, 1000);
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [currentShift]);

  /**
   * SESSION TIMER
   */
  useEffect(() => {
    let interval: any;

    if (
      currentSession.isActive &&
      currentSession.startTime &&
      !currentSession.isPaused
    ) {
      interval = setInterval(() => {
        const start = new Date(
          currentSession.startTime!
        ).getTime();

        setSessionElapsed(
          Math.floor(
            (Date.now() - start) / 1000
          )
        );
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [currentSession]);

  useEffect(() => {
    async function restoreTracking() {
      if (
        currentShift.isActive &&
        !isTracking
      ) {
        try {
          await startTracking();

          console.log(
            "GPS restaurado automaticamente"
          );
        } catch (error) {
          console.error(
            "Erro ao restaurar GPS:",
            error
          );
        }
      }
    }

    restoreTracking();
  }, [
    currentShift.isActive,
    isTracking
  ]);

  function formatTime(seconds: number) {
    const h = Math.floor(
      seconds / 3600
    );

    const m = Math.floor(
      (seconds % 3600) / 60
    );

    const s = seconds % 60;

    return `${h
      .toString()
      .padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")}`;
  }

  /**
   * START SHIFT
   */
  async function startShift() {
    setLoading(true);

    try {
      const response =
        await api.post("/shifts/start");

      const id =
        response.data._id ||
        response.data.id;

      await startTracking();

      setCurrentShift({
        id,
        startTime:
          new Date().toISOString(),
        isActive: true
      });

      toast({
        title: "Turno iniciado",
        description:
          "GPS ativo e rastreamento iniciado."
      });
    } catch (error) {
      console.error(error);
      console.log(
        "MESSAGE:",
        error.response?.data?.message
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível iniciar o turno."
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * FINISH SHIFT
   */
  async function finishShift() {
    if (!currentShift.id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "ID do turno não encontrado."
      });

      return;
    }

    setLoading(true);

    try {
      await stopTracking();

      await api.patch(
        `/shifts/${currentShift.id}/finish`,
        {
          totalKm
        }
      );

      resetTracking();

      setCurrentShift({
        id: null,
        startTime: null,
        isActive: false
      });

      setCurrentSession({
        id: null,
        startTime: null,
        isActive: false,
        isPaused: false
      });

      toast({
        title: "Turno finalizado",
        description:
          "Rastreamento encerrado."
      });
    } catch (error) {
      console.error(error);

      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível finalizar o turno."
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * START SESSION
   */
  async function startWorkSession() {
    setLoading(true);

    try {
      const response =
        await api.post(
          "/work-sessions/start"
        );

      const id =
        response.data._id ||
        response.data.id;

      setCurrentSession({
        id,
        startTime:
          new Date().toISOString(),
        isActive: true,
        isPaused: false
      });

      toast({
        title:
          "Sessão iniciada",
        description:
          "Modo produtivo ativo."
      });
    } catch (error) {
      console.error(error);

      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível iniciar sessão."
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * PAUSE SESSION
   */
  async function pauseWorkSession() {
    if (!currentSession.id) return;

    setLoading(true);

    try {
      await api.patch(
        `/work-sessions/${currentSession.id}/pause`
      );

      setCurrentSession({
        ...currentSession,
        isPaused: true
      });

      toast({
        title:
          "Sessão pausada"
      });
    } catch (error) {
      console.error(error);

      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível pausar."
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * RESUME SESSION
   */
  async function resumeWorkSession() {
    if (!currentSession.id) return;

    setLoading(true);

    try {
      await api.patch(
        `/work-sessions/${currentSession.id}/resume`
      );

      setCurrentSession({
        ...currentSession,
        isPaused: false
      });

      toast({
        title:
          "Sessão retomada"
      });
    } catch (error) {
      console.error(error);

      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível retomar."
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * FINISH SESSION
   */
  async function handleFinishSessionSubmit(
    e?: React.FormEvent
  ) {
    if (e) e.preventDefault();

    if (!currentSession.id) {
      return;
    }

    setLoading(true);

    try {
      await api.patch(
        `/work-sessions/${currentSession.id}/finish`,
        {
          grossAmount:
            Number(
              formData.grossAmount
            ),

          foodExpense:
            Number(
              formData.foodExpense
            ),

          otherExpense:
            Number(
              formData.otherExpense
            ),

          productiveKm:
            totalKm
        }
      );

      setCurrentSession({
        id: null,
        startTime: null,
        isActive: false,
        isPaused: false
      });

      setShowFinishDialog(false);

      setFormData({
        grossAmount: 0,
        foodExpense: 0,
        otherExpense: 0
      });

      toast({
        title:
          "Sessão finalizada"
      });
    } catch (error) {
      console.error(error);

      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível finalizar sessão."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-2">
          <Car className="w-8 h-8 text-primary" />
        </div>

        <h2 className="text-2xl font-headline font-bold">
          Gerenciador de Turno
        </h2>

        <p className="text-sm text-muted-foreground">
          Rastreamento inteligente
          com GPS em tempo real.
        </p>
      </div>

      {!currentShift.isActive ? (
        <Button
          onClick={startShift}
          disabled={loading}
          className="w-full h-16 text-lg font-headline font-bold gap-3 rounded-2xl"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Play className="fill-current" />
          )}

          COMEÇAR TURNO
        </Button>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase text-muted-foreground">
                  Tempo de Turno
                </p>

                <p className="text-xl font-bold text-primary">
                  {formatTime(elapsed)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase text-muted-foreground">
                  Tempo Produtivo
                </p>

                <p className="text-xl font-bold text-accent">
                  {formatTime(
                    sessionElapsed
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />

                <h3 className="font-bold">
                  Rastreamento GPS
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  Status:
                  <span className="ml-2 font-bold text-primary">
                    {isTracking
                      ? "ATIVO"
                      : "INATIVO"}
                  </span>
                </p>

                <p>
                  KM Total:
                  <span className="ml-2 font-bold">
                    {totalKm.toFixed(
                      2
                    )}{" "}
                    km
                  </span>
                </p>

                {currentPosition && (
                  <>
                    <p className="text-xs text-muted-foreground break-all">
                      LAT:
                      {" "}
                      {
                        currentPosition.lat
                      }
                    </p>

                    <p className="text-xs text-muted-foreground break-all">
                      LNG:
                      {" "}
                      {
                        currentPosition.lng
                      }
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {!currentSession.isActive ? (
              <Button
                onClick={
                  startWorkSession
                }
                disabled={loading}
                className="h-16 rounded-2xl font-bold"
              >
                <Timer className="w-5 h-5 mr-2" />

                INICIAR TRABALHO
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={
                    currentSession.isPaused
                      ? resumeWorkSession
                      : pauseWorkSession
                  }
                  variant="outline"
                  className="h-16 rounded-2xl font-bold"
                >
                  {currentSession.isPaused ? (
                    <Play className="w-5 h-5 mr-2" />
                  ) : (
                    <Pause className="w-5 h-5 mr-2" />
                  )}

                  {currentSession.isPaused
                    ? "RETOMAR"
                    : "PAUSAR"}
                </Button>

                <Button
                  onClick={() =>
                    setShowFinishDialog(
                      true
                    )
                  }
                  variant="secondary"
                  className="h-16 rounded-2xl font-bold"
                >
                  <StopCircle className="w-5 h-5 mr-2" />

                  FINALIZAR
                </Button>
              </div>
            )}

            <Button
              onClick={finishShift}
              disabled={
                currentSession.isActive
              }
              variant="destructive"
              className="h-14 rounded-2xl font-bold"
            >
              <StopCircle className="w-5 h-5 mr-2" />

              FINALIZAR TURNO
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={showFinishDialog}
        onOpenChange={
          setShowFinishDialog
        }
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Finalizar Sessão
            </DialogTitle>

            <DialogDescription>
              Informe os ganhos e
              despesas da sessão.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={
              handleFinishSessionSubmit
            }
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>
                Ganho Bruto
              </Label>

              <CurrencyInput
                value={
                  formData.grossAmount
                }
                onChange={val =>
                  setFormData({
                    ...formData,
                    grossAmount: val
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Alimentação
              </Label>

              <CurrencyInput
                value={
                  formData.foodExpense
                }
                onChange={val =>
                  setFormData({
                    ...formData,
                    foodExpense: val
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Outros Custos
              </Label>

              <CurrencyInput
                value={
                  formData.otherExpense
                }
                onChange={val =>
                  setFormData({
                    ...formData,
                    otherExpense: val
                  })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-bold"
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2 w-4 h-4" />
                ) : null}

                FINALIZAR SESSÃO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}