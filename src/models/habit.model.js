const { getSupabaseClient } = require('../config/db');

async function createHabit({ userId, name, category, frequency }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: userId, name, category, frequency })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function findHabitsByUser(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { createHabit, findHabitsByUser };
