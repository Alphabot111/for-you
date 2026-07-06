// middleware/validate.js
// Small helpers to keep user-submitted text safe and reasonable.

const escapeHtml = require('escape-html');

const MAX_ANSWER_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 1000;

/**
 * Clean a single free-text answer: trim, cap length, and escape HTML so
 * it can never be used to inject markup into the admin dashboard or chat.
 */
function cleanText(value, maxLength = MAX_ANSWER_LENGTH) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, maxLength);
  return escapeHtml(trimmed);
}

/**
 * Clean an entire answers object (key -> string) in one pass.
 */
function cleanAnswers(obj) {
  const cleaned = {};
  if (!obj || typeof obj !== 'object') return cleaned;
  Object.keys(obj).forEach((key) => {
    cleaned[key] = cleanText(obj[key]);
  });
  return cleaned;
}

module.exports = {
  cleanText,
  cleanAnswers,
  MAX_ANSWER_LENGTH,
  MAX_MESSAGE_LENGTH,
};
