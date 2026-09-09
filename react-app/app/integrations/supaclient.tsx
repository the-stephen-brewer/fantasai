import { createClient } from "@supabase/supabase-js";
// Old supabase instance
//const supabaseUrl = 'https://zwpzygshsznuayjujeom.supabase.co'
//const supabaseKey = 'sb_publishable_FFXo0b8KExVCQJJG2yhqNA_NHl2D4uM'
const supabaseUrl = "https://jtxtswhzzktficdkllbt.supabase.co";
const supabaseKey = "sb_publishable_eOkOcxl9FLYwlvyusXIsxA_VO6oRcjz";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
