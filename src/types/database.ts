export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProfilesRow = {
  id: string;
  display_name: string | null;
  onboarding_completed: boolean;
  preferences: Json;
  created_at: string;
  updated_at: string;
};

type RoutinesRow = {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  ai_rationale: string;
  created_at: string;
  updated_at: string;
};

type RoutineDaysRow = {
  id: string;
  routine_id: string;
  day_index: number;
  name: string;
  focus: string;
};

type ExercisesRow = {
  id: string;
  day_id: string;
  sort_order: number;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  muscles: string[];
  notes: string;
  demo_url: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: {
          id: string;
          display_name?: string | null;
          onboarding_completed?: boolean;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProfilesRow>;
        Relationships: [];
      };
      routines: {
        Row: RoutinesRow;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          summary?: string;
          ai_rationale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<RoutinesRow>;
        Relationships: [];
      };
      routine_days: {
        Row: RoutineDaysRow;
        Insert: {
          id?: string;
          routine_id: string;
          day_index: number;
          name: string;
          focus?: string;
        };
        Update: Partial<RoutineDaysRow>;
        Relationships: [];
      };
      exercises: {
        Row: ExercisesRow;
        Insert: {
          id?: string;
          day_id: string;
          sort_order?: number;
          name: string;
          sets?: number;
          reps?: string;
          rest_seconds?: number;
          muscles?: string[];
          notes?: string;
          demo_url?: string | null;
        };
        Update: Partial<ExercisesRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Routine = Database["public"]["Tables"]["routines"]["Row"];
export type RoutineDay = Database["public"]["Tables"]["routine_days"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export type RoutineWithDays = Routine & {
  days: (RoutineDay & { exercises: Exercise[] })[];
};
