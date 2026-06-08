
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Capacitor } from '@capacitor/core';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Play, Pause, StopCircle, Car, Timer, Loader2, MapPin } from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useGps } from "@/contexts/GpsContext";
import { useShift } from "@/contexts/ShiftContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

// --- LocalStorage Keys for State Persistence ---
const SESSION_START_KM_KEY = "session_start_km";
const TOTAL_PAUSED_KM_KEY = "total_paused_km";

export default function ShiftPage() {
  const { currentShift, setCurrentShift, currentSession, setCurrentSession } = useApp();
  const { toast } = useToast();
  const { location, isGpsActive } = useGps();
  const { accumulatedDistance, startShift: startShiftContext, stopShift: stopShiftContext } = useShift();

  const [elapsed, setElapsed] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const [productiveKm, setProductiveKm] = useState<number>(0);
  
  // --- State Persistence ---
  const [sessionStartKm, setSessionStartKm] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = window.localStorage.getItem(SESSION_START_KM_KEY);
    return saved ? parseFloat(saved) : 0;
  });
  
  const [kmAtPauseStart, setKmAtPauseStart] = useState<number>(0); // This is temporary and doesn't need persistence
  
  const [totalPausedKm, setTotalPausedKm] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = window.localStorage.getItem(TOTAL_PAUSED_KM_KEY);
    return saved ? parseFloat(saved) : 0;
  });

  const [formData, setFormData] = useState({ grossAmount: 0, foodExpense: 0, otherExpense: 0 });
  const [locationIndicator, setLocationIndicator] = useState(false);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<number>(0);
  const lastLocationTime = useRef<number | null>(null);

  useEffect(() => {
    if (isGpsActive && location) {
      setLocationIndicator(true);
      const timer = setTimeout(() => setLocationIndicator(false), 500);

      const now = Date.now();
      if (lastLocationTime.current) {
        const interval = (now - lastLocationTime.current) / 1000;
        setLocationUpdateInterval(interval);
      }
      lastLocationTime.current = now;

      return () => clearTimeout(timer);
    }
  }, [location, isGpsActive]);

  // --- Productive KM Calculation ---
  useEffect(() => {
    if (currentSession.isActive && !currentSession.isPaused) {
      const newProductiveKm = accumulatedDistance - sessionStartKm - totalPausedKm;
      setProductiveKm(Math.max(0, newProductiveKm));
    }
  }, [accumulatedDistance, currentSession.isActive, currentSession.isPaused, sessionStartKm, totalPausedKm]);

  // --- Persist Session KM State ---
  useEffect(() => {
    if (typeof window !== 'undefined' && currentSession.isActive) {
      window.localStorage.setItem(SESSION_START_KM_KEY, sessionStartKm.toString());
      window.localStorage.setItem(TOTAL_PAUSED_KM_KEY, totalPausedKm.toString());
    }
  }, [sessionStartKm, totalPausedKm, currentSession.isActive]);

  // --- Timers ---
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

  // --- Shift/Session Actions ---

  const clearSessionKmState = () => {
    window.localStorage.removeItem(SESSION_START_KM_KEY);
    window.localStorage.removeItem(TOTAL_PAUSED_KM_KEY);
    setProductiveKm(0);
    setSessionStartKm(0);
    setKmAtPauseStart(0);
    setTotalPausedKm(0);
  }

  async function startShift() {
    setLoading(true);
    try {
      const response = await api.post("/shifts/start");
      const id = response.data._id || response.data.id;
      setCurrentShift({ id, startTime: new Date().toISOString(), isActive: true });
      
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
      const totalKm = Number(accumulatedDistance.toFixed(2));
      
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
      const response = await api.post("/work-sessions/start");
      const id = response.data._id || response.data.id;
      
      // Clear any previous state and set new starting point
      clearSessionKmState();
      setSessionStartKm(accumulatedDistance);

      setCurrentSession({ id, startTime: new Date().toISOString(), isActive: true, isPaused: false, pauseStartTime: null, totalPauseDuration: 0 });
      toast({ title: "Sessão iniciada", description: "Modo produtivo ativo." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível iniciar sessão." });
    } finally {
      setLoading(false);
    }
  }

  async function pauseWorkSession() {
    if (!currentSession.id) return;
    setLoading(true);
    try {
      await api.patch(`/work-sessions/${currentSession.id}/pause`);
      setKmAtPauseStart(accumulatedDistance); // Record KM at the moment of pausing
      setCurrentSession({ ...currentSession, isPaused: true, pauseStartTime: Date.now() });
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
        pausedKm = accumulatedDistance - kmAtPauseStart;
      }
      setTotalPausedKm(prev => prev + pausedKm);
      setKmAtPauseStart(0);

      const pauseDuration = Math.floor((Date.now() - currentSession.pauseStartTime) / 1000);
      const newTotalPauseDuration = (currentSession.totalPauseDuration || 0) + pauseDuration;

      setCurrentSession({ ...currentSession, isPaused: false, pauseStartTime: null, totalPauseDuration: newTotalPauseDuration });
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
      toast({ title: "Sessão finalizada" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível finalizar sessão." });
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
        <h2 className="text-2xl font-headline font-bold">Gerenciador de Turno</h2>
        <p className="text-sm text-muted-foreground">Controle do seu turno de trabalho.</p>
      </div>

      {!currentShift.isActive ? (
        <Button onClick={startShift} disabled={loading} className="w-full h-16 text-lg font-headline font-bold gap-3 rounded-2xl">
          {loading ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
          COMEÇAR TURNO
        </Button>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase text-muted-foreground">Tempo de Turno</p>
                <p className="text-xl font-bold text-primary">{formatTime(elapsed)}</p>
              </CardContent>
            </Card>
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase text-muted-foreground">Tempo Produtivo</p>
                <p className="text-xl font-bold text-accent">{formatTime(sessionElapsed)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-bold flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                Painel de Distância
              </CardTitle>
              <Badge variant={isGpsActive ? 'default' : 'outline'} className="flex items-center">
                {isGpsActive && (
                  <div className="relative flex items-center justify-center w-3 h-3 mr-2">
                    <div className={`absolute w-full h-full rounded-full ${locationIndicator ? 'bg-green-500 animate-ping' : ''}`}></div>
                    <div className={`w-2 h-2 rounded-full ${locationIndicator ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                )}
                {isGpsActive ? 'GPS Ativo' : 'GPS Inativo'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                    <Car className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Distância do Turno</p>
                    <p className="text-2xl font-bold">{accumulatedDistance.toFixed(2)} <span className="text-base font-normal text-muted-foreground">km</span></p>
                </div>
                <div className={`p-4 rounded-lg ${currentSession.isActive ? (currentSession.isPaused ? 'bg-amber-500/10' : 'bg-green-500/10') : 'bg-muted/50'}`}>
                    <Timer className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Distância Produtiva</p>
                    <p className={`text-2xl font-bold ${currentSession.isActive ? (currentSession.isPaused ? 'text-amber-600' : 'text-green-600') : ''}`}>{productiveKm.toFixed(2)} <span className="text-base font-normal text-muted-foreground">km</span></p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                  Coords: {location?.latitude ? location.latitude.toFixed(4) : 'N/A'}, {location?.longitude ? location.longitude.toFixed(4) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {!currentSession.isActive ? (
              <Button onClick={startWorkSession} disabled={loading || !isGpsActive} className="h-16 rounded-2xl font-bold">
                <Timer className="w-5 h-5 mr-2" />
                INICIAR TRABALHO
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={currentSession.isPaused ? resumeWorkSession : pauseWorkSession} variant="outline" className="h-16 rounded-2xl font-bold">
                  {currentSession.isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                  {currentSession.isPaused ? "RETOMAR" : "PAUSAR"}
                </Button>
                <Button onClick={() => setShowFinishDialog(true)} variant="secondary" className="h-16 rounded-2xl font-bold">
                  <StopCircle className="w-5 h-5 mr-2" />
                  FINALIZAR
                </Button>
              </div>
            )}

            <Button onClick={finishShift} disabled={currentSession.isActive || loading} variant="destructive" className="h-14 rounded-2xl font-bold">
              <StopCircle className="w-5 h-5 mr-2" />
              FINALIZAR TURNO
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Finalizar Sessão</DialogTitle>
            <DialogDescription>Informe os ganhos e despesas da sessão.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFinishSessionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Faturamento Bruto</Label>
              <CurrencyInput value={formData.grossAmount} onChange={val => setFormData({ ...formData, grossAmount: val })} />
            </div>
            <div className="space-y-2">
              <Label>Alimentação</Label>
              <CurrencyInput value={formData.foodExpense} onChange={val => setFormData({ ...formData, foodExpense: val })} />
            </div>
            <div className="space-y-2">
              <Label>Outros Custos</Label>
              <CurrencyInput value={formData.otherExpense} onChange={val => setFormData({ ...formData, otherExpense: val })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full h-12 font-bold rounded-xl">
                {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                FINALIZAR SESSÃO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
