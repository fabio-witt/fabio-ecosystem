import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export type ClassRow = { id: string; teacher_id: string; name: string; course_id: string; join_code: string; created_at: string };
export type Assignment = { id: string; class_id: string; entry_id: string; due_date: string | null };

export function useMyClasses() {
  const { user } = useSession();
  return useQuery({
    queryKey: ['classes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('id, teacher_id, name, course_id, join_code, created_at').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClassRow[];
    },
  });
}

export function useClassDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['class', id],
    enabled: !!id,
    queryFn: async () => {
      const [klass, assignments] = await Promise.all([
        supabase.from('classes').select('id, teacher_id, name, course_id, join_code, created_at').eq('id', id!).maybeSingle(),
        supabase.from('class_assignments').select('id, class_id, entry_id, due_date').eq('class_id', id!).order('created_at'),
      ]);
      if (klass.error) throw klass.error;
      if (assignments.error) throw assignments.error;
      return { klass: klass.data as ClassRow | null, assignments: (assignments.data ?? []) as Assignment[] };
    },
  });
}

export function useClassProgress(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['class-progress', id],
    enabled: !!id && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('class_progress', { p_class: id! });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClassActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ predicate: (query) => ['classes', 'class', 'class-progress'].includes(String(query.queryKey[0])) });
  const create = useMutation({
    mutationFn: async (input: { name: string; courseId: string }) => {
      const { data, error } = await supabase.from('classes').insert({ name: input.name.trim(), course_id: input.courseId }).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: refresh,
  });
  const join = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_class', { p_code: code });
      if (error) throw error;
      return data as string;
    },
    onSuccess: refresh,
  });
  const assign = useMutation({
    mutationFn: async (input: { classId: string; entryId: string }) => {
      const { error } = await supabase.from('class_assignments').insert({ class_id: input.classId, entry_id: input.entryId });
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const unassign = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('class_assignments').delete().eq('id', id); if (error) throw error; },
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('classes').delete().eq('id', id); if (error) throw error; },
    onSuccess: refresh,
  });
  const leave = useMutation({
    mutationFn: async ({ classId, userId }: { classId: string; userId: string }) => {
      const { error } = await supabase.from('class_members').delete().eq('class_id', classId).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  return { create, join, assign, unassign, remove, leave };
}
