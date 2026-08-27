const SUPABASE_URL = 'https://wbvvhlrrutmjawrwzwhk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_QJsp3Dn1V4bxHP1DmPLlLA_coWw9tDX';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const EVENT_KEY = 'future-school-main';
