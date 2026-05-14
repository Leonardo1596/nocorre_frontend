"use client"

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Route, Clock, Search, ChevronRight, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const mockHistory = [
  { id: '1', date: '11 Mai 2026', day: 'Domingo', gain: 210, profit: 150, km: 82, hours: '6h 15m' },
  { id: '2', date: '10 Mai 2026', day: 'Sábado', gain: 320, profit: 240, km: 112, hours: '8h 20m' },
  { id: '3', date: '09 Mai 2026', day: 'Sexta', gain: 250, profit: 190, km: 95, hours: '7h 15m' },
  { id: '4', date: '08 Mai 2026', day: 'Quinta', gain: 140, profit: 95, km: 62, hours: '5h 40m' },
  { id: '5', date: '07 Mai 2026', day: 'Quarta', gain: 180, profit: 130, km: 78, hours: '6h 00m' },
  { id: '6', date: '06 Mai 2026', day: 'Terça', gain: 150, profit: 110, km: 70, hours: '5h 30m' },
];

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockHistory.filter(h => 
    h.date.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.day.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-headline font-bold">Histórico de Corres</h2>
        <p className="text-sm text-muted-foreground">Revise seu desempenho passado.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por data ou dia..." 
          className="pl-10 border-border/50 bg-card/40"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.length > 0 ? filtered.map((shift) => (
          <Card key={shift.id} className="border-border/50 bg-card/20 hover:bg-card/40 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{shift.date}</span>
                  <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wider">{shift.day}</Badge>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Route className="w-3 h-3" /> {shift.km} km</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {shift.hours}</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> R$ {(shift.profit / parseInt(shift.hours)).toFixed(2)}/h</span>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div className="space-y-0.5">
                  <p className="text-lg font-headline font-bold text-primary">R$ {shift.profit}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Lucro Líquido</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="py-20 text-center space-y-4">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-muted-foreground">Nenhum registro encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}