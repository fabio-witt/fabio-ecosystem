// Profile answers are chosen from fixed lists, stored as comma-separated text.
export const exchangeFields = [
  {
    key: 'learning_goal', label: 'Learning goal', multiple: false, max: 1,
    options: ['Travel', 'Work and career', 'Studies or exams', 'Moving abroad', 'Living in Switzerland',
      'Family and friends', 'Culture, films and music', 'Personal growth'],
  },
  {
    key: 'conversation_topics', label: 'Conversation topics', multiple: true, max: 5,
    options: ['Everyday life', 'Travel', 'Food', 'Movies and series', 'Music', 'Sports', 'Books',
      'Technology', 'Work', 'Culture', 'Nature', 'Gaming'],
  },
  {
    key: 'practice_preference', label: 'Preferred way to practise', multiple: true, max: 5,
    options: ['Text chat', 'Voice messages', 'Voice calls', 'Video calls', 'Meeting in person'],
  },
  {
    key: 'availability', label: 'Availability', multiple: true, max: 5,
    options: ['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Weekends', 'Flexible'],
  },
  {
    key: 'occupation', label: 'Work or studies', multiple: false, max: 1,
    options: ['Student', 'Employee', 'Self-employed', 'Teacher', 'Healthcare', 'IT and tech',
      'Creative work', 'Hospitality', 'Retired', 'Looking for work', 'Other'],
  },
] as const;

export const interestOptions = [
  'Travel', 'Music', 'Movies', 'Books', 'Sports', 'Cooking', 'Gaming', 'Art', 'Technology', 'Nature',
  'Photography', 'Fashion', 'Science', 'History', 'Languages', 'Business', 'Fitness', 'Dancing',
] as const;

export type ExchangeDetails = Partial<Record<(typeof exchangeFields)[number]['key'], string | null>>;

export const splitAnswers = (value?: string | null) =>
  (value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
export const joinAnswers = (values: string[]) => values.join(', ');
