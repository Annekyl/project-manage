import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amnpnlpumgeojjtdwhpd.supabase.co';
const supabaseKey = 'sb_publishable_mbnqhLGjJtnFEeMZSee38A_WLjBPQ_x';

export const supabase = createClient(supabaseUrl, supabaseKey);
