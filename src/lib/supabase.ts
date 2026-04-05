import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xsltpssytriidsvqdake.supabase.co";
const supabaseKey = "sb_publishable_JxL6JFgs3-GtIqkkaXGKyA_sY4N_EYF";

export const supabase = createClient(supabaseUrl, supabaseKey);