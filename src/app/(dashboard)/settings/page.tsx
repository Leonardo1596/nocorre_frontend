
"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
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
  ChevronRight,
  CircleDollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import api from '@/lib/api';

interface MaintenanceSettings {
  fuelPrice: number;
  kmPerLiter: number;
  oilValue: number;
  oilKm: number;
  tiresValue: number;
  tiresKm: number;
  chainValue: number;
  chainKm: number;
}

export default function SettingsPage() {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [settings, setSettings] = useState<MaintenanceSettings>({
    fuelPrice: 0,
    kmPerLiter: 0,
    oilValue: 0,
    oilKm: 0,
    tiresValue: 0,
    tiresKm: 0,
    chainValue: 0,
    chainKm: 0,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await api.get('/maintenance-settings');
        if (response.data) {
          setSettings(response.data);
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
      await api.put('/maintenance-settings/update', newSettings);
      setSettings(newSettings);
      toast({ 
        title: "Sucesso!", 
        description: "Configurações atualizadas com sucesso." 
      });
      setShowFuelModal(false);
    } catch (error) {
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
      tiresValue: Number(formData.get('tiresValue')),
      tiresKm: Number(formData.get('tiresKm')),
      chainValue: Number(formData.get('chainValue')),
      chainKm: Number(formData.get('chainKm')),
    };
    handleUpdate(data);
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-28 max-w-md mx-auto">
      {/* Perfil & Logout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            {user?.name?.[0]}
          </div>
          <div>
            <h2 className="text-lg font-headline font-bold">{user?.name}</h2>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-destructive">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Acesso Rápido - Combustível */}
      <div className="space-y-4">
        <Dialog open={showFuelModal} onOpenChange={setShowFuelModal}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold gap-3 text-sm">
              <Fuel className="w-5 h-5" />
              ATUALIZAR PREÇO COMBUSTÍVEL
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-headline">Preço do Litro</DialogTitle>
              <DialogDescription>Atualize apenas o valor da gasolina.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quickFuel">Novo Preço (R$)</Label>
                <Input 
                  id="quickFuel" 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 5.89"
                  defaultValue={settings.fuelPrice}
                  onChange={(e) => setSettings({...settings, fuelPrice: Number(e.target.value)})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => handleUpdate({ fuelPrice: settings.fuelPrice })} 
                disabled={saving}
                className="w-full h-12 font-bold"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                CONFIRMAR VALOR
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleFullSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Car className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Veículo e Consumo</h3>
          </div>
          
          <Card className="border-border/50 bg-card/40 overflow-hidden">
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelPrice" className="text-[10px] uppercase font-bold text-muted-foreground">Preço/L (R$)</Label>
                <Input id="fuelPrice" name="fuelPrice" type="number" step="0.01" defaultValue={settings.fuelPrice} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kmPerLiter" className="text-[10px] uppercase font-bold text-muted-foreground">KM por Litro</Label>
                <Input id="kmPerLiter" name="kmPerLiter" type="number" step="0.1" defaultValue={settings.kmPerLiter} className="bg-background/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Settings2 className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Planilha de Manutenção</h3>
          </div>

          {/* Óleo */}
          <Card className="border-border/50 bg-card/40">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-2"><Droplets className="w-3.5 h-3.5 text-blue-400" /> Óleo do Motor</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase text-muted-foreground">Valor (R$)</Label>
                <Input name="oilValue" type="number" defaultValue={settings.oilValue} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase text-muted-foreground">Duração (KM)</Label>
                <Input name="oilKm" type="number" defaultValue={settings.oilKm} className="h-9 text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Pneus */}
          <Card className="border-border/50 bg-card/40">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-2"><Disc className="w-3.5 h-3.5 text-orange-400" /> Pneus</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase text-muted-foreground">Valor (R$)</Label>
                <Input name="tiresValue" type="number" defaultValue={settings.tiresValue} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase text-muted-foreground">Duração (KM)</Label>
                <Input name="tiresKm" type="number" defaultValue={settings.tiresKm} className="h-9 text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Corrente / Relação */}
          <Card className="border-border/50 bg-card/40">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-2"><Wrench className="w-3.5 h-3.5 text-accent" /> Corrente / Relação</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase text-muted-foreground">Valor (R$)</Label>
                <Input name="chainValue" type="number" defaultValue={settings.chainValue} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase text-muted-foreground">Duração (KM)</Label>
                <Input name="chainKm" type="number" defaultValue={settings.chainKm} className="h-9 text-sm" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Button type="submit" disabled={saving} className="w-full h-14 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CircleDollarSign className="w-5 h-5" />}
          SALVAR TODAS AS CONFIGURAÇÕES
        </Button>
      </form>

      {/* Preferências Visuais */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Visual do App</h3>
        <Card className="border-border/50 bg-card/40">
          <CardContent className="p-2 flex items-center justify-around">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
              { id: 'system', icon: Monitor, label: 'System' },
            ].map((t) => (
              <Button 
                key={t.id}
                variant={theme === t.id ? 'secondary' : 'ghost'} 
                size="sm" 
                className="flex-1 gap-2 rounded-xl text-[10px] font-bold uppercase"
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
