-- Create enums
CREATE TYPE nail_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- Nails catalog table
CREATE TABLE nails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  rarity nail_rarity NOT NULL,
  base_damage INTEGER NOT NULL,
  sell_value INTEGER NOT NULL,
  dream_sell_value INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL UNIQUE,
  soul INTEGER DEFAULT 0 CHECK (soul >= 0),
  coins INTEGER DEFAULT 100 CHECK (coins >= 0),
  dream_points INTEGER DEFAULT 0 CHECK (dream_points >= 0),
  masks INTEGER DEFAULT 5 CHECK (masks >= 0),
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User's nail inventory
CREATE TABLE user_nails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nail_id UUID REFERENCES nails(id),
  is_dream BOOLEAN DEFAULT false,
  acquired_at TIMESTAMPTZ DEFAULT now()
);

-- Admin gift links
CREATE TABLE admin_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  soul_amount INTEGER DEFAULT 0,
  dream_points_amount INTEGER DEFAULT 0,
  uses_remaining INTEGER,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Claimed admin links
CREATE TABLE admin_link_claims (
  link_id UUID REFERENCES admin_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (link_id, user_id)
);

-- Trade links for sending nails
CREATE TABLE trade_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_nail_id UUID REFERENCES user_nails(id) ON DELETE CASCADE,
  claimed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  claimed_at TIMESTAMPTZ
);

-- Combat history
CREATE TABLE combat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nail_id UUID REFERENCES nails(id),
  is_dream BOOLEAN DEFAULT false,
  won BOOLEAN NOT NULL,
  soul_gained INTEGER DEFAULT 0,
  dream_points_gained INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles (for admin)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nails ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_link_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nails ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies

-- Nails: everyone can read
CREATE POLICY "Anyone can view nails" ON nails FOR SELECT USING (true);

-- Profiles: users can view all, update own
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User nails: users manage their own
CREATE POLICY "Users can view own nails" ON user_nails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nails" ON user_nails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own nails" ON user_nails FOR DELETE USING (auth.uid() = user_id);

-- Admin links: admins can create/manage, everyone can view
CREATE POLICY "Admins can manage links" ON admin_links FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view admin links" ON admin_links FOR SELECT USING (true);

-- Admin link claims: users can view/insert own claims
CREATE POLICY "Users can view own claims" ON admin_link_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own claims" ON admin_link_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trade links: sender can create, anyone can view/claim
CREATE POLICY "Users can create trade links" ON trade_links FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Anyone can view trade links" ON trade_links FOR SELECT USING (true);
CREATE POLICY "Anyone can claim trade links" ON trade_links FOR UPDATE USING (claimed_by IS NULL OR auth.uid() = claimed_by);

-- Combat history: users manage own
CREATE POLICY "Users can view own combat history" ON combat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own combat history" ON combat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: admins can manage, users can view
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view all roles" ON user_roles FOR SELECT USING (true);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, soul, coins, dream_points, masks)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nickname', 'Knight'),
    0,
    100,
    0,
    5
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert nail data
INSERT INTO nails (name, name_ru, rarity, base_damage, sell_value, dream_sell_value, order_index) VALUES
  ('Old Nail', 'Старый Гвоздь', 'common', 5, 10, 50, 1),
  ('Sharpened Nail', 'Заточенный Гвоздь', 'uncommon', 9, 50, 150, 2),
  ('Channelled Nail', 'Направленный Гвоздь', 'rare', 13, 150, 400, 3),
  ('Coiled Nail', 'Витой Гвоздь', 'epic', 17, 400, 1000, 4),
  ('Pure Nail', 'Чистый Гвоздь', 'legendary', 21, 1000, 2500, 5);