/**
 * Utility functions for safe string operations
 * Prevents errors when dealing with undefined/null values
 */

/**
 * Safely converts a string to lowercase
 * @param value - The string to convert
 * @returns The lowercase string or empty string if value is null/undefined
 */
export const safeToLowerCase = (value: string | null | undefined): string => {
  if (value == null) return '';
  return String(value).toLowerCase();
};

/**
 * Safely checks if a string includes a substring
 * @param str - The main string
 * @param searchStr - The substring to search for
 * @returns true if found, false otherwise
 */
export const safeIncludes = (str: string | null | undefined, searchStr: string | null | undefined): boolean => {
  if (str == null || searchStr == null) return false;
  return safeToLowerCase(str).includes(safeToLowerCase(searchStr));
};

/**
 * Safely removes accents from a string
 * @param str - The string to process
 * @returns The string without accents
 */
export const safeRemoveAccents = (str: string | null | undefined): string => {
  if (str == null) return '';
  
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

/**
 * Safely formats a string for search comparison
 * @param str - The string to format
 * @returns The formatted string ready for search
 */
export const safeFormatForSearch = (str: string | null | undefined): string => {
  if (str == null) return '';
  return safeRemoveAccents(str).trim();
};

/**
 * Safely checks if two strings are equal (case-insensitive)
 * @param str1 - First string
 * @param str2 - Second string
 * @returns true if equal, false otherwise
 */
export const safeEquals = (str1: string | null | undefined, str2: string | null | undefined): boolean => {
  return safeToLowerCase(str1) === safeToLowerCase(str2);
};

/**
 * Safely checks if a string starts with a prefix
 * @param str - The main string
 * @param prefix - The prefix to check
 * @returns true if starts with prefix, false otherwise
 */
export const safeStartsWith = (str: string | null | undefined, prefix: string | null | undefined): boolean => {
  if (str == null || prefix == null) return false;
  return safeToLowerCase(str).startsWith(safeToLowerCase(prefix));
};

/**
 * Safely checks if a string ends with a suffix
 * @param str - The main string
 * @param suffix - The suffix to check
 * @returns true if ends with suffix, false otherwise
 */
export const safeEndsWith = (str: string | null | undefined, suffix: string | null | undefined): boolean => {
  if (str == null || suffix == null) return false;
  return safeToLowerCase(str).endsWith(safeToLowerCase(suffix));
};

/**
 * Safely trims a string
 * @param str - The string to trim
 * @returns The trimmed string or empty string if null/undefined
 */
export const safeTrim = (str: string | null | undefined): string => {
  if (str == null) return '';
  return String(str).trim();
};

/**
 * Safely gets the length of a string
 * @param str - The string to measure
 * @returns The length of the string or 0 if null/undefined
 */
export const safeLength = (str: string | null | undefined): number => {
  if (str == null) return 0;
  return String(str).length;
};

/**
 * Safely checks if a string is empty
 * @param str - The string to check
 * @returns true if empty or null/undefined, false otherwise
 */
export const safeIsEmpty = (str: string | null | undefined): boolean => {
  return safeTrim(str).length === 0;
};

/**
 * Safely capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The capitalized string or empty string if null/undefined
 */
export const safeCapitalize = (str: string | null | undefined): string => {
  if (safeIsEmpty(str)) return '';
  const trimmed = safeTrim(str);
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Safely formats a string for display (capitalizes first letter of each word)
 * @param str - The string to format
 * @returns The formatted string
 */
export const safeFormatForDisplay = (str: string | null | undefined): string => {
  if (safeIsEmpty(str)) return '';
  return safeTrim(str)
    .split(' ')
    .map(word => safeCapitalize(word))
    .join(' ');
};





