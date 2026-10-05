
"use client"

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { User, Mail, Lock, ArrowRight, Loader2, Bike, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  vehicleType: z.enum(['MOTORCYCLE', 'CAR']),
});

type RegisterFormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [vehicleType, setVehicleType] = React.useState<'MOTORCYCLE' | 'CAR'>('MOTORCYCLE');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      vehicleType: 'MOTORCYCLE',
    }
  });

  const handleSelectVehicle = (type: 'MOTORCYCLE' | 'CAR') => {
    setVehicleType(type);
    setValue('vehicleType', type);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        vehicleType: data.vehicleType,
      };
      const response = await api.post('/auth/register', payload);
      login(response.data.token, response.data.user);
      toast({ title: "Bem-vindo!", description: "Sua conta foi criada com sucesso." });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar sua conta. Tente novamente.'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 p-[2px] shadow-lg shadow-primary/20 mx-auto">
            <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center text-primary font-headline font-black text-2xl tracking-tighter">
              NC
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-headline font-black text-foreground tracking-tight">NoCorre</h1>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-1">Sua inteligência no volante</p>
          </div>
        </div>

        {/* Card */}
        <Card className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-xl shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="font-headline font-bold text-xl text-foreground">Criar Conta</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Cadastre-se para começar a controlar seus lucros reais.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input 
                    id="name" 
                    placeholder="Seu nome" 
                    className="pl-10 h-11 rounded-xl bg-secondary/40 border-border/80" 
                    {...register('name')} 
                  />
                </div>
                {errors.name && <p className="text-[11px] text-destructive font-medium">{errors.name.message as string}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="pl-10 h-11 rounded-xl bg-secondary/40 border-border/80" 
                    {...register('email')} 
                  />
                </div>
                {errors.email && <p className="text-[11px] text-destructive font-medium">{errors.email.message as string}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    className="pl-10 h-11 rounded-xl bg-secondary/40 border-border/80" 
                    {...register('password')} 
                  />
                </div>
                {errors.password && <p className="text-[11px] text-destructive font-medium">{errors.password.message as string}</p>}
              </div>

              {/* Seletor de Tipo de Veículo */}
              <div className="space-y-2 pt-1 border-t border-border/60">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Qual é o seu veículo de trabalho?
                </Label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectVehicle('MOTORCYCLE')}
                    className={cn(
                      "flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-sm font-bold transition-all",
                      vehicleType === 'MOTORCYCLE'
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <Bike className="w-5 h-5" />
                    <span>Moto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectVehicle('CAR')}
                    className={cn(
                      "flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-sm font-bold transition-all",
                      vehicleType === 'CAR'
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <Car className="w-5 h-5" />
                    <span>Carro</span>
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-2xl font-headline font-black text-sm tracking-wide gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.99] transition-all" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    CADASTRANDO...
                  </>
                ) : (
                  <>
                    CRIAR MINHA CONTA
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground font-medium">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-primary hover:underline font-bold">
                  Faça login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
