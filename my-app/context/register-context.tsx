import React, { createContext, useContext, useMemo, useState } from 'react';
import { RegisterData, initialRegisterData } from '../types/register-types';

type RegisterContextType = {
  form: RegisterData;
  setForm: React.Dispatch<React.SetStateAction<RegisterData>>;
  updateForm: (patch: Partial<RegisterData>) => void;
  resetForm: () => void;
  calculateBMI: (heightCm?: string, weightKg?: string) => number | null;
  calculateRecommendedProtein: (
    weightKg?: string,
    proteinLevel?: RegisterData['proteinLevel']
  ) => number | null;
};

const RegisterContext = createContext<RegisterContextType | undefined>(undefined);

export function RegisterProvider({ children }: { children: React.ReactNode }) {
  const [form, setForm] = useState<RegisterData>(initialRegisterData);

  const updateForm = (patch: Partial<RegisterData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const resetForm = () => {
    setForm(initialRegisterData);
  };

  const calculateBMI = (heightCm?: string, weightKg?: string) => {
    const h = Number(heightCm ?? form.heightCm);
    const w = Number(weightKg ?? form.weightKg);

    if (!h || !w) return null;

    const hm = h / 100;
    const bmi = w / (hm * hm);

    return Number(bmi.toFixed(1));
  };

  const calculateRecommendedProtein = (
    weightKg?: string,
    proteinLevel?: RegisterData['proteinLevel']
  ) => {
    const w = Number(weightKg ?? form.weightKg);
    const level = proteinLevel ?? form.proteinLevel;

    if (!w || !level) return null;

    let multiplier = 1.2;
    if (level === 'medium') multiplier = 1.6;
    if (level === 'high') multiplier = 2.0;

    return Math.round(w * multiplier);
  };

  const value = useMemo(
    () => ({
      form,
      setForm,
      updateForm,
      resetForm,
      calculateBMI,
      calculateRecommendedProtein,
    }),
    [form]
  );

  return <RegisterContext.Provider value={value}>{children}</RegisterContext.Provider>;
}

export function useRegister() {
  const context = useContext(RegisterContext);
  if (!context) {
    throw new Error('useRegister must be used within RegisterProvider');
  }
  return context;
}