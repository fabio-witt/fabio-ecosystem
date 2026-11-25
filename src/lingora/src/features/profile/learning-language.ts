import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import type { CefrLevel, Course } from '@/features/learn/catalog';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

import { profileKeys } from './api';

const aliases: Record<string, string> = { gsw: 'Swiss German' };

/**
 * Starting a course adds its language to the profile as a learning language
 * (shown under "Learning languages" and "My languages"). Languages already on
 * the profile, also as a native language, are left as they are.
 */
export function useAddCourseLanguage() {
  const { user } = useSession();
  const client = useQueryClient();
  const done = useRef(new Set<string>());

  return useCallback(async (course: Course, level: CefrLevel) => {
    if (!user || done.current.has(course.id)) return;
    done.current.add(course.id);
    try {
      const { data: languages, error: languageError } = await supabase
        .from('languages')
        .select('id, name, language_code')
        .or(`language_code.eq.${course.id},name.eq.${aliases[course.id] ?? course.name}`)
        .limit(1);
      const language = languages?.[0];
      if (languageError || !language) return;

      const { data: existing } = await supabase
        .from('user_languages')
        .select('id')
        .eq('user_id', user.id)
        .eq('language_id', language.id)
        .limit(1);
      if (existing && existing.length > 0) return;

      const { error } = await supabase.from('user_languages').insert({
        user_id: user.id,
        language_id: language.id,
        language_type: 'learning',
        proficiency_level: level,
      });
      // 23505: added meanwhile, e.g. on another device – fine.
      if (error && error.code !== '23505') {
        done.current.delete(course.id);
        return;
      }
      await client.invalidateQueries({ queryKey: profileKeys.all });
      await client.invalidateQueries({ queryKey: ['partners'] });
    } catch {
      // Learning works without it; the next lesson start tries again.
      done.current.delete(course.id);
    }
  }, [user, client]);
}
