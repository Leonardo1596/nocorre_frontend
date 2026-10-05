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
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sliders,
  ShieldCheck,
  Star,
  Clock,
  Compass,
  Zap,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { NativeGps } from '@/lib/gps';

export type VehicleType = 'MOTORCYCLE' | 'CAR';
export type SettingsSection = 'costs' | 'overlay' | 'account';

export interface MaintenanceItem {
  _id?: string;
  id?: string;
  key?: string;
  name: string;
  price: number;
  lifespanKm: number;
  isDefault?: boolean;
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

  // Seção ativa
  const [activeSection, setActiveSection] = useState<SettingsSection>('costs');

  // Estados de carregamento
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingVehicleType, setUpdatingVehicleType] = useState(false);
  const [resettingTemplate, setResettingTemplate] = useState(false);

  // Estados principais da seção Veículo & Custos
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTORCYCLE');
  const [fuel, setFuel] = useState<FuelSettings>({ fuelPrice: 5.80, kmPerLiter: 35 });
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [snapshot, setSnapshot] = useState<CostSnapshot | null>(null);

  // Estados da seção Overlay (Ativação e futuro Rating)
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nocorre_overlay_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [minRating, setMinRating] = useState<number>(4.85);
  const [minPricePerKm, setMinPricePerKm] = useState<number>(2.20);
  const [minHourlyRate, setMinHourlyRate] = useState<number>(40.00);

  // Diálogo para Adicionar Novo Item de Manutenção
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

  // Busca configurações da API: GET /vehicle-settings e GET /maintenance-settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Ler o tipo de veículo do usuário via GET /vehicle-settings
      let userVehicle: VehicleType = 'MOTORCYCLE';
      try {
        const vehicleRes = await api.get('/vehicle-settings');
        if (vehicleRes.data?.vehicleType) {
          userVehicle = vehicleRes.data.vehicleType === 'CAR' ? 'CAR' : 'MOTORCYCLE';
          setVehicleType(userVehicle);
        }
      } catch (vehicleErr) {
        console.warn('Erro ao consultar GET /vehicle-settings:', vehicleErr);
      }

      // 2. Ler dados de combustível e itens de manutenção via GET /maintenance-settings
      const res = await api.get('/maintenance-settings');
      if (res.data) {
        const data = res.data;

        // Combustível
        const loadedFuel: FuelSettings = {
          fuelPrice: Number(data.fuel?.fuelPrice || 0) || (userVehicle === 'MOTORCYCLE' ? 5.80 : 5.80),
          kmPerLiter: Number(data.fuel?.kmPerLiter || 0) || (userVehicle === 'MOTORCYCLE' ? 35 : 11),
        };
        setFuel(loadedFuel);

        // Itens de Manutenção (array de manutenção retornado pelo backend)
        let loadedItems: MaintenanceItem[] = [];
        if (Array.isArray(data.maintenance) && data.maintenance.length > 0) {
          loadedItems = data.maintenance.map((it: any) => ({
            _id: it._id,
            key: it.key || it.name?.toLowerCase().replace(/[\s/]+/g, '_'),
            name: it.name || 'Item de Manutenção',
            price: Number(it.price || 0),
            lifespanKm: Number(it.lifespanKm || 0),
            isDefault: it.isDefault !== false,
            isActive: it.isActive !== false,
            costPerKm: it.lifespanKm > 0 ? Number(it.price || 0) / Number(it.lifespanKm) : 0,
          }));
        } else if (Array.isArray(data.items) && data.items.length > 0) {
          loadedItems = data.items.map((it: any) => ({
            _id: it._id || it.id,
            key: it.key || it.name?.toLowerCase().replace(/[\s/]+/g, '_'),
            name: it.name || 'Item de Manutenção',
            price: Number(it.price || 0),
            lifespanKm: Number(it.lifespanKm || 1),
            isActive: it.isActive !== false,
            costPerKm: it.costPerKm != null ? Number(it.costPerKm) : undefined,
          }));
        } else if (data.maintenance && typeof data.maintenance === 'object') {
          // Retrocompatibilidade para contas legadas com objeto aninhado
          if (data.maintenance.oil) {
            loadedItems.push({
              key: 'oil',
              name: 'Óleo',
              price: Number(data.maintenance.oil.price || 0),
              lifespanKm: Number(data.maintenance.oil.lifespanKm || 3000),
              isActive: true,
            });
          }
          if (data.maintenance.frontTire) {
            loadedItems.push({
              key: 'frontTire',
              name: 'Pneu dianteiro',
              price: Number(data.maintenance.frontTire.price || 0),
              lifespanKm: Number(data.maintenance.frontTire.lifespanKm || 25000),
              isActive: true,
            });
          }
          if (data.maintenance.rearTire) {
            loadedItems.push({
              key: 'rearTire',
              name: 'Pneu traseiro',
              price: Number(data.maintenance.rearTire.price || 0),
              lifespanKm: Number(data.maintenance.rearTire.lifespanKm || 18000),
              isActive: true,
            });
          }
          if (data.maintenance.chain) {
            loadedItems.push({
              key: 'chain',
              name: 'Kit de transmissão',
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
        const total = fuelCost + itemsCost;
        syncToNative(total);
      }
    } catch (err) {
      console.error('Erro ao buscar maintenance-settings:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as configurações de manutenção.',
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

  // Alternar isActive de um item
  const handleToggleItemActive = (index: number) => {
    handleItemFieldChange(index, 'isActive', !items[index].isActive);
  };

  // Remover item da lista
  const handleDeleteItem = (index: number) => {
    const item = items[index];
    setItems(prev => prev.filter((_, i) => i !== index));
    toast({ 
      title: 'Item removido', 
      description: `O item "${item.name}" foi removido da lista.` 
    });
  };

  // Adicionar novo item
  const handleAddNewItem = (e: React.FormEvent) => {
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
      const createdItem: MaintenanceItem = {
        key: newItemName.trim().toLowerCase().replace(/[\s/]+/g, '_'),
        name: newItemName.trim(),
        price: Number(newItemPrice),
        lifespanKm: Number(newItemKm),
        isDefault: false,
        isActive: true,
        costPerKm: Number(newItemPrice) / Number(newItemKm),
      };

      setItems(prev => [...prev, createdItem]);
      setIsAddModalOpen(false);
      setNewItemName('');
      setNewItemPrice(0);
      setNewItemKm(10000);
      toast({ 
        title: 'Item adicionado', 
        description: 'Clique em "Salvar Custos & Manutenção" para gravar no banco de dados.' 
      });
    } finally {
      setAddingItem(false);
    }
  };

  // Atualiza o tipo de veículo usando PUT /vehicle-settings
  const handleUpdateVehicleType = async (newType: VehicleType) => {
    if (newType === vehicleType && !updatingVehicleType) return;
    setUpdatingVehicleType(true);
    try {
      const res = await api.put('/vehicle-settings', { vehicleType: newType });
      const updatedType: VehicleType = (res.data?.vehicleType === 'CAR' || newType === 'CAR') ? 'CAR' : 'MOTORCYCLE';
      setVehicleType(updatedType);
      toast({
        title: 'Veículo atualizado!',
        description: `Tipo de veículo alterado para ${updatedType === 'MOTORCYCLE' ? 'Moto' : 'Carro'}.`,
      });
    } catch (err: any) {
      console.error('Erro ao atualizar /vehicle-settings:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar veículo',
        description: err.response?.data?.message || 'Não foi possível alterar o tipo de veículo.',
      });
    } finally {
      setUpdatingVehicleType(false);
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
        if (Array.isArray(res.data.maintenance)) {
          setItems(res.data.maintenance.map((it: any) => ({
            _id: it._id,
            key: it.key,
            name: it.name,
            price: Number(it.price || 0),
            lifespanKm: Number(it.lifespanKm || 1),
            isDefault: it.isDefault !== false,
            isActive: it.isActive !== false,
            costPerKm: it.lifespanKm > 0 ? Number(it.price || 0) / Number(it.lifespanKm) : 0,
          })));
        }
      } else {
        // Fallback local com os valores padrão descritos no backend
        setVehicleType(targetType);
        if (targetType === 'MOTORCYCLE') {
          setFuel({ fuelPrice: 6.64, kmPerLiter: 30 });
          setItems([
            { key: 'oil', name: 'Óleo', price: 32, lifespanKm: 2000, isDefault: true, isActive: true },
            { key: 'frontTire', name: 'Pneu dianteiro', price: 80, lifespanKm: 30000, isDefault: true, isActive: true },
            { key: 'rearTire', name: 'Pneu traseiro', price: 96, lifespanKm: 15000, isDefault: true, isActive: true },
            { key: 'chain', name: 'Kit de transmissão', price: 50, lifespanKm: 10000, isDefault: true, isActive: true },
          ]);
        } else {
          setFuel({ fuelPrice: 5.80, kmPerLiter: 11 });
          setItems([
            { key: 'oil_filter', name: 'Troca de óleo e filtros', price: 250, lifespanKm: 10000, isDefault: true, isActive: true },
            { key: 'tires_set', name: 'Jogo de 4 pneus', price: 1600, lifespanKm: 45000, isDefault: true, isActive: true },
            { key: 'brakes', name: 'Pastilhas de freio', price: 260, lifespanKm: 30000, isDefault: true, isActive: true },
            { key: 'alignment', name: 'Alinhamento e balanceamento', price: 120, lifespanKm: 10000, isDefault: true, isActive: true },
          ]);
        }
      }

      toast({
        title: 'Template aplicado!',
        description: `Itens resetados para o modelo padrão de ${targetType === 'MOTORCYCLE' ? 'Moto' : 'Carro'}.`,
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

  // Salvar valores de combustível e manutenção usando PUT /maintenance-settings/update
  const handleSaveCosts = async () => {
    setSaving(true);
    try {
      const payload = {
        fuel: {
          fuelPrice: Number(fuel.fuelPrice),
          kmPerLiter: Number(fuel.kmPerLiter),
        },
        maintenance: items
          .filter(it => it.isActive)
          .map(it => ({
            key: it.key || it.name.toLowerCase().replace(/[\s/]+/g, '_'),
            name: it.name,
            price: Number(it.price || 0),
            lifespanKm: Number(it.lifespanKm || 0),
          })),
      };

      await api.put('/maintenance-settings/update', payload);

      // Sincroniza o custo operacional total calculado com o serviço do Android
      syncToNative(totalCalculatedCostPerKm);

      toast({
        title: 'Configurações salvas!',
        description: `Custo operacional atualizado: R$ ${totalCalculatedCostPerKm.toFixed(2)}/km. Overlay sincronizado.`,
      });
    } catch (err) {
      console.error('Erro salvando configurações em /maintenance-settings/update:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar as configurações no servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Ativação / Desativação do Overlay
  const handleToggleOverlay = (val: boolean) => {
    setOverlayEnabled(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nocorre_overlay_enabled', String(val));
    }
    toast({
      title: val ? 'Overlay ativado' : 'Overlay desativado',
      description: val 
        ? 'A bolha de rentabilidade aparecerá automaticamente nas corridas da Uber.' 
        : 'O overlay foi pausado e não será exibido sobre a Uber.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-300 pb-28 max-w-md mx-auto">
      {/* CARD DO PERFIL DO MOTORISTA */}
      <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-5 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 p-[2px] shadow-sm">
              <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center text-primary font-headline font-black text-xl">
                {(user?.name?.[0] || 'M').toUpperCase()}
              </div>
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base font-headline font-black text-foreground">{user?.name || 'Motorista'}</h2>
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

      {/* SELETOR MODULAR DE SEÇÕES */}
      <div className="grid grid-cols-3 p-1 rounded-2xl bg-secondary/50 border border-border/70 backdrop-blur-sm gap-1">
        <button
          type="button"
          onClick={() => setActiveSection('costs')}
          className={cn(
            "flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all gap-1",
            activeSection === 'costs'
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-1.5">
            {vehicleType === 'MOTORCYCLE' ? <Bike className="w-4 h-4 text-emerald-400" /> : <Car className="w-4 h-4 text-emerald-400" />}
            <span>Custos</span>
          </div>
          <span className="text-[9px] font-normal text-muted-foreground">Veículo & Peças</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('overlay')}
          className={cn(
            "flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all gap-1",
            activeSection === 'overlay'
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" />
            <span>Overlay</span>
          </div>
          <span className="text-[9px] font-normal text-muted-foreground">Uber & Corridas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('account')}
          className={cn(
            "flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all gap-1",
            activeSection === 'account'
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Preferências</span>
          </div>
          <span className="text-[9px] font-normal text-muted-foreground">Tema & App</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SEÇÃO 1: VEÍCULO, CONSUMO DE COMBUSTÍVEL & MANUTENÇÃO           */}
      {/* ============================================================== */}
      {activeSection === 'costs' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* ESCOLHA DO TIPO DE VEÍCULO (MOTO / CARRO) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  {vehicleType === 'MOTORCYCLE' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Tipo de Veículo
                  </h3>
                </div>
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
                disabled={updatingVehicleType}
                onClick={() => handleUpdateVehicleType('MOTORCYCLE')}
                className={cn(
                  "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center gap-1.5 relative",
                  vehicleType === 'MOTORCYCLE'
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                  updatingVehicleType && "opacity-70 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Bike className="w-5 h-5" />
                  <span className="font-headline font-black text-sm">Moto</span>
                  {updatingVehicleType && vehicleType === 'MOTORCYCLE' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">35 km/l padrão</span>
              </button>

              <button
                type="button"
                disabled={updatingVehicleType}
                onClick={() => handleUpdateVehicleType('CAR')}
                className={cn(
                  "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center gap-1.5 relative",
                  vehicleType === 'CAR'
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                  updatingVehicleType && "opacity-70 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  <span className="font-headline font-black text-sm">Carro</span>
                  {updatingVehicleType && vehicleType === 'CAR' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">11 km/l padrão</span>
              </button>
            </div>
          </div>

          {/* COMBUSTÍVEL & CONSUMO */}
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

          {/* ITENS DE MANUTENÇÃO & PEÇAS */}
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
                      key={item._id || item.key || `item-${index}`} 
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

          {/* SNAPSHOT & RESUMO DO CUSTO TOTAL OPERACIONAL POR KM */}
          <Card className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card/90 to-card p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                  Custo Operacional Total
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
                    Utilizado no cálculo do Lucro Líquido no overlay da Uber
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

          {/* BOTÃO SALVAR CUSTOS & MANUTENÇÃO (PUT /maintenance-settings/update) */}
          <Button 
            type="button" 
            onClick={handleSaveCosts}
            disabled={saving} 
            className="w-full h-14 rounded-2xl font-headline font-black text-sm tracking-wide gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.99] transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CircleDollarSign className="w-5 h-5" />}
            SALVAR CUSTOS & MANUTENÇÃO
          </Button>
        </div>
      )}

      {/* ============================================================== */}
      {/* SEÇÃO 2: OVERLAY & CONFIGURAÇÃO DE CORRIDAS (STEAM/UBER)       */}
      {/* ============================================================== */}
      {activeSection === 'overlay' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* ATIVAÇÃO DO OVERLAY FLUTUANTE */}
          <Card className="rounded-3xl border border-border/80 bg-card/85 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground font-headline">Overlay Flutuante</h3>
                  <p className="text-xs text-muted-foreground">Exibição sobreposta nas chamadas Uber</p>
                </div>
              </div>
              <Switch 
                checked={overlayEnabled}
                onCheckedChange={handleToggleOverlay}
                aria-label="Ativar Overlay da Uber"
              />
            </div>

            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/50 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  overlayEnabled ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"
                )} />
                Status: {overlayEnabled ? 'Ativo e monitorando' : 'Desativado'}
              </div>
              <p className="text-[11px] leading-relaxed">
                Quando ativo, lê os dados de destino, distância e valor da corrida e exibe o lucro líquido descontando o seu custo de R$ {totalCalculatedCostPerKm.toFixed(2)}/km.
              </p>
            </div>
          </Card>

          {/* PERMISSÕES DO ANDROID */}
          <Card className="rounded-3xl border border-border/80 bg-card/85 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Permissões do Sistema</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
                <div>
                  <p className="font-bold text-foreground">Sobreposição de Tela</p>
                  <p className="text-[10px] text-muted-foreground">Permite exibir o card sobre a Uber</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Concedida
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
                <div>
                  <p className="font-bold text-foreground">Serviço de Acessibilidade</p>
                  <p className="text-[10px] text-muted-foreground">Lê detalhes da rota e valor do card Uber</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Configurado
                </span>
              </div>
            </div>
          </Card>

          {/* ESPAÇO PREPARADO: CONFIGURAÇÃO DE RATING & FILTROS DE CORRIDA */}
          <Card className="rounded-3xl border border-primary/20 bg-card/80 p-5 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-widest font-headline">
                    Critérios & Rating de Corridas
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Filtro inteligente de chamadas</p>
                </div>
              </div>
              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Em breve
              </span>
            </div>

            <div className="space-y-3 opacity-90">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> Nota Mínima do Passageiro
                  </span>
                  <span className="font-bold text-foreground tabular-nums">{minRating.toFixed(2)} ★</span>
                </div>
                <Input 
                  type="number" 
                  step="0.05" 
                  min="4.0" 
                  max="5.0"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" /> Min R$/KM
                    </span>
                  </div>
                  <Input 
                    type="number" 
                    step="0.10" 
                    value={minPricePerKm}
                    onChange={(e) => setMinPricePerKm(Number(e.target.value))}
                    className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" /> Min R$/Hora
                    </span>
                  </div>
                  <Input 
                    type="number" 
                    step="5" 
                    value={minHourlyRate}
                    onChange={(e) => setMinHourlyRate(Number(e.target.value))}
                    className="h-10 rounded-xl bg-secondary/40 border-border/80 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic border-t border-border/40 pt-2.5">
              💡 Esses critérios serão integrados nas próximas atualizações para alertar você visualmente no overlay quando uma corrida não atingir suas metas mínimas.
            </p>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* SEÇÃO 3: PREFERÊNCIAS DO APP, TEMA & CONTA                      */}
      {/* ============================================================== */}
      {activeSection === 'account' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* TEMA VISUAL */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Tema da Interface</h3>
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

          {/* DADOS DA CONTA */}
          <Card className="rounded-2xl border border-border/80 bg-card/80 p-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Informações da Conta</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-bold text-foreground">{user?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">E-mail</span>
                <span className="font-bold text-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Tipo de Veículo Atual</span>
                <span className="font-bold text-emerald-400">
                  {vehicleType === 'MOTORCYCLE' ? 'Motocicleta' : 'Automóvel (Carro)'}
                </span>
              </div>
            </div>
          </Card>

          {/* BOTÃO LOGOUT */}
          <Button
            type="button"
            variant="destructive"
            onClick={logout}
            className="w-full h-12 rounded-2xl font-bold text-xs gap-2"
          >
            <LogOut className="w-4 h-4" />
            DESCONECTAR DESTA CONTA
          </Button>
        </div>
      )}

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
              <strong className="text-foreground">{pendingVehicleType === 'MOTORCYCLE' ? 'Moto (30 km/l, relação, pneus, óleo)' : 'Carro (11 km/l, óleo e filtros, 4 pneus, pastilhas, alinhamento)'}</strong>.
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
