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

async function findHabitById(habitId, userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function updateHabit(habitId, userId, updates) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function deleteHabit(habitId, userId) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

module.exports = { createHabit, findHabitsByUser, findHabitById, updateHabit, deleteHabit };
