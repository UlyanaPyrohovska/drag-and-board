-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add favorite boards functionality
ALTER TABLE public.boards ADD COLUMN is_favorite BOOLEAN DEFAULT false;

-- Add board members table for collaboration
CREATE TABLE public.board_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- Enable RLS on board_members
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Board members policies
CREATE POLICY "Board members can view their memberships" 
ON public.board_members 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.boards 
  WHERE id = board_id AND user_id = auth.uid()
));

CREATE POLICY "Board owners can manage members" 
ON public.board_members 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.boards 
  WHERE id = board_id AND user_id = auth.uid()
));

-- Update boards policies to include shared boards
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
CREATE POLICY "Users can view their own and shared boards" 
ON public.boards 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE board_id = id AND user_id = auth.uid()
  )
);

-- Add chat functionality to cards
CREATE TABLE public.card_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on card_comments
ALTER TABLE public.card_comments ENABLE ROW LEVEL SECURITY;

-- Card comments policies
CREATE POLICY "Users can view comments on accessible cards" 
ON public.card_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.cards c
  JOIN public.lists l ON l.id = c.list_id
  JOIN public.boards b ON b.id = l.board_id
  WHERE c.id = card_id AND (
    b.user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.board_members bm 
      WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
    )
  )
));

CREATE POLICY "Users can create comments on accessible cards" 
ON public.card_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.cards c
    JOIN public.lists l ON l.id = c.list_id
    JOIN public.boards b ON b.id = l.board_id
    WHERE c.id = card_id AND (
      b.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.board_members bm 
        WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can update their own comments" 
ON public.card_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.card_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for profiles auto-creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_card_comments_updated_at
BEFORE UPDATE ON public.card_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();