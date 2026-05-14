"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, StopCircle, Car, Timer, Zap } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ShiftPage() {
  const { currentShift, setCurrentShift, currentSession, setCurrentSession } = useApp();
  const { toast } = useToast();
  const [elapsed, setElapsed] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    if (currentShift.isActive && currentShift.startTime) {
      interval = setInterval(() => {
        const start = new Date(currentShift.startTime!).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentShift]);

  useEffect(() => {
    let interval: any;
    if (currentSession.isActive && currentSession.startTime) {
      interval = setInterval(() => {
        const start = new Date(currentSession.startTime!).getTime();
        setSessionElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startShift = () => {
    setCurrentShift({ id: 's1', startTime: new Date().toISOString(), isActive: true });
    toast({ title: "Turno Iniciado", description: "Bom trabalho e dirija com segurança!" });
  };

  const finishShift = () => {
    setCurrentShift({ id: null, startTime: null, isActive: false });
    setCurrentSession({ id: null, startTime: null, isActive: false });
    toast({ title: "Turno Finalizado", description: "Turno encerrado com sucesso." });
  };

  const startSession = () => {
    setCurrentSession({ id: 'ses1', startTime: new Date().toISOString(), isActive: true });
  };

  const finishSession = () => {
    setCurrentSession({ id: null, startTime: null, isActive: false });
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-2">
          <Car className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-headline font-bold">Gerenciador de Turno</h2>
        <p className="text-sm text-muted-foreground">Registre seu tempo produtivo com precisão.</p>
      </div>

      {!currentShift.isActive ? (
        <Button 
          onClick={startShift} 
          className="w-full h-16 text-lg font-headline font-bold gap-3 rounded-2xl shadow-lg shadow-primary/20"
        >
          <Play className="fill-current" />
          COMEÇAR TURNO
        </Button>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Tempo de Turno</p>
                <p className="text-xl font-headline font-bold text-primary">{formatTime(elapsed)}</p>
              </CardContent>
            </Card>
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Tempo Produtivo</p>
                <p className="text-xl font-headline font-bold text-accent">{formatTime(sessionElapsed)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-secondary/30 border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-headline font-bold text-lg">Status Atual</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentSession.isActive ? 'Você está em uma sessão de trabalho' : 'Turno iniciado, aguardando sessão'}
                  </p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  currentSession.isActive ? "bg-accent text-accent-foreground" : "bg-primary/20 text-primary"
                )}>
                  {currentSession.isActive ? 'Em Trabalho' : 'Aguardando'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Lucro Estimado</p>
                  <p className="text-lg font-bold">R$ --</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">KM Estimado</p>
                  <p className="text-lg font-bold">-- km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 pt-4">
            {!currentSession.isActive ? (
              <Button 
                onClick={startSession}
                className="w-full h-16 bg-accent hover:bg-accent/90 text-accent-foreground font-headline font-bold gap-3 rounded-2xl"
              >
                <Timer className="w-6 h-6" />
                INICIAR TRABALHO
              </Button>
            ) : (
              <Button 
                onClick={finishSession}
                variant="secondary"
                className="w-full h-16 font-headline font-bold gap-3 rounded-2xl"
              >
                <Pause className="w-6 h-6" />
                FINALIZAR TRABALHO
              </Button>
            )}

            <Button 
              onClick={finishShift}
              variant="outline"
              className="w-full h-14 border-destructive/50 text-destructive hover:bg-destructive/10 font-headline font-bold gap-3 rounded-2xl"
            >
              <StopCircle className="w-5 h-5" />
              FINALIZAR TURNO
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
