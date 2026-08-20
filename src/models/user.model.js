const { getSupabaseClient } = require('../config/db');

async function createUser({ email, passwordHash, name }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .insert({ email, password_hash: passwordHash, name })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function findUserByEmail(email) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { createUser, findUserByEmail };
