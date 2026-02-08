// Pakistani phone number validation and formatting

// Valid Pakistani phone formats:
// +92XXXXXXXXXX (country code with 10 digits)
// 03XXXXXXXXX (local mobile format, 11 digits starting with 03)
// 0XXXXXXXXXX (landline, 11 digits)

export const PAKISTANI_PHONE_REGEX = /^(\+92|0)?3[0-9]{9}$/;
export const PAKISTANI_LANDLINE_REGEX = /^(0)?[1-9][0-9]{9,10}$/;

export const formatPakistaniPhone = (phone: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");
  
  // If starts with +92, keep it
  if (cleaned.startsWith("+92")) {
    return cleaned;
  }
  
  // If starts with 92 (without +), add +
  if (cleaned.startsWith("92") && cleaned.length > 10) {
    return "+" + cleaned;
  }
  
  // If starts with 0, convert to +92
  if (cleaned.startsWith("0")) {
    return "+92" + cleaned.substring(1);
  }
  
  // If starts with 3 (just the number), add +92
  if (cleaned.startsWith("3") && cleaned.length === 10) {
    return "+92" + cleaned;
  }
  
  return cleaned;
};

export const validatePakistaniPhone = (phone: string): boolean => {
  if (!phone || phone.trim() === "") return true; // Empty is valid (optional)
  
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // Check for +92 format (13 characters: +92 + 10 digits)
  if (cleaned.startsWith("+92")) {
    return cleaned.length === 13 && /^\+92[3][0-9]{9}$/.test(cleaned);
  }
  
  // Check for 03XX format (11 digits)
  if (cleaned.startsWith("03")) {
    return cleaned.length === 11 && /^03[0-9]{9}$/.test(cleaned);
  }
  
  // Check for landline (starts with 0 followed by area code)
  if (cleaned.startsWith("0")) {
    return cleaned.length >= 10 && cleaned.length <= 12;
  }
  
  // Check for just the number (10 digits starting with 3)
  if (cleaned.startsWith("3")) {
    return cleaned.length === 10;
  }
  
  return false;
};

export const getPhoneError = (phone: string): string | null => {
  if (!phone || phone.trim() === "") return null;
  
  if (!validatePakistaniPhone(phone)) {
    return "Enter a valid Pakistani phone number (e.g., 03XX-XXXXXXX or +92XXXXXXXXXX)";
  }
  
  return null;
};

// Format for display (adds dashes for readability)
export const formatPhoneForDisplay = (phone: string): string => {
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  if (cleaned.startsWith("+92") && cleaned.length === 13) {
    // +92 3XX XXXXXXX
    return `+92 ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  if (cleaned.startsWith("03") && cleaned.length === 11) {
    // 03XX-XXXXXXX
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
  }
  
  return phone;
};
