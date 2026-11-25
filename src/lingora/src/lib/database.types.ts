// AUTO-GENERATED from the Supabase schema. Do not edit by hand.
// Regenerate after every database migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_inbox: {
        Row: { user_id: string; actor_id: string; kind: string; target_id: string; updated_at: string; read_at: string | null }
        Insert: never
        Update: { read_at?: string | null }
        Relationships: []
      }
      club_members: {
        Row: { club_id: string; joined_at: string; role: string; user_id: string }
        Insert: { club_id: string; joined_at?: string; role?: string; user_id: string }
        Update: { club_id?: string; joined_at?: string; role?: string; user_id?: string }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          emoji: string
          id: string
          is_official: boolean
          language_id: number | null
          member_count: number
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          emoji?: string
          id?: string
          is_official?: boolean
          language_id?: number | null
          member_count?: number
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          emoji?: string
          id?: string
          is_official?: boolean
          language_id?: number | null
          member_count?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          correction: string | null
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          correction?: string | null
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          correction?: string | null
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_xp: {
        Row: {
          day: string
          lessons: number
          user_id: string
          xp: number
        }
        Insert: {
          day: string
          lessons?: number
          user_id: string
          xp?: number
        }
        Update: {
          day?: string
          lessons?: number
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_xp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          flag_emoji: string | null
          id: number
          language_code: string | null
          name: string
          native_name: string | null
        }
        Insert: {
          flag_emoji?: string | null
          id?: never
          language_code?: string | null
          name: string
          native_name?: string | null
        }
        Update: {
          flag_emoji?: string | null
          id?: never
          language_code?: string | null
          name?: string
          native_name?: string | null
        }
        Relationships: []
      }
      learn_progress: {
        Row: {
          best_score: number
          completions: number
          entry_id: string
          first_completed_at: string
          last_completed_at: string
          stars: number
          user_id: string
        }
        Insert: {
          best_score: number
          completions?: number
          entry_id: string
          first_completed_at?: string
          last_completed_at?: string
          stars: number
          user_id: string
        }
        Update: {
          best_score?: number
          completions?: number
          entry_id?: string
          first_completed_at?: string
          last_completed_at?: string
          stars?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_exercises: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          exercise_type: string
          explanation: string | null
          id: string
          lesson_id: string
          options: Json | null
          position: number | null
          question: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          exercise_type: string
          explanation?: string | null
          id?: string
          lesson_id: string
          options?: Json | null
          position?: number | null
          question: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          exercise_type?: string
          explanation?: string | null
          id?: string
          lesson_id?: string
          options?: Json | null
          position?: number | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          category: string | null
          content: Json
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_published: boolean | null
          language_id: number
          level: string
          title: string
        }
        Insert: {
          category?: string | null
          content?: Json
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean | null
          language_id: number
          level: string
          title: string
        }
        Update: {
          category?: string | null
          content?: Json
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean | null
          language_id?: number
          level?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_preferences: {
        Row: {
          available_days: string[] | null
          communication_preferences: string[] | null
          preferred_age_max: number | null
          preferred_age_min: number | null
          preferred_countries: string[] | null
          preferred_gender: string | null
          preferred_interests: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_days?: string[] | null
          communication_preferences?: string[] | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_countries?: string[] | null
          preferred_gender?: string | null
          preferred_interests?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_days?: string[] | null
          communication_preferences?: string[] | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_countries?: string[] | null
          preferred_gender?: string | null
          preferred_interests?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          corrects_id: string | null
          content: string
          conversation_id: string
          created_at: string | null
          edited_at: string | null
          id: string
          message_type: string | null
          sender_id: string
          translated_content: string | null
        }
        Insert: {
          corrects_id?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          sender_id: string
          translated_content?: string | null
        }
        Update: {
          corrects_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          sender_id?: string
          translated_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_events: {
        Row: { id: number; user_id: string | null; event: string; props: Json; created_at: string }
        Insert: { user_id?: string | null; event: string; props?: Json; created_at?: string }
        Update: { user_id?: string | null; event?: string; props?: Json; created_at?: string }
        Relationships: []
      }
      exchange_sessions: {
        Row: { id: string; conversation_id: string; proposer_id: string; starts_at: string; minutes: number; topic: string; status: string; room: string; created_at: string; user_id: string }
        Insert: { conversation_id: string; starts_at: string; minutes?: number; topic?: string }
        Update: { status?: string }
        Relationships: []
      }
      meetups: {
        Row: { id: string; host_id: string; language_id: number | null; level: string | null; title: string; content: string; starts_at: string; duration_minutes: number; capacity: number; attendee_count: number; created_at: string }
        Insert: { language_id?: number | null; level?: string | null; title: string; content?: string; starts_at: string; duration_minutes?: number; capacity?: number }
        Update: { title?: string }
        Relationships: [
          { foreignKeyName: "meetups_host_id_fkey"; columns: ["host_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "meetups_language_id_fkey"; columns: ["language_id"]; isOneToOne: false; referencedRelation: "languages"; referencedColumns: ["id"] }
        ]
      }
      meetup_attendees: {
        Row: { meetup_id: string; user_id: string; created_at: string }
        Insert: { meetup_id: string; user_id?: string }
        Update: { meetup_id?: string }
        Relationships: []
      }
      classes: {
        Row: { id: string; teacher_id: string; name: string; course_id: string; join_code: string; created_at: string }
        Insert: { name: string; course_id: string }
        Update: { name?: string }
        Relationships: []
      }
      class_members: {
        Row: { class_id: string; user_id: string; joined_at: string }
        Insert: { class_id: string; user_id: string }
        Update: { class_id?: string }
        Relationships: []
      }
      class_assignments: {
        Row: { id: string; class_id: string; entry_id: string; due_date: string | null; created_at: string }
        Insert: { class_id: string; entry_id: string; due_date?: string | null }
        Update: { due_date?: string | null }
        Relationships: []
      }
      referrals: {
        Row: { referred_id: string; referrer_id: string; created_at: string }
        Insert: { referred_id: string; referrer_id: string }
        Update: { referrer_id?: string }
        Relationships: []
      }
      forum_threads: {
        Row: { id: string; user_id: string; category: string; language_id: number | null; title: string; content: string; reply_count: number; score: number; accepted_reply_id: string | null; is_pinned: boolean; is_locked: boolean; created_at: string; updated_at: string; last_activity_at: string }
        Insert: { category: string; language_id?: number | null; title: string; content: string; user_id?: string }
        Update: { title?: string; content?: string }
        Relationships: [
          { foreignKeyName: "forum_threads_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "forum_threads_language_id_fkey"; columns: ["language_id"]; isOneToOne: false; referencedRelation: "languages"; referencedColumns: ["id"] }
        ]
      }
      forum_replies: {
        Row: { id: string; thread_id: string; user_id: string; content: string; correction: string | null; score: number; created_at: string; updated_at: string }
        Insert: { thread_id: string; content: string; correction?: string | null; user_id?: string }
        Update: { content?: string; correction?: string | null }
        Relationships: [
          { foreignKeyName: "forum_replies_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "forum_replies_thread_id_fkey"; columns: ["thread_id"]; isOneToOne: false; referencedRelation: "forum_threads"; referencedColumns: ["id"] }
        ]
      }
      forum_votes: {
        Row: { user_id: string; target_kind: string; target_id: string; value: number; created_at: string }
        Insert: { target_kind: string; target_id: string; value: number; user_id?: string }
        Update: { value?: number }
        Relationships: []
      }
      feedback: {
        Row: { id: number; user_id: string | null; rating: number | null; message: string; context: string | null; created_at: string }
        Insert: { user_id?: string | null; rating?: number | null; message: string; context?: string | null; created_at?: string }
        Update: { user_id?: string | null; rating?: number | null; message?: string; context?: string | null; created_at?: string }
        Relationships: []
      }
      client_errors: {
        Row: { id: number; user_id: string | null; message: string; stack: string | null; path: string | null; platform: string | null; created_at: string }
        Insert: { user_id?: string | null; message: string; stack?: string | null; path?: string | null; platform?: string | null; created_at?: string }
        Update: { user_id?: string | null; message?: string; stack?: string | null; path?: string | null; platform?: string | null; created_at?: string }
        Relationships: []
      }
      synced_state: {
        Row: { user_id: string; feature: string; data: Json; updated_at: string }
        Insert: { user_id: string; feature: string; data: Json; updated_at?: string }
        Update: { user_id?: string; feature?: string; data?: Json; updated_at?: string }
        Relationships: []
      }
      plus_members: {
        Row: { expires_at: string | null; source: string; started_at: string; tier: string; user_id: string }
        Insert: { expires_at?: string | null; source?: string; started_at?: string; tier?: string; user_id: string }
        Update: { expires_at?: string | null; source?: string; started_at?: string; tier?: string; user_id?: string }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          accepted_comment_id: string | null
          club_id: string | null
          club_practice_week: string | null
          kind: string
          language_id: number | null
          comment_count: number
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          like_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_comment_id?: string | null
          club_id?: string | null
          club_practice_week?: string | null
          kind?: string
          language_id?: number | null
          comment_count?: number
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          like_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_comment_id?: string | null
          club_id?: string | null
          club_practice_week?: string | null
          kind?: string
          language_id?: number | null
          comment_count?: number
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          like_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          conversation_topics: string | null
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string
          interests: string[] | null
          learning_goal: string | null
          learning_languages: string[] | null
          native_language: string | null
          occupation: string | null
          practice_preference: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          conversation_topics?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          interests?: string[] | null
          learning_goal?: string | null
          learning_languages?: string[] | null
          native_language?: string | null
          occupation?: string | null
          practice_preference?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          conversation_topics?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          learning_goal?: string | null
          learning_languages?: string[] | null
          native_language?: string | null
          occupation?: string | null
          practice_preference?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_languages: {
        Row: {
          created_at: string | null
          id: number
          language_id: number
          language_type: string
          proficiency_level: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          language_id: number
          language_type: string
          proficiency_level?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          language_id?: number
          language_type?: string
          proficiency_level?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_languages_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_languages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          id: string
          lesson_id: string
          score: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          lesson_id: string
          score?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          lesson_id?: string
          score?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_statistics: {
        Row: {
          completed_lessons: number
          current_streak: number
          daily_goal_xp: number
          last_learning_date: string | null
          longest_streak: number
          streak_freezes: number
          time_zone: string
          total_learning_days: number
          total_xp: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_lessons?: number
          current_streak?: number
          daily_goal_xp?: number
          last_learning_date?: string | null
          longest_streak?: number
          streak_freezes?: number
          time_zone?: string
          total_learning_days?: number
          total_xp?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_lessons?: number
          current_streak?: number
          daily_goal_xp?: number
          last_learning_date?: string | null
          longest_streak?: number
          streak_freezes?: number
          time_zone?: string
          total_learning_days?: number
          total_xp?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      username_available: { Args: { p_username: string }; Returns: boolean }
      count_my_corrections: { Args: never; Returns: number }
      export_my_data: { Args: never; Returns: Json }
      admin_insights: { Args: { p_days?: number }; Returns: Json }
      open_club_chat: { Args: { p_club: string }; Returns: string }
      meetup_room: { Args: { p_meetup: string }; Returns: string }
      respond_exchange: { Args: { p_session: string; p_status: string }; Returns: undefined }
      buy_streak_freeze: { Args: never; Returns: number }
      redeem_referral: { Args: { p_code: string }; Returns: string }
      friend_week: { Args: { p_partner: string }; Returns: { my_xp: number; partner_xp: number }[] }
      join_class: { Args: { p_code: string }; Returns: string }
      class_progress: { Args: { p_class: string }; Returns: { user_id: string; name: string; entry_id: string; best_score: number | null; last_completed_at: string | null }[] }
      forum_accept_reply: { Args: { p_thread: string; p_reply: string | null }; Returns: undefined }
      forum_moderate: { Args: { p_thread: string; p_pinned: boolean | null; p_locked: boolean | null }; Returns: undefined }
      get_weekly_league: {
        Args: never
        Returns: { user_id: string; name: string | null; username: string | null; avatar_url: string | null; weekly_xp: number; is_me: boolean }[]
      }
      get_shared_streak: { Args: { p_partner: string }; Returns: number }
      create_duel: { Args: { p_opponent: string; p_course: string; p_seed: number; p_score: number }; Returns: string }
      play_duel: { Args: { p_duel: string; p_score: number }; Returns: undefined }
      list_my_duels: {
        Args: never
        Returns: {
          id: string; course_id: string; seed: number; challenger_id: string; opponent_id: string
          challenger_name: string | null; opponent_name: string | null
          challenger_score: number | null; opponent_score: number | null
          created_at: string; completed_at: string | null
        }[]
      }
      list_correction_cards: {
        Args: never
        Returns: { correction_id: string; original: string; corrected: string; due_at: string; due: boolean }[]
      }
      save_correction_card: { Args: { p_correction_id: string }; Returns: undefined }
      remove_correction_card: { Args: { p_correction_id: string }; Returns: undefined }
      review_correction_card: { Args: { p_correction_id: string; p_remembered: boolean }; Returns: undefined }
      admin_lift_suspension: { Args: { p_user: string }; Returns: undefined }
      admin_list_reports: {
        Args: { p_open_only?: boolean }
        Returns: {
          created_at: string
          evidence: Json
          id: number
          reason: string
          reporter_id: string
          reporter_name: string
          resolution: string
          reviewed_at: string
          subject_id: string
          subject_name: string
          subject_report_count: number
          subject_suspended_until: string
          target_id: string
          target_kind: string
        }[]
      }
      admin_resolve_report: {
        Args: { p_action: string; p_days?: number; p_note?: string; p_report: number }
        Returns: undefined
      }
      am_i_admin: { Args: never; Returns: boolean }
      accept_answer: { Args: { p_comment: string; p_post: string }; Returns: undefined }
      account_deletion_objects: {
        Args: { p_user_id: string }
        Returns: {
          bucket_id: string
          name: string
        }[]
      }
      block_user: { Args: { p_user_id: string }; Returns: undefined }
      complete_lesson: {
        Args: { p_entry_id: string; p_score: number; p_time_zone?: string }
        Returns: Json
      }
      create_club: {
        Args: { p_description: string; p_emoji: string; p_language_id: number; p_name: string }
        Returns: string
      }
      create_direct_conversation: {
        Args: { p_other_user_id: string }
        Returns: string
      }
      erase_lingora_account: { Args: { p_user_id: string }; Returns: undefined }
      find_partners: {
        Args: {
          p_country?: string
          p_language_id?: number
          p_limit?: number
          p_offset?: number
          p_query?: string
        }
        Returns: {
          active_recently: boolean
          avatar_url: string
          bio: string
          city: string
          country: string
          full_name: string
          id: string
          learning_languages: Json
          match_score: number
          native_languages: Json
          review_average: number
          review_total: number
          username: string
        }[]
      }
      find_partners_filtered: {
        Args: {
          p_level?: string
          p_practice?: string
          p_availability?: string
          p_country?: string
          p_language_id?: number
          p_limit?: number
          p_offset?: number
          p_query?: string
        }
        Returns: {
          active_recently: boolean
          avatar_url: string
          bio: string
          city: string
          country: string
          full_name: string
          id: string
          learning_languages: Json
          match_score: number
          native_languages: Json
          review_average: number
          review_total: number
          username: string
        }[]
      }
      get_my_chats: {
        Args: never
        Returns: {
          conversation_id: string
          last_message: string
          last_message_at: string
          last_message_type: string
          last_sender_id: string
          partner_avatar: string
          partner_country: string
          partner_id: string
          partner_name: string
          partner_username: string
          unread_count: number
        }[]
      }
      get_completed_entries: { Args: { p_user: string }; Returns: string[] }
      get_learn_summary: { Args: { p_time_zone?: string }; Returns: Json }
      get_profile_reviews: { Args: { p_limit?: number; p_user: string }; Returns: Json }
      get_review_status: { Args: { p_user: string }; Returns: Json }
      import_learn_progress: { Args: { p_scores: Json }; Returns: number }
      join_club: { Args: { p_club: string }; Returns: undefined }
      leave_club: { Args: { p_club: string }; Returns: undefined }
      list_blocked_users: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
      report_content: {
        Args: { p_id: string; p_kind: string; p_reason: string }
        Returns: undefined
      }
      set_daily_goal: { Args: { p_goal: number }; Returns: undefined }
      submit_review: {
        Args: { p_content: string; p_rating: number; p_tags: string[]; p_user: string }
        Returns: undefined
      }
      unblock_user: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
