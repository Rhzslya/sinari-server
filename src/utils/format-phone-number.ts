export const formatPhoneNumber = (phone: string): string => {
  let formatted = phone.replace(/\D/g, "");

  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.slice(1);
  }

  if (!formatted.startsWith("62")) {
    formatted = "62" + formatted;
  }

  return formatted;
};
