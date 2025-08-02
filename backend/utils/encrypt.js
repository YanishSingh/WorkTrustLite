const crypto = require('crypto');

// Ensure we have a valid encryption key
const getEncryptionKey = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required for email encryption');
  }
  return process.env.JWT_SECRET.slice(0, 32);
};

const IV_LENGTH = 16;

// Encrypt
exports.encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(getEncryptionKey()), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Decrypt
exports.decrypt = (text) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(getEncryptionKey()), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// Email-specific encryption (with validation)
exports.encryptEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email provided for encryption');
  }
  
  // Validate email format before encryption
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  return exports.encrypt(email.toLowerCase());
};

// Email-specific decryption (with validation)
exports.decryptEmail = (encryptedEmail) => {
  if (!encryptedEmail || typeof encryptedEmail !== 'string') {
    throw new Error('Invalid encrypted email provided');
  }
  
  try {
    const decrypted = exports.decrypt(encryptedEmail);
    
    // Validate decrypted email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(decrypted)) {
      throw new Error('Decrypted data is not a valid email');
    }
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt email: ' + error.message);
  }
};

// Hash email for searching (one-way, cannot be reversed)
exports.hashEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email provided for hashing');
  }
  
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
};
