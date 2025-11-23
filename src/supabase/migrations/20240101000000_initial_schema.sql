-- Enable Row Level Security
alter publication supabase_realtime enable;

-- Create custom types
create type transaction_status as enum ('pending', 'processed', 'reviewed');

-- Categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text default '#3b82f6',
  icon text default 'dollar-sign',
  is_income boolean default false,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade,
  constraint categories_name_user_id_key unique (name, user_id)
);

-- Transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(12, 2) not null,
  date date not null,
  merchant_name text,
  category_id uuid references public.categories(id) on delete set null,
  status transaction_status default 'pending',
  raw_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- Predictions table
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  confidence numeric(5, 4) not null,
  model_version text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- Feedback table
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade,
  original_category_id uuid references public.categories(id) on delete set null,
  corrected_category_id uuid references public.categories(id) on delete set null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- User profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  currency text default 'USD',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_date on public.transactions(date);
create index idx_transactions_category_id on public.transactions(category_id);
create index idx_categories_user_id on public.categories(user_id);
create index idx_predictions_transaction_id on public.predictions(transaction_id);

-- Enable RLS
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.predictions enable row level security;
alter table public.feedback enable row level security;
alter table public.profiles enable row level security;

-- RLS Policies
-- Categories
create policy "Users can view their own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id);

-- Transactions
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

-- Predictions
create policy "Users can view their own predictions"
  on public.predictions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own predictions"
  on public.predictions for insert
  with check (auth.uid() = user_id);

-- Feedback
create policy "Users can manage their own feedback"
  on public.feedback
  for all
  using (auth.uid() = user_id);

-- Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create default categories for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  
  -- Insert default categories
  insert into public.categories (name, description, color, icon, is_income, user_id)
  values
    ('Food & Dining', 'Restaurants, coffee shops, and food delivery', '#3b82f6', 'utensils', false, new.id),
    ('Shopping', 'Clothing, electronics, and other purchases', '#8b5cf6', 'shopping-bag', false, new.id),
    ('Housing', 'Rent, mortgage, and home maintenance', '#10b981', 'home', false, new.id),
    ('Transportation', 'Gas, public transit, and car maintenance', '#f59e0b', 'car', false, new.id),
    ('Entertainment', 'Movies, games, and other leisure activities', '#ec4899', 'film', false, new.id),
    ('Health', 'Doctor visits, medication, and health insurance', '#ef4444', 'heart-pulse', false, new.id),
    ('Education', 'Tuition, books, and educational materials', '#06b6d4', 'book-open', false, new.id),
    ('Personal Care', 'Haircuts, gym memberships, etc.', '#14b8a6', 'scissors', false, new.id),
    ('Income', 'Salary, bonuses, and other income', '#10b981', 'dollar-sign', true, new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up realtime
create publication supabase_realtime;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.categories;
