alter table public.profiles
  add column learning_goal text check (char_length(learning_goal) <= 180),
  add column conversation_topics text check (char_length(conversation_topics) <= 160),
  add column practice_preference text check (char_length(practice_preference) <= 100),
  add column availability text check (char_length(availability) <= 120),
  add column occupation text check (char_length(occupation) <= 80);
