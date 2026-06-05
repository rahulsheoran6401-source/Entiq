const RESERVED_KEYWORDS = new Set([
  'admin',
  'api',
  'auth',
  'login',
  'user',
  'system',
  'records',
  'entities',
  'projects',
  'fields',
  'config',
  'swagger',
  'docs',
]);

/**
 * Safely generates an alphanumeric underscore-separated slug from a given string.
 * Example: "Employee Details!!!" -> "employee_details"
 */
export function generateSafeSlug(input: string): string {
  // Convert to lowercase
  let slug = input.trim().toLowerCase();

  // Replace spaces and special characters with underscores
  slug = slug.replace(/[^a-z0-9]+/g, '_');

  // Trim leading and trailing underscores
  slug = slug.replace(/^_+|_+$/g, '');

  // If the result is a reserved keyword or empty, append a suffix
  if (RESERVED_KEYWORDS.has(slug) || !slug) {
    slug = `${slug || 'resource'}_custom`;
  }

  return slug;
}
export default generateSafeSlug;
