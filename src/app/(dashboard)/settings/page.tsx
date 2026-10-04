"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  LogOut, 
  Car, 
  Bike,
  Fuel, 
  Wrench, 
  Moon, 
  Sun, 
  Monitor, 
  Loader2, 
  Plus,
  Trash2,
  RotateCcw,
  CircleDollarSign,
  Gauge,
  Percent,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { NativeGps } from '@/lib/gps';

export type VehicleType = 'MOTORCYCLE' | 'CAR';

export interface MaintenanceItem {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  lifespanKm: number;
  isActive: boolean;
  costPerKm?: number;
}

export interface FuelSettings {
  fuelPrice: number;
  kmPerLiter: number;
}

export interface CostSnapshot {
  totalCostPerKm?: number;
  fuelCostPerKm?: number;
  itemsCostPerKm?: number;
}

export default function SettingsPage() {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingTemplate, setResettingTemplate] = useState(false);

  // Estados principais
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTORCYCLE');
  const [fuel, setFuel] = useState<FuelSettings>({ fuelPrice: 5.80, kmPerLiter: 35 });
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [snapshot, setSnapshot] = useState<CostSnapshot | null>(null);

  // Diálogo para Adicionar Novo Item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemKm, setNewItemKm] = useState(10000);
  const [addingItem, setAddingItem] = useState(false);

  // Diálogo de confirmação para Reset de Template
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [pendingVehicleType, setPendingVehicleType] = useState<VehicleType | null>(null);

  // Sincroniza com NativeGps (Android Overlay)
  const syncToNative = useCallback((costPerKm: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nocorre_token') || undefined : undefined;
    NativeGps.setCostPerKm({ costPerKm, token }).catch((err) => {
      console.warn('Erro sincronizando custo no overlay nativo:', err);
    });
  }, []);

  // Busca configurações da API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/maintenance-settings');
      if (res.data) {
        const data = res.data;
        const vType: VehicleType = data.vehicleType === 'CAR' ? 'CAR' : 'MOTORCYCLE';
        setVehicleType(vType);

        const loadedFuel: FuelSettings = {
          fuelPrice: Number(data.fuel?.fuelPrice || 0) || (vType === 'MOTORCYCLE' ? 5.80 : 5.80),
          kmPerLiter: Number(data.fuel?.kmPerLiter || 0) || (vType === 'MOTORCYCLE' ? 35 : 11),
        };
        setFuel(loadedFuel);

        let loadedItems: MaintenanceItem[] = [];
        if (Array.isArray(data.items) && data.items.length > 0) {
          loadedItems = data.items.map((it: any) => ({
            _id: it._id || it.id,
            name: it.name || 'Item de Manutenção',
            price: Number(it.price || 0),
            lifespanKm: Number(it.lifespanKm || 1),
            isActive: it.isActive !== false,
            costPerKm: it.costPerKm != null ? Number(it.costPerKm) : undefined,
          }));
        } else if (data.maintenance) {
          // Retrocompatibilidade para contas legadas
          if (data.maintenance.oil) {
            loadedItems.push({
              name: 'Óleo do motor',
              price: Number(data.maintenance.oil.price || 0),
              lifespanKm: Number(data.maintenance.oil.lifespanKm || 3000),
              isActive: true,
            });
          }
          if (data.maintenance.frontTire) {
            loadedItems.push({
              name: 'Pneu dianteiro',
              price: Number(data.maintenance.frontTire.price || 0),
              lifespanKm: Number(data.maintenance.frontTire.lifespanKm || 25000),
              isActive: true,
            });
          }
          if (data.maintenance.rearTire) {
            loadedItems.push({
              name: 'Pneu traseiro',
              price: Number(data.maintenance.rearTire.price || 0),
              lifespanKm: Number(data.maintenance.rearTire.lifespanKm || 18000),
              isActive: true,
            });
          }
          if (data.maintenance.chain) {
            loadedItems.push({
              name: 'Kit relação / Corrente',
              price: Number(data.maintenance.chain.price || 0),
              lifespanKm: Number(data.maintenance.chain.lifespanKm || 20000),
              isActive: true,
            });
          }
        }

        setItems(loadedItems);
        if (data.snapshot) {
          setSnapshot(data.snapshot);
        }

        // Calcula e sincroniza o custo no overlay
        const fuelCost = loadedFuel.kmPerLiter > 0 ? (loadedFuel.fuelPrice / loadedFuel.kmPerLiter) : 0;
        const itemsCost = loadedItems
          .filter(i => i.isActive)
          .reduce((acc, it) => acc + (it.lifespanKm > 0 ? it.price / it.lifespanKm : 0), 0);
        const total = data.snapshot?.totalCostPerKm ?? (fuelCost + itemsCost);
        syncToNative(total);
      }
    } catch (err) {
      console.error('Erro ao buscar maintenance-settings:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as configurações do veículo.',
      });
    } finally {
      setLoading(false);
    }
  }, [syncToNative, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Cálculos locais em tempo real
  const fuelCostPerKm = useMemo(() => {
    return fuel.kmPerLiter > 0 ? (fuel.fuelPrice / fuel.kmPerLiter) : 0;
  }, [fuel.fuelPrice, fuel.kmPerLiter]);

  const itemsCostPerKm = useMemo(() => {
    return items
      .filter(i => i.isActive)
      .reduce((sum, item) => {
        const cost = item.lifespanKm > 0 ? (item.price / item.lifespanKm) : 0;
        return sum + cost;
      }, 0);
  }, [items]);

  const totalCalculatedCostPerKm = useMemo(() => {
    return fuelCostPerKm + itemsCostPerKm;
  }, [fuelCostPerKm, itemsCostPerKm]);

  // Atualizar campo de um item na lista local
  const handleItemFieldChange = (index: number, field: keyof MaintenanceItem, value: any) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Alternar isActive de um item com persistência imediata caso possua _id
  const handleToggleItemActive = async (index: number) => {
    const item = items[index];
    const newActiveState = !item.isActive;
    
    // Atualiza estado local imediatamente
    handleItemFieldChange(index, 'isActive', newActiveState);

    // Se tiver _id, chama o PATCH /maintenance-settings/items/:itemId
    if (item._id) {
      try {
        await api.patch(`/maintenance-settings/items/${item._id}`, { isActive: newActiveState });
      } catch (err) {
        console.warn('Erro ao atualizar status do item via PATCH:', err);
      }
    }
  };

  // Remover item
  const handleDeleteItem = async (index: number) => {
    const item = items[index];
    if (item._id) {
      try {
        await api.delete(`/maintenance-settings/items/${item._id}`);
        toast({ title: 'Item removido', description: `O item "${item.name}" foi excluído.` });
      } catch (err) {
        console.warn('Erro ao excluir item na API:', err);
      }
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Adicionar novo item
  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast({ variant: 'destructive', title: 'Nome obrigatório', description: 'Informe o nome do item de manutenção.' });
      return;
    }
    if (newItemKm <= 0) {
      toast({ variant: 'destructive', title: 'Durabilidade inválida', description: 'A durabilidade deve ser maior que 0 km.' });
      return;
    }

    setAddingItem(true);
    try {
      const payload = {
        name: newItemName.trim(),
        price: Number(newItemPrice),
        lifespanKm: Number(newItemKm),
      };

      const res = await api.post('/maintenance-settings/items', payload);
      
      const createdItem: MaintenanceItem = res.data?.item || {
        _id: res.data?._id || String(Date.now()),
        name: newItemName.trim(),
        price: Number(newItemPrice),
        lifespanKm: Number(newItemKm),
        isActive: true,
        costPerKm: Number(newItemPrice) / Number(newItemKm),
      };

      setItems(prev => [...prev, createdItem]);
      setIsAddModalOpen(false);
      setNewItemName('');
      setNewItemPrice(0);
      setNewItemKm(10000);

      toast({ 
        title: 'Item adicionado!', 
        description: `"${createdItem.name}" adicionado com custo de R$ ${(createdItem.price / createdItem.lifespanKm).toFixed(3)}/km.` 
      });
    } catch (err: any) {
      console.error('Erro ao adicionar item de manutenção:', err);
      // Fallback local se o endpoint falhar
      const fallbackItem: MaintenanceItem = {
        name: newItemName.trim(),
        price: Number(newItemPrice),
        lifespanKm: Number(newItemKm),
        isActive: true,
      };
      setItems(prev => [...prev, fallbackItem]);
      setIsAddModalOpen(false);
      setNewItemName('');
      setNewItemPrice(0);
      setNewItemKm(10000);
      toast({ 
        title: 'Item inserido', 
        description: 'Item adicionado à lista. Lembre-se de clicar em "Salvar Configurações".' 
      });
    } finally {
      setAddingItem(false);
    }
  };

  // Resetar para o template padrão (Moto ou Carro)
  const handleConfirmResetTemplate = async (targetType: VehicleType) => {
    setResettingTemplate(true);
    setIsResetConfirmOpen(false);
    try {
      const res = await api.post('/maintenance-settings/reset-template', { vehicleType: targetType });
      if (res.data) {
        setVehicleType(targetType);
        if (res.data.fuel) {
          setFuel({
            fuelPrice: Number(res.data.fuel.fuelPrice || 5.80),
            kmPerLiter: Number(res.data.fuel.kmPerLiter || (targetType === 'MOTORCYCLE' ? 35 : 11)),
          });
        }
        if (Array.isArray(res.data.items)) {
          setItems(res.data.items.map((it: any) => ({
            _id: it._id,
            name: it.name,
            price: Number(it.price || 0),
            lifespanKm: Number(it.lifespanKm || 1),
            isActive: it.isActive !== false,
            costPerKm: it.costPerKm,
          })));
        }
        if (res.data.snapshot) {
          setSnapshot(res.data.snapshot);
        }
      } else {
        // Fallback local com os valores padrão descritos no backend
        setVehicleType(targetType);
        if (targetType === 'MOTORCYCLE') {
          setFuel({ fuelPrice: 5.80, kmPerLiter: 35 });
          setItems([
            { name: 'Óleo do motor', price: 45, lifespanKm: 3000, isActive: true },
            { name: 'Pneu dianteiro', price: 250, lifespanKm: 25000, isActive: true },
            { name: 'Pneu traseiro', price: 320, lifespanKm: 18000, isActive: true },
            { name: 'Kit relação', price: 220, lifespanKm: 20000, isActive: true },
          ]);
        } else {
          setFuel({ fuelPrice: 5.80, kmPerLiter: 11 });
          setItems([
            { name: 'Troca de óleo e filtros', price: 250, lifespanKm: 10000, isActive: true },
            { name: 'Jogo de pneus - 4 unidades', price: 1600, lifespanKm: 45000, isActive: true },
            { name: 'Pastilhas de freio', price: 260, lifespanKm: 30000, isActive: true },
            { name: 'Alinhamento e balanceamento', price: 120, lifespanKm: 10000, isActive: true },
          ]);
        }
      }

      toast({
        title: 'Template aplicado com sucesso!',
        description: `Itens e consumo resetados para o modelo padrão de ${targetType === 'MOTORCYCLE' ? 'Moto' : 'Carro'}.`,
      });
    } catch (err) {
      console.error('Erro ao resetar template:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao resetar template',
        description: 'Não foi possível carregar o template padrão.',
      });
    } finally {
      setResettingTemplate(false);
    }
  };

  // Salvar tudo via PUT /maintenance-settings
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        vehicleType,
        fuel: {
          fuelPrice: Number(fuel.fuelPrice),
          kmPerLiter: Number(fuel.kmPerLiter),
        },
        items: items.map(it => ({
          _id: it._id,
          name: it.name,
          price: Number(it.price),
          lifespanKm: Number(it.lifespanKm),
          isActive: it.isActive,
        })),
      };

      // Tenta rota padrão PUT /maintenance-settings ou /maintenance-settings/update
      try {
        await api.put('/maintenance-settings', payload);
      } catch (err: any) {
        if (err.response?.status === 404) {
          await api.put('/maintenance-settings/update', payload);
        } else {
          throw err;
        }
      }

      // Sincroniza o custo calculado com o overlay nativo
      syncToNative(totalCalculatedCostPerKm);

      toast({
        title: 'Configurações salvas!',
        description: `Custo do veículo atualizado: R$ ${totalCalculatedCostPerKm.toFixed(2)}/km. Overlay sincronizado.`,
      });
    } catch (err) {
      console.error('Erro salvando configurações:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar as configurações.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Carregando modelo do veículo...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-300 pb-28 max-w-md mx-auto">
      {/* Perfil & Logout Card */}
      <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-5 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 p-[2px] shadow-sm">
              <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center text-primary font-headline font-black text-xl">
                {(user?.name?.[0] || 'M').toUpperCase()}
              </div>
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-headline font-black text-foreground">{user?.name || 'Motorista'}</h2>
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

      {/* SELETOR DE TIPO DE VEÍCULO (CARRO / MOTO) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              {vehicleType === 'MOTORCYCLE' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
            </div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Tipo de Veículo
            </h3>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setPendingVehicleType(vehicleType);
              setIsResetConfirmOpen(true);
            }}
            disabled={resettingTemplate}
            className="h-8 px-2.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5 rounded-lg"
          >
            {resettingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Resetar Template
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (vehicleType !== 'MOTORCYCLE') {
                setPendingVehicleType('MOTORCYCLE');
                setIsResetConfirmOpen(true);
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center gap-1.5",
              vehicleType === 'MOTORCYCLE'
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                : "border-border/70 bg-card/60 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Bike className="w-5 h-5" />
              <span className="font-headline font-black text-sm">Moto</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">35 km/l padrão</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (vehicleType !== 'CAR') {
                setPendingVehicleType('CAR');
                setIsResetConfirmOpen(true);
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center gap-1.5",
              vehicleType === 'CAR'
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                : "border-border/70 bg-card/60 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              <span className="font-headline font-black text-sm">Carro</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">11 km/l padrão</span>
          </button>
        </div>
      </div>

      {/* COMBUSTÍVEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Fuel className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Combustível & Consumo
            </h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 tabular-nums">
            R$ {fuelCostPerKm.toFixed(3)}/km
          </span>
        </div>

        <Card className="rounded-2xl border border-border/70 bg-card/70 shadow-sm">
          <CardContent className="p-4 grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                <Fuel className="w-3 h-3 text-primary" /> Preço Litro (R$)
              </Label>
              <CurrencyInput 
                value={fuel.fuelPrice} 
                onChange={(val) => setFuel(f => ({ ...f, fuelPrice: val }))}
                className="bg-secondary/40 border-border/80 h-11 rounded-xl text-base font-bold tabular-nums" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                <Gauge className="w-3 h-3 text-primary" /> Consumo (KM/L)
              </Label>
              <Input 
                type="number" 
                step="0.1" 
                value={fuel.kmPerLiter} 
                onChange={(e) => setFuel(f => ({ ...f, kmPerLiter: Number(e.target.value) }))}
                className="bg-secondary/40 border-border/80 h-11 rounded-xl text-base font-bold tabular-nums" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ITENS DINÂMICOS DE MANUTENÇÃO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Itens de Manutenção ({items.length})
            </h3>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 px-3 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Item
          </Button>
        </div>

        {items.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-6 text-center space-y-3">
            <Wrench className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Nenhum item cadastrado</p>
              <p className="text-xs text-muted-foreground">
                Adicione peças personalizadas ou restaure o template padrão do veículo.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleConfirmResetTemplate(vehicleType)}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Carregar Template de {vehicleType === 'MOTORCYCLE' ? 'Moto' : 'Carro'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, index) => {
              const itemCostKm = item.lifespanKm > 0 ? (item.price / item.lifespanKm) : 0;
              const weightPercent = totalCalculatedCostPerKm > 0 
                ? ((itemCostKm / totalCalculatedCostPerKm) * 100).toFixed(1) 
                : '0.0';

              return (
                <Card 
                  key={item._id || item.id || `item-${index}`} 
                  className={cn(
                    "rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm",
                    item.isActive 
                      ? "border-border/80 bg-card/75" 
                      : "border-border/40 bg-secondary/20 opacity-60"
                  )}
                >
                  <CardHeader className="p-3.5 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Input
                          value={item.name}
                          onChange={(e) => handleItemFieldChange(index, 'name', e.target.value)}
                          className="h-8 text-xs font-bold bg-transparent border-transparent hover:border-border/60 focus:bg-background px-1.5 rounded-lg truncate"
                          placeholder="Nome do item..."
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className={cn(
                            "text-xs font-bold tabular-nums block",
                            item.isActive ? "text-emerald-400" : "text-muted-foreground"
                          )}>
                            R$ {itemCostKm.toFixed(3)}/km
                          </span>
                          {item.isActive && (
                            <span className="text-[9px] text-muted-foreground/80 block">
                              {weightPercent}% do custo
                            </span>
                          )}
                        </div>

                        <Switch
                          checked={item.isActive}
                          onCheckedChange={() => handleToggleItemActive(index)}
                          aria-label={`Ativar ${item.name}`}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(index)}
                          className="h-7 w-7 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3.5 pt-0 grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
                        Valor (R$)
                      </Label>
                      <CurrencyInput
                        value={item.price}
                        onChange={(val) => handleItemFieldChange(index, 'price', val)}
                        className="h-9 text-xs font-bold bg-secondary/40 rounded-xl tabular-nums"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
                        Durabilidade (KM)
                      </Label>
                      <Input
                        type="number"
                        step="500"
                        value={item.lifespanKm}
                        onChange={(e) => handleItemFieldChange(index, 'lifespanKm', Number(e.target.value))}
                        className="h-9 text-xs font-bold bg-secondary/40 rounded-xl tabular-nums"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SNAPSHOT & RESUMO GERAL DO CUSTO POR KM */}
      <Card className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card/90 to-card p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
              Snapshot de Custo Real
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary/60">
              {vehicleType === 'MOTORCYCLE' ? 'MOTO' : 'CARRO'}
            </span>
          </div>

          <div className="flex items-baseline justify-between border-b border-border/60 pb-3">
            <div>
              <p className="text-2xl font-headline font-black text-foreground tabular-nums tracking-tight">
                R$ {totalCalculatedCostPerKm.toFixed(2)}
                <span className="text-xs font-semibold text-muted-foreground ml-1">/km rodado</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Utilizado no cálculo do Lucro Estimado no overlay Uber
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/50">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Combustível</span>
              <span className="text-xs font-bold text-foreground tabular-nums">
                R$ {fuelCostPerKm.toFixed(3)}/km
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/50">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Manutenção</span>
              <span className="text-xs font-bold text-foreground tabular-nums">
                R$ {itemsCostPerKm.toFixed(3)}/km
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* BOTÃO SALVAR TODAS AS ALTERAÇÕES */}
      <Button 
        type="button" 
        onClick={handleSaveAll}
        disabled={saving} 
        className="w-full h-14 rounded-2xl font-headline font-black text-sm tracking-wide gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.99] transition-all"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CircleDollarSign className="w-5 h-5" />}
        SALVAR TODAS AS CONFIGURAÇÕES
      </Button>

      {/* PREFERÊNCIAS VISUAIS */}
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

      {/* MODAL / DIALOG: ADICIONAR ITEM CUSTOMIZADO */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Novo Item de Manutenção
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adicione uma peça, componente ou serviço recorrente do seu {vehicleType === 'MOTORCYCLE' ? 'moto' : 'carro'}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddNewItem} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="itemName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nome do Item
              </Label>
              <Input
                id="itemName"
                placeholder="Ex: Pastilhas de freio, Correia, Amortecedor..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="h-11 rounded-xl bg-secondary/40 border-border/80 font-medium"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Preço Estimado
                </Label>
                <CurrencyInput
                  value={newItemPrice}
                  onChange={(val) => setNewItemPrice(val)}
                  className="h-11 rounded-xl bg-secondary/40 border-border/80 font-bold tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="itemKm" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Durabilidade (KM)
                </Label>
                <Input
                  id="itemKm"
                  type="number"
                  step="500"
                  value={newItemKm}
                  onChange={(e) => setNewItemKm(Number(e.target.value))}
                  className="h-11 rounded-xl bg-secondary/40 border-border/80 font-bold tabular-nums"
                />
              </div>
            </div>

            {newItemKm > 0 && newItemPrice > 0 && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Impacto no Custo:</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  + R$ {(newItemPrice / newItemKm).toFixed(3)}/km
                </span>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={addingItem}
                className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                ADICIONAR ITEM
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL / DIALOG: CONFIRMAÇÃO DE RESET DE TEMPLATE */}
      <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-lg flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Aplicar Template de {pendingVehicleType === 'MOTORCYCLE' ? 'Moto' : 'Carro'}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Esta ação substituirá a lista de itens atual pelas sugestões oficiais pré-configuradas de{' '}
              <strong className="text-foreground">{pendingVehicleType === 'MOTORCYCLE' ? 'Moto (35 km/l, relação, pneus, óleo)' : 'Carro (11 km/l, óleo e filtros, 4 pneus, pastilhas, alinhamento)'}</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsResetConfirmOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => pendingVehicleType && handleConfirmResetTemplate(pendingVehicleType)}
              className="rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-black gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              SIM, APLICAR TEMPLATE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
