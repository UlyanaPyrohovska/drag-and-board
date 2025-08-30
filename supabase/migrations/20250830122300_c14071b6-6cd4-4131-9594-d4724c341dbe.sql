-- First, drop existing tables to rebuild from scratch
DROP TABLE IF EXISTS public.card_comments CASCADE;
DROP TABLE IF EXISTS public.board_members CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.lists CASCADE;
DROP TABLE IF EXISTS public.boards CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create profiles table first (needed for foreign keys)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Create boards table
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New Board',
  description TEXT,
  background_color TEXT NOT NULL DEFAULT '#0079bf',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on boards
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for boards
CREATE POLICY "Users can view their own boards" ON public.boards
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards" ON public.boards
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" ON public.boards
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON public.boards
FOR DELETE USING (auth.uid() = user_id);

-- Create lists table
CREATE TABLE public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New List',
  position INTEGER NOT NULL DEFAULT 0,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on lists
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lists
CREATE POLICY "Users can view lists in their boards" ON public.lists
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = lists.board_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create lists in their boards" ON public.lists
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = lists.board_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update lists in their boards" ON public.lists
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = lists.board_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete lists in their boards" ON public.lists
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = lists.board_id AND boards.user_id = auth.uid()
  )
);

-- Create cards table
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New Card',
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cards
CREATE POLICY "Users can view cards in their boards" ON public.cards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lists 
    JOIN public.boards ON boards.id = lists.board_id
    WHERE lists.id = cards.list_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create cards in their boards" ON public.cards
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lists 
    JOIN public.boards ON boards.id = lists.board_id
    WHERE lists.id = cards.list_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update cards in their boards" ON public.cards
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.lists 
    JOIN public.boards ON boards.id = lists.board_id
    WHERE lists.id = cards.list_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete cards in their boards" ON public.cards
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.lists 
    JOIN public.boards ON boards.id = lists.board_id
    WHERE lists.id = cards.list_id AND boards.user_id = auth.uid()
  )
);

-- Create card_comments table
CREATE TABLE public.card_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on card_comments
ALTER TABLE public.card_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for card_comments
CREATE POLICY "Users can view comments on cards in their boards" ON public.card_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cards 
    JOIN public.lists ON lists.id = cards.list_id
    JOIN public.boards ON boards.id = lists.board_id
    WHERE cards.id = card_comments.card_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments on cards in their boards" ON public.card_comments
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.cards 
    JOIN public.lists ON lists.id = cards.list_id
    JOIN public.boards ON boards.id = lists.board_id
    WHERE cards.id = card_comments.card_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own comments" ON public.card_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.card_comments
FOR DELETE USING (auth.uid() = user_id);

-- Create board_members table
CREATE TABLE public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- Enable RLS on board_members
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for board_members
CREATE POLICY "Users can view members of their boards" ON public.board_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = board_members.board_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Board owners can manage members" ON public.board_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = board_members.board_id AND boards.user_id = auth.uid()
  )
);

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_card_comments_updated_at BEFORE UPDATE ON public.card_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Create trigger for new user profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();