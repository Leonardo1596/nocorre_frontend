
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Route, 
  Clock, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  Loader2 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

// Função para formatar horas decimais (ex: 0.25 -> 15min)
function formatHours(hours: number) {
  const totalMinutes = Math.round((hours || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await api.get('/shifts');
        setHistory(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filtered = history.filter(h => {
    if (!h.date) return false;
    const dateStr = new Date(h.date).toLocaleDateString('pt-BR');
    return dateStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-headline font-bold">Histórico de Corres</h2>
        <p className="text-sm text-muted-foreground">Revise seu desempenho passado com dados reais.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por data..." 
          className="pl-10 border-border/50 bg-card/40"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length > 0 ? filtered.map((shift) => {
            const date = shift.date ? new Date(shift.date) : null;
            const netProfit = Number(shift.netProfit || 0);
            const totalKm = Number(shift.totalKm || 0);
            const totalHours = Number(shift.totalHours || 0);
            const earningsPerHour = Number(shift.earningsPerHour || 0);

            return (
              <Card key={shift.id || shift._id} className="border-border/50 bg-card/20 hover:bg-card/40 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                      {date && (
                        <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wider">
                          {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Route className="w-3 h-3" /> {totalKm.toFixed(1)} km</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatHours(totalHours)}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> R$ {earningsPerHour.toFixed(2)}/h</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="space-y-0.5">
                      <p className="text-lg font-headline font-bold text-primary">R$ {netProfit.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Lucro Líquido</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="py-20 text-center space-y-4">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
              <p className="text-muted-foreground">Nenhum registro encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
