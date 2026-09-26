// AgriShield AI - Supabase Configuration

const SUPABASE_URL = "https://lqerjpwouhauzczcdgck.supabase.co";

const SUPABASE_KEY = "sb_publishable_Y-gijMpETcYFuvn7JVUfmQ_lhLFInI3";

// Create Supabase connection
if (window.supabase) {

    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    console.log("AgriShield AI: Supabase connected!");

} else {

    console.error("Supabase library not loaded!");

}
