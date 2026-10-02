"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LogOut, 
  Car, 
  Fuel, 
  Wrench, 
  Moon, 
  Sun, 
  Monitor, 
  Loader2, 
  Droplets, 
  Disc, 
  Settings2,
  CircleDollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface MaintenanceSettings {
  fuelPrice: number;
  kmPerLiter: number;
  oilValue: number;
  oilKm: number;
  frontTireValue: number;
  frontTireKm: number;
  rearTireValue: number;
  rearTireKm: number;
  chainValue: number;
  chainKm: number;
}

export default function SettingsPage() {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<MaintenanceSettings>({
    fuelPrice: 0,
    kmPerLiter: 0,
    oilValue: 0,
    oilKm: 0,
    frontTireValue: 0,
    frontTireKm: 0,
    rearTireValue: 0,
    rearTireKm: 0,
    chainValue: 0,
    chainKm: 0,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await api.get('/maintenance-settings');
        if (response.data) {
          const data = response.data;
          setSettings({
            fuelPrice: Number(data.fuel?.fuelPrice || 0),
            kmPerLiter: Number(data.fuel?.kmPerLiter || 0),
            oilValue: Number(data.maintenance?.oil?.price || 0),
            oilKm: Number(data.maintenance?.oil?.lifespanKm || 0),
            frontTireValue: Number(data.maintenance?.frontTire?.price || 0),
            frontTireKm: Number(data.maintenance?.frontTire?.lifespanKm || 0),
            rearTireValue: Number(data.maintenance?.rearTire?.price || 0),
            rearTireKm: Number(data.maintenance?.rearTire?.lifespanKm || 0),
            chainValue: Number(data.maintenance?.chain?.price || 0),
            chainKm: Number(data.maintenance?.chain?.lifespanKm || 0),
          });
        }
      } catch (error) {
        console.error('Error fetching maintenance settings:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar as configurações do veículo.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [toast]);

  const handleUpdate = async (updatedFields: Partial<MaintenanceSettings>) => {
    setSaving(true);
    try {
      const newSettings = { ...settings, ...updatedFields };
      
      const payload = {
        fuel: {
          fuelPrice: Number(newSettings.fuelPrice),
          kmPerLiter: Number(newSettings.kmPerLiter)
        },
        maintenance: {
          oil: { price: Number(newSettings.oilValue), lifespanKm: Number(newSettings.oilKm) },
          frontTire: { price: Number(newSettings.frontTireValue), lifespanKm: Number(newSettings.frontTireKm) },
          rearTire: { price: Number(newSettings.rearTireValue), lifespanKm: Number(newSettings.rearTireKm) },
          chain: { price: Number(newSettings.chainValue), lifespanKm: Number(newSettings.chainKm) }
        }
      };

      await api.put('/maintenance-settings/update', payload);
      setSettings(newSettings);
      toast({ 
        title: "Sucesso!", 
        description: "Configurações atualizadas com sucesso." 
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar suas alterações.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFullSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      fuelPrice: Number(formData.get('fuelPrice')),
      kmPerLiter: Number(formData.get('kmPerLiter')),
      oilValue: Number(formData.get('oilValue')),
      oilKm: Number(formData.get('oilKm')),
      frontTireValue: Number(formData.get('frontTireValue')),
      frontTireKm: Number(formData.get('frontTireKm')),
      rearTireValue: Number(formData.get('rearTireValue')),
      rearTireKm: Number(formData.get('rearTireKm')),
      chainValue: Number(formData.get('chainValue')),
      chainKm: Number(formData.get('chainKm')),
    };
    handleUpdate(data);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Sincronizando configurações...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-300 pb-28 max-w-md mx-auto">
      {/* Header & Perfil Card */}
      <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-5 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 p-[2px] shadow-sm">
                <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center text-primary font-headline font-black text-xl">
                  {(user?.name?.[0] || 'M').toUpperCase()}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-card"></span>
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-headline font-black text-foreground">{user?.name || 'Motorista'}</h2>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout} 
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Formulário Principal */}
      <form onSubmit={handleFullSubmit} className="space-y-6">
        {/* Veículo & Consumo */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Car className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Veículo e Consumo</h3>
          </div>
          
          <Card className="rounded-2xl border border-border/70 bg-card/70 overflow-hidden shadow-sm">
            <CardContent className="p-4 grid grid-cols-2 gap-3.5">
              <div className="space-y-2">
                <Label htmlFor="fuelPrice" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <Fuel className="w-3 h-3 text-primary" /> Preço/L (R$)
                </Label>
                <CurrencyInput 
                  name="fuelPrice" 
                  value={settings.fuelPrice} 
                  onChange={(val) => setSettings(s => ({...s, fuelPrice: val}))}
                  className="bg-secondary/40 border-border/80 h-11 rounded-xl text-base font-bold tabular-nums" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kmPerLiter" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <Car className="w-3 h-3 text-primary" /> KM por Litro
                </Label>
                <Input 
                  id="kmPerLiter" 
                  name="kmPerLiter" 
                  type="number" 
                  step="0.1" 
                  defaultValue={settings.kmPerLiter} 
                  onChange={(e) => setSettings(s => ({...s, kmPerLiter: Number(e.target.value)}))}
                  className="bg-secondary/40 border-border/80 h-11 rounded-xl text-base font-bold tabular-nums" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manutenção Preventiva */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Settings2 className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Planilha de Manutenção</h3>
          </div>

          <div className="space-y-3">
            {/* Óleo */}
            <Card className="rounded-2xl border border-border/70 bg-card/70 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground">
                  <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                  Óleo do Motor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Valor (R$)</Label>
                  <CurrencyInput 
                    name="oilValue" 
                    value={settings.oilValue} 
                    onChange={(val) => setSettings(s => ({...s, oilValue: val}))}
                    className="h-10 text-sm font-bold bg-secondary/40 rounded-xl" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Duração (KM)</Label>
                  <Input 
                    name="oilKm" 
                    type="number" 
                    defaultValue={settings.oilKm} 
                    onChange={(e) => setSettings(s => ({...s, oilKm: Number(e.target.value)}))}
                    className="h-10 text-sm font-bold bg-secondary/40 rounded-xl" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pneu Dianteiro */}
            <Card className="rounded-2xl border border-border/70 bg-card/70 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground">
                  <div className="p-1 rounded-md bg-orange-500/10 text-orange-400">
                    <Disc className="w-3.5 h-3.5" />
                  </div>
                  Pneu Dianteiro
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Valor (R$)</Label>
                  <CurrencyInput 
                    name="frontTireValue" 
                    value={settings.frontTireValue} 
                    onChange={(val) => setSettings(s => ({...s, frontTireValue: val}))}
                    className="h-10 text-sm font-bold bg-secondary/40 rounded-xl" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Duração (KM)</Label>
                  <Input 
                    name="frontTireKm" 
                    type="number" 
                    defaultValue={settings.frontTireKm} 
                    onChange={(e) => setSettings(s => ({...s, frontTireKm: Number(e.target.value)}))}
                    className="h-10 text-sm font-bold bg-secondary/40 rounded-xl" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pneu Traseiro */}
            <Card className="rounded-2xl border border-border/70 bg-card/70 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground">
                  <div className="p-1 rounded-md bg-orange-500/10 text-orange-400">
                    <Disc className="w-3.5 h-3.5" />
                  </div>
                  Pneu Traseiro
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Valor (R$)</Label>
                  <CurrencyInput 
                    name="rearTireValue" 
                    value={settings.rearTireValue} 
                    onChange={(val) => setSettings(s => ({...s, rearTireValue: val}))}
                    className="h-10 text-sm font-bold bg-secondary/40 rounded-xl" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Duração (KM)</Label>
                  <Input 
                    name="rearTireKm" 
                    type="number" 
                    defaultValue={settings.rearTireKm} 
                    onChange={(e) => setSettings(s => ({...s, rearTireKm: Number(e.target.value)}))}
                    className="h-10 text-sm font-bold bg-secondary/40 rounded-xl" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Corrente / Relação */}
            <Card className="rounded-2xl border border-border/70 bg-card/70 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground">
                  <div className="p-1 rounded-md bg-emerald-500/10 text-primary">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  Corrente / Relação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Valor (R$)</Label>
                  <CurrencyInput 
                    name="chainValue" 
                    value={settings.chainValue} 
                    onChange={(val) => setSettings(s => ({...s, chainValue: val}))}
                    className="h-10 text-sm font-bold bg-secondary/40 rounded-xl" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Duração (KM)</Label>
                  <Input 
                    name="chainKm" 
                    type="number" 
                    defaultValue={settings.chainKm} 
                    onChange={(e) => setSettings(s => ({...s, chainKm: Number(e.target.value)}))}
                    className="h-10 text-sm font-bold bg-secondary/40 rounded-xl" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={saving} 
          className="w-full h-14 rounded-2xl font-headline font-black text-sm tracking-wide gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.99] transition-all"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CircleDollarSign className="w-5 h-5" />}
          SALVAR TODAS AS CONFIGURAÇÕES
        </Button>
      </form>

      {/* Preferências Visuais */}
      <div className="space-y-3 pt-3 border-t border-border/80">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Visual do App</h3>
        <Card className="rounded-2xl border border-border/70 bg-card/70 p-1.5 shadow-sm">
          <CardContent className="p-0 flex items-center justify-around gap-1">
            {[
              { id: 'light', icon: Sun, label: 'Claro' },
              { id: 'dark', icon: Moon, label: 'Escuro' },
              { id: 'system', icon: Monitor, label: 'Sistema' },
            ].map((t) => (
              <Button 
                key={t.id}
                variant={theme === t.id ? 'secondary' : 'ghost'} 
                size="sm" 
                className={cn(
                  "flex-1 gap-2 rounded-xl text-xs font-bold uppercase transition-all h-10",
                  theme === t.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setTheme(t.id)}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
