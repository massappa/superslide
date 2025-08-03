export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Presentation = {
  id: string;
  user_id: string;
  title: string;
  content: Json | null;
  outline: string[] | null;
  theme: string | null;
  image_model: string | null;
  presentation_style: string | null;
  language: string | null;
  is_public: boolean | null;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};