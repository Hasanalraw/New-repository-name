-- 1. إنشاء جدول user_data لحفظ إجابات المستخدمين وتقدمهم الدراسي
create table if not exists public.user_data (
  user_id text primary key,
  email text,
  answers jsonb default '{}'::jsonb,
  progress numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. تفعيل نظام حماية Row Level Security (RLS)
alter table public.user_data enable row level security;

-- 3. مسح السياسات القديمة إن وجدت لتجنب الأخطاء
drop policy if exists "Allow access by user_id" on public.user_data;
drop policy if exists "Allow public access for anonymous users" on public.user_data;

-- 4. إنشاء سياسة تسمح بالوصول الكامل (القراءة، الإدخال، التحديث، الحذف) لأي رمز وصول
-- بما أننا نستخدم رمز موحد ونظام Device UUID مستقل، فنحن نسمح بالوصول الكامل للبيانات
create policy "Allow public access for anonymous users" on public.user_data
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- 5. منح جميع صلاحيات الاستخدام لرموز الـ API
grant all privileges on table public.user_data to anon;
grant all privileges on table public.user_data to authenticated;

-- 6. تحديث ذاكرة التخزين المؤقت لـ PostgREST للتعرف الفوري على الجدول
notify pgrst, 'reload schema';
