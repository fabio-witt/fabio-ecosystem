/** Learning goals asked in onboarding (stored in profiles.learning_goal). */
export const learningGoals = [
  { value: 'Travel', icon: '✈️', themes: ['Travel and transport', 'Town and places', 'Drinks and dining', 'Food'] },
  { value: 'Work and career', icon: '💼', themes: ['Work and office', 'Technology', 'Conversation'] },
  { value: 'Family and friends', icon: '👨‍👩‍👧', themes: ['Family and people', 'Home', 'Feelings and personality', 'Conversation'] },
  { value: 'Studies or exams', icon: '🎓', themes: ['School and learning', 'Time and calendar', 'Everyday verbs'] },
  { value: 'Moving abroad', icon: '🏡', themes: ['Home', 'Town and places', 'Body and health', 'Clothing and shopping'] },
  { value: 'Culture, films and music', icon: '🎬', themes: ['Sports and leisure', 'Feelings and personality', 'Conversation'] },
  { value: 'Personal growth', icon: '🌱', themes: ['Everyday verbs', 'Conversation', 'Feelings and personality'] },
] as const;

/** Themes that match the goal come first; the rest keep their order. */
export function sortThemesForGoal<T extends { title: string }>(themes: T[], goal?: string | null): T[] {
  const preferred = learningGoals.find((item) => item.value === goal)?.themes as readonly string[] | undefined;
  if (!preferred) return themes;
  const rank = (title: string) => {
    const index = preferred.indexOf(title);
    return index === -1 ? preferred.length : index;
  };
  return [...themes].sort((a, b) => rank(a.title) - rank(b.title));
}
