-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Custom types
create type transaction_type as enum ('income', 'expense');

-- Users table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  color text,
  icon text,
  is_system boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- Transactions table
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid not null, -- References accounts table
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12, 2) not null,
  description text,
  date date not null,
  type transaction_type not null,
  is_recurring boolean default false,
  recurrence_frequency text, -- daily, weekly, monthly, yearly
  recurrence_end_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint positive_amount check (amount > 0)
);

-- Accounts table
create table if not exists public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null, -- checking, savings, credit, investment, etc.
  balance numeric(12, 2) default 0.00,
  currency text default 'USD',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- Add foreign key constraint to transactions table
alter table public.transactions
  add constraint transactions_account_id_fkey
  foreign key (account_id) references public.accounts(id) on delete cascade;

-- Create indexes for better query performance
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_date on public.transactions(date);
create index idx_transactions_category_id on public.transactions(category_id);
create index idx_accounts_user_id on public.accounts(user_id);
create index idx_categories_user_id on public.categories(user_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.accounts enable row level security;

-- Create policies for Row Level Security
-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Categories policies
create policy "Users can view their own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Accounts policies
create policy "Users can view their own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own accounts"
  on public.accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- Create a trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a function to update the updated_at column
execute format('create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;');

-- Create triggers to update updated_at columns
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_categories_updated_at
  before update on public.categories
  for each row execute procedure public.update_updated_at_column();

create trigger update_transactions_updated_at
  before update on public.transactions
  for each row execute procedure public.update_updated_at_column();

create trigger update_accounts_updated_at
  before update on public.accounts
  for each row execute procedure public.update_updated_at_column();

-- Create default categories for new users
create or replace function public.create_default_categories()
returns trigger as $$
begin
  -- Income categories
  insert into public.categories (user_id, name, is_system, color, icon)
  values 
    (new.id, 'Salary', true, '#10B981', 'dollar-sign'),
    (new.id, 'Freelance', true, '#3B82F6', 'briefcase'),
    (new.id, 'Investments', true, '#8B5CF6', 'trending-up'),
    (new.id, 'Gifts', true, '#EC4899', 'gift'),
    (new.id, 'Other Income', true, '#9CA3AF', 'plus-circle');
    
  -- Expense categories
  insert into public.categories (user_id, name, is_system, color, icon)
  values
    (new.id, 'Housing', true, '#F59E0B', 'home'),
    (new.id, 'Utilities', true, '#3B82F6', 'zap'),
    (new.id, 'Groceries', true, '#10B981', 'shopping-cart'),
    (new.id, 'Transportation', true, '#6366F1', 'car'),
    (new.id, 'Health', true, '#EC4899', 'heart'),
    (new.id, 'Entertainment', true, '#8B5CF6', 'film'),
    (new.id, 'Dining', true, '#F59E0B', 'utensils'),
    (new.id, 'Shopping', true, '#EC4899', 'shopping-bag'),
    (new.id, 'Education', true, '#3B82F6', 'book-open'),
    (new.id, 'Other Expenses', true, '#9CA3AF', 'minus-circle');
    
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to create default categories when a new profile is created
create or replace trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.create_default_categories();

-- Create a default account for new users
create or replace function public.create_default_account()
returns trigger as $$
begin
  insert into public.accounts (user_id, name, type, balance)
  values (new.id, 'Cash', 'cash', 0.00);
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to create a default account when a new profile is created
create or replace trigger on_profile_created_account
  after insert on public.profiles
  for each row execute procedure public.create_default_account();

-- Function to get current user's balance
create or replace function public.get_user_balance()
returns numeric as $$
declare
  total_income numeric;
  total_expenses numeric;
begin
  select coalesce(sum(amount), 0) into total_income
  from public.transactions
  where user_id = auth.uid() and type = 'income';
  
  select coalesce(sum(amount), 0) into total_expenses
  from public.transactions
  where user_id = auth.uid() and type = 'expense';
  
  return total_income - total_expenses;
end;
$$ language plpgsql security definer;

-- Function to get category spending breakdown
create or replace function public.get_category_spending(start_date date, end_date date)
returns table (
  category_id uuid,
  category_name text,
  total_amount numeric,
  percentage numeric
) as $$
begin
  return query
  select 
    c.id as category_id,
    c.name as category_name,
    sum(t.amount) as total_amount,
    (sum(t.amount) * 100.0 / nullif((select sum(amount) 
                                   from public.transactions 
                                   where user_id = auth.uid() 
                                   and type = 'expense'
                                   and date between start_date and end_date), 0)) as percentage
  from public.transactions t
  join public.categories c on t.category_id = c.id
  where t.user_id = auth.uid()
    and t.type = 'expense'
    and t.date between start_date and end_date
  group by c.id, c.name
  order by total_amount desc;
end;
$$ language plpgsql security definer;
