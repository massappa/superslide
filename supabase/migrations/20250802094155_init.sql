CREATE TABLE presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content JSONB,
    outline TEXT[],
    theme TEXT,
    image_model TEXT,
    presentation_style TEXT,
    language TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE custom_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    theme_data JSONB NOT NULL,
    logo_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE favorite_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, presentation_id)
);

CREATE TABLE generated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_presentations_updated_at
BEFORE UPDATE ON presentations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_themes_updated_at
BEFORE UPDATE ON custom_themes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own presentations"
ON presentations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can see public presentations"
ON presentations FOR SELECT
USING (is_public = TRUE);

CREATE POLICY "Users can insert their own presentations"
ON presentations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presentations"
ON presentations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations"
ON presentations FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own themes"
ON custom_themes FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public themes"
ON custom_themes FOR SELECT
USING (is_public = TRUE);

CREATE POLICY "Users can manage their own favorites"
ON favorite_presentations FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own images"
ON generated_images FOR ALL
USING (auth.uid() = user_id);