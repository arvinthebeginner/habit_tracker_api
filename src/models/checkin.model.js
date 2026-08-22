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

async function findCheckinByHabitAndDate(habitId, date) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('habit_id', habitId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function deleteCheckinByHabitAndDate(habitId, date) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('checkins')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date)
    .select()
    .maybeSingle();

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

module.exports = {
  createCheckin,
  findCheckinByHabitAndDate,
  deleteCheckinByHabitAndDate,
  findCheckinsByHabit,
};
