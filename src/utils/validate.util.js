const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FREQUENCIES = ['daily', 'weekly'];

const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72; 
const NAME_MAX_LENGTH = 100;
const CATEGORY_MAX_LENGTH = 50;

function invalid(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function cleanText(value, field, { max, required = false }) {
  if (value === undefined || value === null) {
    if (required) throw invalid(`${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw invalid(`${field} must be a string`);

  const trimmed = value.trim();
  if (!trimmed) throw invalid(`${field} cannot be empty`);
  if (trimmed.length > max) throw invalid(`${field} must be at most ${max} characters`);

  return trimmed;
}

// Email disimpan lowercase supaya "Example@mail.com" dan "example@mail.com" tidak jadi 2 akun.
function validateEmail(value) {
  const email = cleanText(value, 'email', { max: EMAIL_MAX_LENGTH, required: true });
  if (!EMAIL_PATTERN.test(email)) throw invalid('email format is invalid');
  return email.toLowerCase();
}

// Password tidak di-trim
function validatePassword(value) {
  if (typeof value !== 'string' || value.length === 0) throw invalid('password is required');
  if (value.length < PASSWORD_MIN_LENGTH) {
    throw invalid(`password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (Buffer.byteLength(value, 'utf8') > PASSWORD_MAX_BYTES) {
    throw invalid(`password must be at most ${PASSWORD_MAX_BYTES} bytes`);
  }
  return value;
}

function validateFrequency(value) {
  if (typeof value !== 'string' || !FREQUENCIES.includes(value.trim().toLowerCase())) {
    throw invalid(`frequency must be one of: ${FREQUENCIES.join(', ')}`);
  }
  return value.trim().toLowerCase();
}

function validateRegistration(body) {
  const input = body || {};
  return {
    email: validateEmail(input.email),
    password: validatePassword(input.password),
    name: cleanText(input.name, 'name', { max: NAME_MAX_LENGTH, required: true }),
  };
}

function validateCredentials(body) {
  const input = body || {};
  const email = validateEmail(input.email);
  if (typeof input.password !== 'string' || input.password.length === 0) {
    throw invalid('password is required');
  }
  return { email, password: input.password };
}

function validateHabitInput(body) {
  const input = body || {};
  const category = cleanText(input.category, 'category', { max: CATEGORY_MAX_LENGTH });
  return {
    name: cleanText(input.name, 'name', { max: NAME_MAX_LENGTH, required: true }),
    category: category === undefined ? null : category,
    frequency: validateFrequency(input.frequency),
  };
}

// Hanya field yang dibutuhkan yang dikirim, divalidasi
// dan diteruskan, supaya PUT tidak menimpa kolom lain dengan null.
function validateHabitUpdate(body) {
  const input = body || {};
  const updates = {};

  if (input.name !== undefined) {
    updates.name = cleanText(input.name, 'name', { max: NAME_MAX_LENGTH, required: true });
  }
  if (input.category !== undefined) {
    const category = cleanText(input.category, 'category', { max: CATEGORY_MAX_LENGTH });
    updates.category = category === undefined ? null : category;
  }
  if (input.frequency !== undefined) {
    updates.frequency = validateFrequency(input.frequency);
  }

  if (Object.keys(updates).length === 0) {
    throw invalid('at least one of name, category, or frequency is required');
  }
  return updates;
}

// Error handler bila UUID tidak valid, supaya tidak dilempar ke database dan jadi 500 error.
function validateUuid(value, field) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw invalid(`${field} must be a valid UUID`);
  }
  return value;
}

module.exports = {
  validateRegistration,
  validateCredentials,
  validateHabitInput,
  validateHabitUpdate,
  validateUuid,
};
