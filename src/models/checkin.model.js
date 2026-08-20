const { getSupabaseClient } = require('../config/db');

async function createCheckin({ habitId, date, completed }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('checkins')
    .insert({ habit_id: habitId, date, completed })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function findCheckinsByHabit(habitId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('habit_id', habitId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { createCheckin, findCheckinsByHabit };
