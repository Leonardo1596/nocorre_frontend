
"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Play, Pause, StopCircle, Car, Timer, Zap, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function ShiftPage() {
  const { currentShift, setCurrentShift, currentSession, setCurrentSession } = useApp();
  const { toast } = useToast();
  
  const [elapsed, setElapsed] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  // Form for finishing session
  const [formData, setFormData] = useState({
    grossAmount: '',
    foodExpense: '',
    otherExpense: '',
    productiveKm: ''
  });

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
    if (currentSession.isActive && currentSession.startTime) {
      interval = setInterval(() => {
        const start = new Date(currentSession.startTime!).getTime();
        setSessionElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setSessionElapsed(0);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startShift = async () => {
    setLoading(true);
    try {
      const response = await api.post('/shifts/start');
      const id = response.data._id || response.data.id;
      
      setCurrentShift({ 
        id: id, 
        startTime: new Date().toISOString(), 
        isActive: true 
      });
      toast({ title: "Turno Iniciado", description: "Bom trabalho e dirija com segurança!" });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro", description: "Não foi possível iniciar o turno." });
    } finally {
      setLoading(false);
    }
  };

  const finishShift = async () => {
    if (!currentShift.id) {
      toast({ variant: 'destructive', title: "Erro", description: "ID do turno não encontrado." });
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/shifts/${currentShift.id}/finish`);
      setCurrentShift({ id: null, startTime: null, isActive: false });
      setCurrentSession({ id: null, startTime: null, isActive: false });
      toast({ title: "Turno Finalizado", description: "Turno encerrado com sucesso." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro", description: "Não foi possível finalizar o turno." });
    } finally {
      setLoading(false);
    }
  };

  const startWorkSession = async () => {
    setLoading(true);
    try {
      const response = await api.post('/work-sessions/start');
      const id = response.data._id || response.data.id;

      setCurrentSession({ 
        id: id, 
        startTime: new Date().toISOString(), 
        isActive: true 
      });
      toast({ title: "Trabalho Iniciado", description: "Sessão produtiva ativa." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro", description: "Não foi possível iniciar a sessão." });
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSessionSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!currentSession.id) {
      toast({ variant: 'destructive', title: "Erro", description: "ID da sessão não encontrado." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        grossAmount: formData.grossAmount ? Number(formData.grossAmount) : undefined,
        foodExpense: formData.foodExpense ? Number(formData.foodExpense) : undefined,
        otherExpense: formData.otherExpense ? Number(formData.otherExpense) : undefined,
        productiveKm: formData.productiveKm ? Number(formData.productiveKm) : undefined,
      };

      await api.patch(`/work-sessions/${currentSession.id}/finish`, payload);
      
      setCurrentSession({ id: null, startTime: null, isActive: false });
      setShowFinishDialog(false);
      setFormData({ grossAmount: '', foodExpense: '', otherExpense: '', productiveKm: '' });
      toast({ title: "Sessão Finalizada", description: "Dados da sessão salvos com sucesso." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro", description: "Não foi possível salvar os dados da sessão." });
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
          className="w-full h-16 text-lg font-headline font-bold gap-3 rounded-2xl shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
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
                  <p className="text-[10px] text-muted-foreground uppercase">ID do Turno</p>
                  <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">{currentShift.id || 'N/A'}</p>
                </div>
                {currentSession.isActive && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">ID da Sessão</p>
                    <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">{currentSession.id || 'N/A'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 pt-4">
            {!currentSession.isActive ? (
              <Button 
                onClick={startWorkSession}
                disabled={loading}
                className="w-full h-16 bg-accent hover:bg-accent/90 text-accent-foreground font-headline font-bold gap-3 rounded-2xl"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Timer className="w-6 h-6" />}
                INICIAR TRABALHO
              </Button>
            ) : (
              <Button 
                onClick={() => setShowFinishDialog(true)}
                variant="secondary"
                disabled={loading}
                className="w-full h-16 font-headline font-bold gap-3 rounded-2xl"
              >
                <Pause className="w-6 h-6" />
                FINALIZAR TRABALHO
              </Button>
            )}

            <Button 
              onClick={finishShift}
              variant="outline"
              disabled={loading || currentSession.isActive}
              className="w-full h-14 border-destructive/50 text-destructive hover:bg-destructive/10 font-headline font-bold gap-3 rounded-2xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : <StopCircle className="w-5 h-5" />}
              FINALIZAR TURNO
            </Button>
            {currentSession.isActive && (
              <p className="text-[10px] text-center text-muted-foreground">Finalize o trabalho antes de encerrar o turno.</p>
            )}
          </div>
        </div>
      )}

      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-headline">Finalizar Sessão de Trabalho</DialogTitle>
            <DialogDescription>Insira os dados deste período de trabalho (opcional).</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFinishSessionSubmit} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grossAmount">Ganho Bruto (R$)</Label>
                  <Input 
                    id="grossAmount" 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={formData.grossAmount}
                    onChange={(e) => setFormData({...formData, grossAmount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productiveKm">KM Rodados</Label>
                  <Input 
                    id="productiveKm" 
                    type="number" 
                    step="0.1"
                    placeholder="0.0" 
                    value={formData.productiveKm}
                    onChange={(e) => setFormData({...formData, productiveKm: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="foodExpense">Alimentação (R$)</Label>
                  <Input 
                    id="foodExpense" 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={formData.foodExpense}
                    onChange={(e) => setFormData({...formData, foodExpense: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherExpense">Outros Custos (R$)</Label>
                  <Input 
                    id="otherExpense" 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={formData.otherExpense}
                    onChange={(e) => setFormData({...formData, otherExpense: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setShowFinishDialog(false)}>CANCELAR</Button>
              <Button type="submit" disabled={loading} className="font-bold">
                {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                CONFIRMAR E FINALIZAR
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
