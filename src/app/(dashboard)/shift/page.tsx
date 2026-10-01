
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Capacitor } from '@capacitor/core';

import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Play, Pause, StopCircle, Car, Timer, Loader2, MapPin } from "lucide-react";

import { NativeGps } from "@/lib/gps"

import { useApp } from "@/contexts/AppContext";
import { useGps } from "@/contexts/GpsContext";
import { useShift } from "@/contexts/ShiftContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

// --- LocalStorage Keys for State Persistence ---
const SESSION_START_KM_KEY = "session_start_km";
const TOTAL_PAUSED_KM_KEY = "total_paused_km";
const KM_AT_PAUSE_START_KEY = "km_at_pause_start";

export default function ShiftPage() {
  const { currentShift, setCurrentShift, currentSession, setCurrentSession } = useApp();
  const { toast } = useToast();


  const handleOverlayToggle = async () => {
    try {

      if (Capacitor.getPlatform() === "web") {
        toast({
          title: "Indisponível",
          description: "Overlay funciona apenas no Android."
        });
        return;
      }

      const { granted } = await NativeGps.canDrawOverlays();

      if (!granted) {

        await NativeGps.requestOverlayPermission();

        toast({
          title: "Permissão necessária",
          description: "Conceda a permissão e volte ao aplicativo."
        });

        return;
      }

      if (!overlayEnabled) {

        await NativeGps.showOverlay();

        setOverlayEnabled(true);

        toast({
          title: "Overlay ativado"
        });

      } else {

        await NativeGps.hideOverlay();

        setOverlayEnabled(false);

        toast({
          title: "Overlay desativado"
        });

      }

    } catch (error) {

      console.error(error);

      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o overlay."
      });

    }
  };



  const { location, speed, isGpsActive } = useGps();
  const { shiftDistance, startShift: startShiftContext, stopShift: stopShiftContext } = useShift();

  // Create a ref to hold the latest shiftDistance
  const shiftDistanceRef = useRef(shiftDistance);

  const [elapsed, setElapsed] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const [overlayEnabled, setOverlayEnabled] = useState(false);

  const [productiveKm, setProductiveKm] = useState<number>(0);

  const [sessionStartKm, setSessionStartKm] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = window.localStorage.getItem(SESSION_START_KM_KEY);
    return saved ? parseFloat(saved) : 0;
  });

  const [kmAtPauseStart, setKmAtPauseStart] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = window.localStorage.getItem(KM_AT_PAUSE_START_KEY);
    return saved ? parseFloat(saved) : 0;
  });

  const [totalPausedKm, setTotalPausedKm] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = window.localStorage.getItem(TOTAL_PAUSED_KM_KEY);
    return saved ? parseFloat(saved) : 0;
  });

  const [formData, setFormData] = useState({ grossAmount: 0, foodExpense: 0, otherExpense: 0 });
  const [locationIndicator, setLocationIndicator] = useState(false);
  const lastLocationTime = useRef<number | null>(null);

  // Keep the ref updated with the latest shiftDistance
  useEffect(() => {
    shiftDistanceRef.current = shiftDistance;
  }, [shiftDistance]);

  useEffect(() => {
    if (isGpsActive && location) {
      setLocationIndicator(true);
      const timer = setTimeout(() => setLocationIndicator(false), 500);
      lastLocationTime.current = Date.now();
      return () => clearTimeout(timer);
    }
  }, [location, isGpsActive]);

  useEffect(() => {
    if (currentSession.isActive && !currentSession.isPaused) {
      const newProductiveKm =
        shiftDistance -
        sessionStartKm -
        totalPausedKm;

      setProductiveKm(Math.max(0, newProductiveKm));
    }
  }, [
    shiftDistance,
    currentSession.isActive,
    currentSession.isPaused,
    sessionStartKm,
    totalPausedKm,
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentSession.isActive) {
      window.localStorage.setItem(SESSION_START_KM_KEY, sessionStartKm.toString());
      window.localStorage.setItem(TOTAL_PAUSED_KM_KEY, totalPausedKm.toString());
      window.localStorage.setItem(KM_AT_PAUSE_START_KEY, kmAtPauseStart.toString());
    }
  }, [sessionStartKm, totalPausedKm, kmAtPauseStart, currentSession.isActive]);

  useEffect(() => {
    let interval: any;
    if (currentShift.isActive && currentShift.startTime) {
      interval = setInterval(() => {
        const start = new Date(currentShift.startTime!).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [currentShift]);

  useEffect(() => {
    let interval: any;
    if (currentSession.isActive && currentSession.startTime && !currentSession.isPaused) {
      interval = setInterval(() => {
        const start = new Date(currentSession.startTime!).getTime();
        const pausedDuration = currentSession.totalPauseDuration || 0;
        setSessionElapsed(Math.floor((Date.now() - start) / 1000) - pausedDuration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  const clearSessionKmState = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(SESSION_START_KM_KEY);
    window.localStorage.removeItem(TOTAL_PAUSED_KM_KEY);
    window.localStorage.removeItem(KM_AT_PAUSE_START_KEY);
    setProductiveKm(0);
    setSessionStartKm(0);
    setKmAtPauseStart(0);
    setTotalPausedKm(0);
  }

  async function startShift() {
    setLoading(true);
    try {
      const startedAt = new Date().toISOString();
      const timezoneOffset = new Date().getTimezoneOffset();
      const response = await api.post("/shifts/start", { startedAt, timezoneOffset });
      const id = response.data._id || response.data.id;
      setCurrentShift({ id, startTime: startedAt, isActive: true });

      if (Capacitor.getPlatform() !== 'web') {
        startShiftContext();
      }

      toast({ title: "Turno iniciado" });
    } catch (error: any) {
      console.error("Error during startShift:", error);
      toast({ variant: "destructive", title: "Erro ao iniciar turno", description: error.message || error.response?.data?.message || "Não foi possível iniciar o turno." });
    } finally {
      setLoading(false);
    }
  }

  async function finishShift() {
    if (!currentShift.id) {
      toast({ variant: "destructive", title: "Erro", description: "ID do turno não encontrado." });
      return;
    }
    setLoading(true);
    try {
      const totalKm = Number(shiftDistanceRef.current.toFixed(2));

      if (Capacitor.getPlatform() !== 'web') {
        stopShiftContext();
      }

      await api.patch(`/shifts/${currentShift.id}/finish`, { totalKm });

      setCurrentShift({ id: null, startTime: null, isActive: false });
      setCurrentSession({ id: null, startTime: null, isActive: false, isPaused: false, pauseStartTime: null, totalPauseDuration: 0 });

      clearSessionKmState();

      toast({ title: "Turno finalizado", description: `${totalKm} km registrados` });
    } catch (error: any) {
      console.error("Error during finishShift:", error);
      toast({ variant: "destructive", title: "Erro", description: error.response?.data?.message || "Não foi possível finalizar o turno." });
    } finally {
      setLoading(false);
    }
  }

  async function startWorkSession() {
    setLoading(true);
    try {
      clearSessionKmState();
      const startedAt = new Date().toISOString();
      const timezoneOffset = new Date().getTimezoneOffset();
      const response = await api.post("/work-sessions/start", { startedAt, timezoneOffset });
      const id = response.data._id || response.data.id;

      setSessionStartKm(shiftDistanceRef.current);

      setCurrentSession({ id, startTime: new Date().toISOString(), isActive: true, isPaused: false, pauseStartTime: null, totalPauseDuration: 0 });
      toast({ title: "Sessão iniciada", description: "Modo produtivo ativo." });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: error.response?.data?.message || "Não foi possível iniciar sessão." });
    } finally {
      setLoading(false);
    }
  }

  async function pauseWorkSession() {
    if (!currentSession.id) return;

    if (shiftDistanceRef.current <= 0) {
      toast({
        variant: "destructive",
        title: "Não é possível pausar",
        description: "Aguarde o GPS registrar alguma distância antes de pausar."
      });
      return;
    }

    setLoading(true);

    try {
      await api.patch(`/work-sessions/${currentSession.id}/pause`);

      setKmAtPauseStart(shiftDistanceRef.current);

      setCurrentSession(prev => {
        if (!prev) return prev;
        return { ...prev, isPaused: true, pauseStartTime: Date.now() };
      });

      toast({ title: "Sessão pausada" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível pausar." });
    } finally {
      setLoading(false);
    }
  }

  async function resumeWorkSession() {
    if (!currentSession.id || !currentSession.pauseStartTime) return;
    setLoading(true);
    try {
      await api.patch(`/work-sessions/${currentSession.id}/resume`);

      let pausedKm = 0;

      if (kmAtPauseStart > 0) {
        pausedKm = shiftDistanceRef.current - kmAtPauseStart;
      }

      setTotalPausedKm(prev => prev + pausedKm);
      setKmAtPauseStart(0);

      const pauseDuration = Math.floor((Date.now() - currentSession.pauseStartTime) / 1000);

      setCurrentSession(prev => {
        if (!prev) return prev;
        const newTotalPauseDuration = (prev.totalPauseDuration || 0) + pauseDuration;
        return { ...prev, isPaused: false, pauseStartTime: null, totalPauseDuration: newTotalPauseDuration };
      });

      toast({ title: "Sessão retomada" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível retomar." });
    } finally {
      setLoading(false);
    }
  }

  async function handleFinishSessionSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!currentSession.id) return;
    setLoading(true);
    try {
      const productiveKmValue = Number(productiveKm.toFixed(2));
      await api.patch(`/work-sessions/${currentSession.id}/finish`, {
        grossAmount: Number(formData.grossAmount),
        foodExpense: Number(formData.foodExpense),
        otherExpense: Number(formData.otherExpense),
        productiveKm: productiveKmValue
      });

      setCurrentSession({ id: null, startTime: null, isActive: false, isPaused: false, pauseStartTime: null, totalPauseDuration: 0 });
      clearSessionKmState();
      setShowFinishDialog(false);
      setFormData({ grossAmount: 0, foodExpense: 0, otherExpense: 0 });
      toast({ title: "Sessão finalizada", description: `${productiveKmValue} km registrados` });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível finalizar sessão." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-headline font-black tracking-tight text-foreground">Central do Turno</h2>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
            {currentShift.isActive ? "Turno em Andamento" : "Pronto para iniciar"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isGpsActive ? 'default' : 'outline'}
            className={cn(
              "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all",
              isGpsActive 
                ? "bg-primary/15 text-primary border-primary/30" 
                : "bg-secondary text-muted-foreground border-border"
            )}
          >
            <span className="relative flex h-2 w-2">
              {isGpsActive && (
                <span className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75",
                  locationIndicator ? "bg-primary animate-ping" : "bg-primary/50"
                )} />
              )}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", isGpsActive ? "bg-primary" : "bg-muted-foreground")} />
            </span>
            {isGpsActive ? 'GPS Ativo' : 'Sem GPS'}
          </Badge>
        </div>
      </div>

      {!currentShift.isActive ? (
        <div className="space-y-6">
          <Card className="rounded-3xl border border-primary/20 hero-gradient shadow-xl p-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 text-primary mx-auto flex items-center justify-center shadow-inner">
              <Car className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-headline font-black text-foreground">Iniciar Nova Jornada</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Registre cada quilômetro rodado e monitore seu lucro real a cada corrida.
              </p>
            </div>
            
            <div className="p-3 rounded-2xl bg-secondary/60 border border-border/60 text-xs text-muted-foreground flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              <span>O rastreamento de GPS e telemetria começará automaticamente</span>
            </div>
          </Card>

          <Button 
            onClick={startShift} 
            disabled={loading} 
            className="w-full h-16 text-base font-headline font-black gap-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            COMEÇAR TURNO AGORA
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* DUAL CLOCKS */}
          <div className="grid grid-cols-2 gap-3.5">
            <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tempo Turno</p>
              </div>
              <p className="text-2xl font-headline font-black text-foreground tabular-nums tracking-tight">
                {formatTime(elapsed)}
              </p>
              <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Tempo total online</p>
            </Card>

            <Card className={cn(
              "rounded-2xl border shadow-sm p-4 transition-all duration-300",
              currentSession.isActive
                ? (currentSession.isPaused
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-primary/40 bg-primary/10 shadow-primary/5")
                : "border-border/80 bg-card/80"
            )}>
              <div className="flex items-center gap-2 mb-1.5">
                <Timer className={cn(
                  "w-4 h-4",
                  currentSession.isActive 
                    ? (currentSession.isPaused ? "text-amber-500" : "text-primary animate-pulse") 
                    : "text-muted-foreground"
                )} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tempo Produtivo</p>
              </div>
              <p className={cn(
                "text-2xl font-headline font-black tabular-nums tracking-tight",
                currentSession.isActive
                  ? (currentSession.isPaused ? "text-amber-500" : "text-primary")
                  : "text-muted-foreground"
              )}>
                {formatTime(sessionElapsed)}
              </p>
              <p className="text-[9px] text-muted-foreground font-medium mt-0.5">
                {currentSession.isActive 
                  ? (currentSession.isPaused ? "Corrida em pausa" : "Em corrida agora")
                  : "Nenhuma corrida ativa"}
              </p>
            </Card>
          </div>

          {/* TELEMETRY HUD & SPEEDOMETER */}
          <Card className="rounded-3xl border border-border/80 hud-panel overflow-hidden">
            <CardHeader className="p-4 pb-2 flex-row items-center justify-between border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Painel de Telemetria
              </CardTitle>

              {overlayEnabled && (
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Overlay Ativo
                </span>
              )}
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* SPEEDOMETER DISPLAY */}
              <div className="relative py-4 px-6 rounded-2xl bg-secondary/40 border border-border/60 text-center flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Velocidade Atual
                </p>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-5xl sm:text-6xl font-headline font-black tracking-tight tabular-nums text-foreground">
                    {speed.toFixed(0)}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground uppercase">
                    km/h
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <span>LAT: {location?.latitude ? location.latitude.toFixed(4) : "—"}</span>
                  <span>·</span>
                  <span>LNG: {location?.longitude ? location.longitude.toFixed(4) : "—"}</span>
                </div>
              </div>

              {/* DISTANCE METRICS GRID */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/50">
                  <Car className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Distância Total</p>
                  <p className="text-xl font-headline font-black text-foreground tabular-nums">
                    {shiftDistance.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">km</span>
                  </p>
                </div>

                <div className={cn(
                  "p-3.5 rounded-2xl border transition-colors",
                  currentSession.isActive
                    ? (currentSession.isPaused 
                        ? "bg-amber-500/10 border-amber-500/30" 
                        : "bg-primary/10 border-primary/30")
                    : "bg-secondary/50 border-border/50"
                )}>
                  <Timer className={cn("w-5 h-5 mx-auto mb-1.5", currentSession.isActive ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Distância Produtiva</p>
                  <p className={cn(
                    "text-xl font-headline font-black tabular-nums",
                    currentSession.isActive ? "text-primary" : "text-foreground"
                  )}>
                    {productiveKm.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">km</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleOverlayToggle}
              variant="outline"
              className={cn(
                "w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all",
                overlayEnabled
                  ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-md shadow-blue-600/20"
                  : "border-border/80 hover:bg-secondary"
              )}
            >
              <Eye className="w-4 h-4 mr-2" />
              {overlayEnabled ? "Desativar Floating Overlay" : "Ativar Floating Overlay"}
            </Button>

            {!currentSession.isActive ? (
              <Button 
                onClick={startWorkSession} 
                disabled={loading || !isGpsActive} 
                className="w-full h-16 rounded-2xl font-headline font-black text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                <Timer className="w-5 h-5 mr-1" />
                INICIAR TRABALHO
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={currentSession.isPaused ? resumeWorkSession : pauseWorkSession} 
                  variant="outline" 
                  className={cn(
                    "h-16 rounded-2xl font-bold text-sm gap-2 transition-all",
                    currentSession.isPaused 
                      ? "border-primary text-primary hover:bg-primary/10" 
                      : "border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  )}
                >
                  {currentSession.isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                  {currentSession.isPaused ? "RETOMAR" : "PAUSAR"}
                </Button>
                
                <Button 
                  onClick={() => setShowFinishDialog(true)} 
                  className="h-16 rounded-2xl font-bold text-sm gap-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md transition-all" 
                  disabled={currentSession.isPaused}
                >
                  <StopCircle className="w-5 h-5" />
                  FINALIZAR SESSÃO
                </Button>
              </div>
            )}

            <Button 
              onClick={finishShift} 
              disabled={currentSession.isActive || loading} 
              variant="ghost" 
              className="w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Finalizar Turno Completo
            </Button>
          </div>
        </div>
      )}

      {/* FINISH SESSION MODAL */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="max-w-[90vw] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl font-black">Finalizar Sessão de Trabalho</DialogTitle>
            <DialogDescription>
              Informe o faturamento e despesas ocorridas durante esta corrida/sessão.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFinishSessionSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Faturamento Bruto</Label>
              <CurrencyInput 
                value={formData.grossAmount} 
                onChange={val => setFormData({ ...formData, grossAmount: val })} 
                className="h-12 rounded-xl text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alimentação (se houver)</Label>
              <CurrencyInput 
                value={formData.foodExpense} 
                onChange={val => setFormData({ ...formData, foodExpense: val })} 
                className="h-12 rounded-xl text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Outros Custos (pedágio, etc)</Label>
              <CurrencyInput 
                value={formData.otherExpense} 
                onChange={val => setFormData({ ...formData, otherExpense: val })} 
                className="h-12 rounded-xl text-lg font-bold"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={loading} className="w-full h-12 font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                REGISTRAR SESSÃO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
