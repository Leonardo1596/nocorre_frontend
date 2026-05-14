
"use client"

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut, Car, Fuel, Wrench, Coins, Moon, Sun, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { vehicle, updateVehicle } = useApp();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newConfig = {
      fuelPrice: Number(formData.get('fuelPrice')),
      kmPerLiter: Number(formData.get('kmPerLiter')),
      oilCostPerKm: Number(formData.get('oilCostPerKm')),
      tiresCostPerKm: Number(formData.get('tiresCostPerKm')),
      maintCostPerKm: Number(formData.get('maintCostPerKm')),
    };
    updateVehicle(newConfig);
    toast({ title: "Configurações salvas", description: "Seus custos foram atualizados." });
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            {user?.name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-headline font-bold">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-destructive">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-headline font-bold flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" /> Preferências Visuais
        </h3>
        <Card className="border-border/50 bg-card/40">
          <CardContent className="p-4 flex items-center justify-around">
            <Button 
              variant={theme === 'light' ? 'default' : 'outline'} 
              size="sm" 
              className="gap-2"
              onClick={() => setTheme('light')}
            >
              <Sun className="w-4 h-4" /> Light
            </Button>
            <Button 
              variant={theme === 'dark' ? 'default' : 'outline'} 
              size="sm" 
              className="gap-2"
              onClick={() => setTheme('dark')}
            >
              <Moon className="w-4 h-4" /> Dark
            </Button>
            <Button 
              variant={theme === 'system' ? 'default' : 'outline'} 
              size="sm" 
              className="gap-2"
              onClick={() => setTheme('system')}
            >
              <Monitor className="w-4 h-4" /> Sistema
            </Button>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-headline font-bold flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" /> Configuração do Veículo
          </h3>
          
          <Card className="border-border/50 bg-card/40">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Fuel className="w-4 h-4" /> Combustível</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelPrice">Preço do Litro (R$)</Label>
                <Input id="fuelPrice" name="fuelPrice" type="number" step="0.01" defaultValue={vehicle.fuelPrice} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kmPerLiter">KM por Litro</Label>
                <Input id="kmPerLiter" name="kmPerLiter" type="number" step="0.1" defaultValue={vehicle.kmPerLiter} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/40">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Wrench className="w-4 h-4" /> Manutenção (por KM)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oilCostPerKm">Óleo (R$)</Label>
                  <Input id="oilCostPerKm" name="oilCostPerKm" type="number" step="0.001" defaultValue={vehicle.oilCostPerKm} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiresCostPerKm">Pneus (R$)</Label>
                  <Input id="tiresCostPerKm" name="tiresCostPerKm" type="number" step="0.001" defaultValue={vehicle.tiresCostPerKm} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintCostPerKm">Mecânica Geral (R$)</Label>
                <Input id="maintCostPerKm" name="maintCostPerKm" type="number" step="0.001" defaultValue={vehicle.maintCostPerKm} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Button type="submit" className="w-full h-12 font-bold gap-2">
          SALVAR CONFIGURAÇÕES
        </Button>
      </form>

      <div className="pt-4 border-t border-border">
        <h3 className="font-headline font-bold flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-accent" /> Resumo de Custos
        </h3>
        <div className="p-4 rounded-xl bg-secondary/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Custo Combustível/KM</span>
            <span className="font-medium">R$ {(vehicle.fuelPrice / vehicle.kmPerLiter).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Custo Manutenção/KM</span>
            <span className="font-medium">R$ {(vehicle.oilCostPerKm + vehicle.tiresCostPerKm + vehicle.maintCostPerKm).toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-white/5 flex justify-between font-bold text-primary">
            <span>Custo Total Operacional/KM</span>
            <span>R$ {(vehicle.fuelPrice / vehicle.kmPerLiter + vehicle.oilCostPerKm + vehicle.tiresCostPerKm + vehicle.maintCostPerKm).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
