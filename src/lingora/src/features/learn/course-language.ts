type Language = { id: number; language_code: string | null };

export function courseLanguage(languages: Language[] | undefined, course: string | undefined) {
  if (!course) return undefined;
  const codes = course === 'sh' ? ['hr', 'sh'] : [course];
  return codes.map(code => languages?.find(language => language.language_code?.toLowerCase().split('-')[0] === code)?.id)
    .find(id => id !== undefined);
}
