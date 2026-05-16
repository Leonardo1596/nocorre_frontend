"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Route,
  Clock,
  Search,
  ChevronRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const startDate = "2026-05-11";
        const endDate = "2026-05-17";

        const response = await api.get(
          `/dashboard?start=${startDate}&end=${endDate}`
        );

        setDashboard(response.data);
        console.log("Dashboard data:", response.data);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const daysArray = dashboard?.days
    ? Object.entries(dashboard.days)
    : [];

  const filteredDays = daysArray.filter(([date]: any) => {
    return date.includes(searchTerm);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-headline font-bold">
          Histórico de Corres
        </h2>
        <p className="text-sm text-muted-foreground">
          Revise seu desempenho passado com dados reais.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por data (ex: 2026-05-16)"
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
        <div className="space-y-6">
          {/* SUMMARY */}
          {dashboard?.summary && (
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">
                    Lucro líquido
                  </p>
                  <p className="text-lg font-bold text-primary">
                    R$ {dashboard.summary.netProfit.toFixed(2).replace(".", ",")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">
                    Km total
                  </p>
                  <p className="text-lg font-bold">
                    {dashboard.summary.totalKm.toFixed(1)} km
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">
                    Horas produtivas
                  </p>
                  <p className="text-lg font-bold">
                    {dashboard.summary.productiveHoursHuman}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">
                    Ganho bruto
                  </p>
                  <p className="text-lg font-bold">
                    R$ {dashboard.summary.grossAmount.toFixed(2).replace(".", ",")}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DAYS */}
          {filteredDays.length > 0 ? (
            filteredDays.map(([date, data]: any) => {
              return (
                <Card
                  key={date}
                  className="border-border/50 bg-card/20 hover:bg-card/40 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">
                          {date}
                        </span>

                        <Badge
                          variant="secondary"
                          className="text-[10px] font-normal uppercase tracking-wider"
                        >
                          {data.dayName}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Route className="w-3 h-3" />
                          {data.distance.productiveKm.toFixed(2)} km
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {data.distance.totalHours.toFixed(2)} h
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div className="space-y-0.5">
                        <p className="text-lg font-headline font-bold text-primary">
                          R$ {data.financial.netProfit.toFixed(2).replace(".", ",")}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          Lucro líquido
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="py-20 text-center space-y-4">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
              <p className="text-muted-foreground">
                Nenhum registro encontrado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}