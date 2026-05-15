"use client"

import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, defaultValue, onChange, name, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<number>(value ?? defaultValue ?? 0);

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const displayValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(internalValue);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, "");
      const cents = parseInt(rawValue || "0", 10);
      const newValue = cents / 100;
      
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    return (
      <div className="relative w-full">
        <Input
          {...props}
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          className={cn("font-mono", className)}
        />
        {name && <input type="hidden" name={name} value={internalValue} />}
      </div>
    );
  }
)
CurrencyInput.displayName = "CurrencyInput"
