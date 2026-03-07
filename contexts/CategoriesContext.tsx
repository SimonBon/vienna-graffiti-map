'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CategoryDef } from '@/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';

interface CategoriesContextValue {
  categories: CategoryDef[];
  categoryMap: Record<string, CategoryDef>;
  addCategory: (cat: CategoryDef) => Promise<void>;
  deleteCategory: (value: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function useCategoriesContext() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategoriesContext must be used inside CategoriesProvider');
  return ctx;
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryDef[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    createClient()
      .from('categories')
      .select('value, label, emoji')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setCategories(data as CategoryDef[]);
      });
  }, []);

  const categoryMap: Record<string, CategoryDef> = Object.fromEntries(
    categories.map((c) => [c.value, c])
  );

  async function addCategory(cat: CategoryDef) {
    const { error } = await createClient().from('categories').insert(cat);
    if (error) throw new Error(error.message);
    setCategories((prev) => [...prev, cat]);
  }

  async function deleteCategory(value: string) {
    const { error } = await createClient().from('categories').delete().eq('value', value);
    if (error) throw new Error(error.message);
    setCategories((prev) => prev.filter((c) => c.value !== value));
  }

  return (
    <CategoriesContext.Provider value={{ categories, categoryMap, addCategory, deleteCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
}
