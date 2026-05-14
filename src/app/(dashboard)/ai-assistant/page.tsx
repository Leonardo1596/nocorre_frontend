"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain, Clock, MapPin, CheckCircle2, RefreshCw } from 'lucide-react';
import { aiProductivityAssistant, AIProductivityAssistantOutput } from '@/ai/flows/ai-productivity-assistant-flow';

const mockShifts = [
  { date: '2026-05-01', totalEarnings: 120, netProfit: 85, totalHours: 5, totalKm: 60, earningsPerHour: 24, earningsPerKm: 2 },
  { date: '2026-05-02', totalEarnings: 150, netProfit: 110, totalHours: 6, totalKm: 80, earningsPerHour: 25, earningsPerKm: 1.8 },
  { date: '2026-05-03', totalEarnings: 180, netProfit: 130, totalHours: 7, totalKm: 90, earningsPerHour: 25.7, earningsPerKm: 2 },
  { date: '2026-05-04', totalEarnings: 250, netProfit: 190, totalHours: 8, totalKm: 120, earningsPerHour: 31.2, earningsPerKm: 2.1 },
];

export default function AIAssistantPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIProductivityAssistantOutput | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await aiProductivityAssistant({ shifts: mockShifts });
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/20">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-headline font-bold">Assistente AI</h2>
          <p className="text-sm text-muted-foreground">Otimize seus ganhos com inteligência artificial.</p>
        </div>
      </div>

      {!analysis && !loading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center space-y-6">
            <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-lg font-headline font-bold">Pronto para a análise?</h3>
              <p className="text-sm text-muted-foreground">Vou analisar seus últimos 7 dias de trabalho para encontrar padrões e sugerir como ganhar mais por hora.</p>
            </div>
            <Button onClick={runAnalysis} className="w-full font-bold">
              GERAR INSIGHTS
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-secondary/50 animate-pulse" />
          ))}
          <p className="text-center text-sm text-muted-foreground">Processando seus dados...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-primary/20 bg-card/60">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Resumo Estratégico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-secondary/40 border-none">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase text-muted-foreground mb-1">Ganho Médio/Hora</p>
                <p className="text-xl font-headline font-bold text-primary">R$ {analysis.averageEarningsPerHour.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/40 border-none">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase text-muted-foreground mb-1">Ganho Médio/KM</p>
                <p className="text-xl font-headline font-bold text-accent">R$ {analysis.averageEarningsPerKm.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="font-headline font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Melhores Horários
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {analysis.optimalWorkingHours.map((hour, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {hour}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-headline font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400" /> Recomendações de Área
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {analysis.optimalRoutes.map((route, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {route}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={runAnalysis} variant="outline" className="w-full gap-2 border-border/50">
            <RefreshCw className="w-4 h-4" /> REFAZER ANÁLISE
          </Button>
        </div>
      )}
    </div>
  );
}