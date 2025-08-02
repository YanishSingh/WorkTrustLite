const xss = require('xss');

/**
 * Input Validation and Sanitization Utility
 * Provides comprehensive validation and sanitization for user inputs
 */

// XSS Sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return xss(input, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'] // Remove script tags and their content
  });
};

// Name validation and sanitization
const validateAndSanitizeName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required and must be a string' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { isValid: false, error: 'Name cannot be empty' };
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' };
  }

  // Check for HTML/script tags
  const htmlTagRegex = /<[^>]*>/g;
  if (htmlTagRegex.test(trimmedName)) {
    return { isValid: false, error: 'Name cannot contain HTML tags' };
  }

  // Check for potentially dangerous characters
  const dangerousCharsRegex = /[<>\"'&]/g;
  if (dangerousCharsRegex.test(trimmedName)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  // Sanitize the name
  const sanitizedName = sanitizeInput(trimmedName);
  
  return { 
    isValid: true, 
    sanitizedValue: sanitizedName 
  };
};

// Email validation and sanitization
const validateAndSanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required and must be a string' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length === 0) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please provide a valid email address' };
  }

  // Check for HTML/script tags
  const htmlTagRegex = /<[^>]*>/g;
  if (htmlTagRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Email cannot contain HTML tags' };
  }

  // Check for potentially dangerous characters
  const dangerousCharsRegex = /[<>\"'&]/g;
  if (dangerousCharsRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Email contains invalid characters' };
  }

  return { 
    isValid: true, 
    sanitizedValue: trimmedEmail 
  };
};

// Role validation
const validateRole = (role) => {
  const validRoles = ['client', 'freelancer'];
  
  if (!role || typeof role !== 'string') {
    return { isValid: false, error: 'Role is required and must be a string' };
  }

  const trimmedRole = role.trim().toLowerCase();
  
  if (!validRoles.includes(trimmedRole)) {
    return { isValid: false, error: 'Role must be either "client" or "freelancer"' };
  }

  return { 
    isValid: true, 
    sanitizedValue: trimmedRole 
  };
};

// Description/bio validation and sanitization
const validateAndSanitizeDescription = (description, fieldName = 'Description') => {
  if (!description || typeof description !== 'string') {
    return { isValid: true, sanitizedValue: '' }; // Optional field
  }

  const trimmedDescription = description.trim();
  
  if (trimmedDescription.length > 500) {
    return { isValid: false, error: `${fieldName} must be less than 500 characters` };
  }

  // Check for HTML/script tags
  const htmlTagRegex = /<[^>]*>/g;
  if (htmlTagRegex.test(trimmedDescription)) {
    return { isValid: false, error: `${fieldName} cannot contain HTML tags` };
  }

  // Sanitize the description
  const sanitizedDescription = sanitizeInput(trimmedDescription);
  
  return { 
    isValid: true, 
    sanitizedValue: sanitizedDescription 
  };
};

module.exports = {
  sanitizeInput,
  validateAndSanitizeName,
  validateAndSanitizeEmail,
  validateRole,
  validateAndSanitizeDescription
}; 