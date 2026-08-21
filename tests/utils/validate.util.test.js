const {
  validateRegistration,
  validateCredentials,
  validateHabitInput,
  validateHabitUpdate,
  validateUuid,
} = require('../../src/utils/validate.util');

const UUID = '11111111-1111-4111-8111-111111111111';

function statusOf(fn) {
  try {
    fn();
  } catch (err) {
    return err.status;
  }
  return null;
}

describe('validateRegistration', () => {
  const valid = { email: 'budi@mail.com', password: 'rahasia123', name: 'Budi' };

  test('returns the cleaned input', () => {
    expect(validateRegistration({ ...valid, name: '  Budi  ' })).toEqual({
      email: 'budi@mail.com',
      password: 'rahasia123',
      name: 'Budi',
    });
  });

  test('lowercases the email so casing cannot create two accounts', () => {
    expect(validateRegistration({ ...valid, email: 'Budi@Mail.COM' }).email).toBe('budi@mail.com');
  });

  test('keeps the password exactly as typed, including surrounding spaces', () => {
    expect(validateRegistration({ ...valid, password: '  spasi123  ' }).password).toBe('  spasi123  ');
  });

  test.each([
    ['missing email', { ...valid, email: undefined }],
    ['email without @', { ...valid, email: 'budimail.com' }],
    ['email without domain', { ...valid, email: 'budi@mail' }],
    ['email with a space', { ...valid, email: 'bu di@mail.com' }],
    ['blank name', { ...valid, name: '   ' }],
    ['name that is not a string', { ...valid, name: 42 }],
    ['name over 100 characters', { ...valid, name: 'a'.repeat(101) }],
    ['missing password', { ...valid, password: undefined }],
    ['password under 8 characters', { ...valid, password: 'pendek' }],
    ['password over 72 bytes', { ...valid, password: 'a'.repeat(73) }],
  ])('rejects %s with 400', (_label, body) => {
    expect(statusOf(() => validateRegistration(body))).toBe(400);
  });

  test('rejects a missing body instead of crashing', () => {
    expect(statusOf(() => validateRegistration(undefined))).toBe(400);
  });
});

describe('validateCredentials', () => {
  test('does not enforce the password policy on login', () => {
    // akun lama boleh punya password pendek; menolaknya di login akan
    // mengunci user sekaligus membocorkan aturan password
    expect(validateCredentials({ email: 'budi@mail.com', password: 'x' })).toEqual({
      email: 'budi@mail.com',
      password: 'x',
    });
  });

  test('still requires a password to be present', () => {
    expect(statusOf(() => validateCredentials({ email: 'budi@mail.com' }))).toBe(400);
  });

  test('still rejects a malformed email', () => {
    expect(statusOf(() => validateCredentials({ email: 'bukan-email', password: 'x' }))).toBe(400);
  });
});

describe('validateHabitInput', () => {
  test('defaults category to null when it is not sent', () => {
    expect(validateHabitInput({ name: 'Olahraga', frequency: 'daily' })).toEqual({
      name: 'Olahraga',
      category: null,
      frequency: 'daily',
    });
  });

  test('normalises frequency casing and whitespace', () => {
    expect(validateHabitInput({ name: 'Olahraga', frequency: ' Daily ' }).frequency).toBe('daily');
  });

  test.each([
    ['missing name', { frequency: 'daily' }],
    ['blank name', { name: '   ', frequency: 'daily' }],
    ['missing frequency', { name: 'Olahraga' }],
    ['unknown frequency', { name: 'Olahraga', frequency: 'monthly' }],
    ['category over 50 characters', { name: 'Olahraga', frequency: 'daily', category: 'a'.repeat(51) }],
  ])('rejects %s with 400', (_label, body) => {
    expect(statusOf(() => validateHabitInput(body))).toBe(400);
  });
});

describe('validateHabitUpdate', () => {
  test('returns only the fields that were actually sent', () => {
    expect(validateHabitUpdate({ name: 'Lari pagi' })).toEqual({ name: 'Lari pagi' });
  });

  test('allows clearing the category with null', () => {
    expect(validateHabitUpdate({ category: null })).toEqual({ category: null });
  });

  test('rejects an empty body with 400', () => {
    expect(statusOf(() => validateHabitUpdate({}))).toBe(400);
  });

  test('rejects an unknown frequency with 400', () => {
    expect(statusOf(() => validateHabitUpdate({ frequency: 'yearly' }))).toBe(400);
  });
});

describe('validateUuid', () => {
  test('accepts a well formed uuid', () => {
    expect(validateUuid(UUID, 'habit id')).toBe(UUID);
  });

  test.each([['h1'], ['11111111-1111-4111-8111'], [''], [undefined], [123]])(
    'rejects %p with 400',
    (value) => {
      expect(statusOf(() => validateUuid(value, 'habit id'))).toBe(400);
    }
  );

  test('names the field in the message', () => {
    expect(() => validateUuid('h1', 'habit id')).toThrow('habit id must be a valid UUID');
  });
});
