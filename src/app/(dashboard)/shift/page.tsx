"use client";

import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import { Capacitor } from '@capacitor/core';
import { NativeGps } from "../../../lib/gps"; // Adjust path as needed

import haversine from 'haversine-distance';

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent
} from "@/components/ui/card";

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
  Loader2,
  MapPin
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

import api from "@/lib/api";

export default function ShiftPage() {

  const {
    currentShift,
    setCurrentShift,
    currentSession,
    setCurrentSession
  } = useApp();

  const { toast } = useToast();

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

  // GPS State
  const [gpsStatus, setGpsStatus] = useState<'off' | 'on' | 'error'>('off');
  const [coords, setCoords] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
  const [accumulatedKm, setAccumulatedKm] = useState<number>(0);
  const lastPositionRef = useRef<any>(null);
  const locationListenerRef = useRef<any>(null);


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

        const pausedDuration = currentSession.totalPauseDuration || 0;

        setSessionElapsed(
          Math.floor(
            (Date.now() - start) / 1000
          ) - pausedDuration
        );

      }, 1000);

    }

    return () => clearInterval(interval);

  }, [currentSession]);


  /**
   * GPS LIFECYCLE
   */
  useEffect(() => {
    // Cleanup listener on component unmount
    return () => {
      stopGpsTracking();
    };
  }, []);

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

  const startGpsTracking = async () => {
    if (Capacitor.getPlatform() === 'web') {
      console.log("GPS tracking not available on web.");
      return;
    }

    try {
      console.log("ANTES START GPS");

      await NativeGps.startGps();

      console.log("GPS INICIADO COM SUCESSO");

      setGpsStatus('on');
      lastPositionRef.current = null;
      setAccumulatedKm(0);
      setCoords({
        lat: null,
        lng: null
      });

      locationListenerRef.current =
        await NativeGps.addListener(
          "locationUpdate",
          (location) => {

            console.log(
              "LOCATION UPDATE",
              location
            );

            if (
              !location ||
              !location.latitude ||
              !location.longitude
            ) {
              return;
            }

            const newPosition = {
              lat: location.latitude,
              lng: location.longitude
            };

            setCoords(newPosition);

            if (
              lastPositionRef.current
            ) {

              const distanceMeters =
                haversine(
                  lastPositionRef.current,
                  newPosition
                );

              console.log(
                "DISTANCIA:",
                distanceMeters
              );

              setAccumulatedKm(
                prevKm =>
                  prevKm +
                  distanceMeters / 1000
              );
            }

            lastPositionRef.current =
              newPosition;
          }
        );

    } catch (error: any) {
      console.error("Failed to start GPS", error);
      toast({
        variant: "destructive",
        title: "Erro ao iniciar GPS",
        description: error.message || "Não foi possível ligar o GPS.",
      });
      setGpsStatus('error');
    }
  };

  const stopGpsTracking = async () => {
    if (Capacitor.getPlatform() === 'web') return;

    if (locationListenerRef.current) {
      await locationListenerRef.current.remove();
      locationListenerRef.current = null;
    }

    try {
      await NativeGps.stopGps();
      lastPositionRef.current = null;
      setGpsStatus('off');
    } catch (error: any) {
      console.error("Failed to stop GPS", error);
      toast({
        variant: "destructive",
        title: "Erro ao parar GPS",
        description: error.message || "Não foi possível desligar o GPS.",
      });
    }
  };

  /**
   * START SHIFT
   */
  async function startShift() {
    setLoading(true);

    try {
      const response = await api.post("/shifts/start");
      const id = response.data._id || response.data.id;

      console.log("Turno iniciado:", response.data);

      setCurrentShift({
        id,
        startTime: new Date().toISOString(),
        isActive: true
      });

      await startGpsTracking();

      toast({
        title: "Turno iniciado"
      });

    } catch (error: any) {
      console.error("Error during startShift:", error);
      const message = error.message || error.response?.data?.message || "Não foi possível iniciar o turno.";

      toast({
        variant: "destructive",
        title: "Erro ao iniciar turno",
        description: message
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
      description: "ID do turno não encontrado."
    });

    return;
  }

  setLoading(true);

  try {

    const totalKm = Number(
      accumulatedKm.toFixed(2)
    );

    await stopGpsTracking();

    await api.patch(
      `/shifts/${currentShift.id}/finish`,
      {
        totalKm
      }
    );

    setCurrentShift({
      id: null,
      startTime: null,
      isActive: false
    });

    setCurrentSession({
      id: null,
      startTime: null,
      isActive: false,
      isPaused: false,
      pauseStartTime: null,
      totalPauseDuration: 0
    });

    setAccumulatedKm(0);

    toast({
      title: "Turno finalizado",
      description: `${totalKm} km registrados`
    });

  } catch (error: any) {

    console.error(
      "Error during finishShift:",
      error
    );

    toast({
      variant: "destructive",
      title: "Erro",
      description:
        error.response?.data?.message ||
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
        isPaused: false,
        pauseStartTime: null,
        totalPauseDuration: 0
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
        isPaused: true,
        pauseStartTime: Date.now()
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

    if (!currentSession.id || !currentSession.pauseStartTime) return;

    setLoading(true);

    try {

      await api.patch(
        `/work-sessions/${currentSession.id}/resume`
      );

      const pauseDuration = Math.floor((Date.now() - currentSession.pauseStartTime) / 1000);
      const newTotalPauseDuration = (currentSession.totalPauseDuration || 0) + pauseDuration;

      setCurrentSession({
        ...currentSession,
        isPaused: false,
        pauseStartTime: null,
        totalPauseDuration: newTotalPauseDuration
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
        }
      );

      setCurrentSession({
        id: null,
        startTime: null,
        isActive: false,
        isPaused: false,
        pauseStartTime: null,
        totalPauseDuration: 0
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
          Controle do seu turno de trabalho.
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

                <p className="text-xl font.bold text-primary">
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
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                <p className="text-sm uppercase text-muted-foreground font-bold">
                  GPS
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm flex justify-between">
                  <span>Status:</span>
                  <span className={`font-bold ${gpsStatus === 'on' ? 'text-green-500' : 'text-red-500'}`}>
                    {gpsStatus.toUpperCase()}
                  </span>
                </p>
                <p className="text-sm flex justify-between">
                  <span>Distância:</span>
                  <span className="font-bold">{accumulatedKm.toFixed(2)} km</span>
                </p>
                <p className="text-xs text-muted-foreground pt-2">
                  Lat: {coords.lat ? coords.lat.toFixed(5) : 'N/A'}, Lng: {coords.lng ? coords.lng.toFixed(5) : 'N/A'}
                </p>
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
                currentSession.isActive || loading
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
                Faturamento Bruto
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
                className="w-full h-12 font-bold rounded-xl"
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
