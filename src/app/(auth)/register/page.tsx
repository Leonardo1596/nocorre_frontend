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

const schema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

export default function RegisterPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: any) => {
    try {
      // Mock registration
      await new Promise(r => setTimeout(r, 1000));
      login('mock_token', { id: '1', name: data.name, email: data.email });
      toast({ title: "Bem-vindo!", description: "Sua conta foi criada com sucesso." });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao cadastrar', description: 'Ocorreu um erro. Tente novamente.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">NoCorre</h1>
          <p className="text-muted-foreground font-body">Crie sua conta e comece a lucrar mais.</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-headline">Cadastro</CardTitle>
            <CardDescription>Preencha os dados abaixo para começar.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" placeholder="Seu nome" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
                {isSubmitting ? 'Cadastrando...' : 'Criar Conta'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Já tem uma conta? <Link href="/login" className="text-primary hover:underline font-medium">Faça login</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}