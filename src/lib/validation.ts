// Shared validation rules used across server actions and client forms.
// English by default — the UI renders its own localized messages.

// Egyptian phone numbers: +20 10x xxx xxxx / 01x xxxx xxx / optional +20 / spaces & dashes allowed.
export const PHONE_REGEX = /^(\+2?0?1[0125][0-9]{8})$/;
// Same as above but tolerates spaces/dashes (display), strict server check is PHONE_REGEX.
export const PHONE_REGEX_LOOSE = /^\+?(2)?0?1[0125][0-9\s-]{8,9}$/;

export function isValidEgyptianPhone(value: string): boolean {
  const digits = value.replace(/[\s-]/g, "");
  return PHONE_REGEX.test(digits);
}

// Minimum: 8 chars with at least one letter and one digit.
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function isValidPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value);
}
