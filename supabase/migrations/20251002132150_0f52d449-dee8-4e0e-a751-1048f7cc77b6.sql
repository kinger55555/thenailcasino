-- Set all existing coins to 0 and update soul
UPDATE public.profiles
SET soul = soul + coins,
    coins = 0
WHERE coins > 0;