/**
 * Safely copies text to the clipboard with fallback for non-secure contexts and older browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try navigator.clipboard first if available and secure
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard failed, trying fallback...', err);
    }
  }

  // Fallback method using textarea
  const textArea = document.createElement('textarea');
  textArea.value = text;
  
  // Keep it hidden and offscreen
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  textArea.setAttribute('readonly', ''); // Prevent keyboard popup on mobile
  
  document.body.appendChild(textArea);
  
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    document.body.removeChild(textArea);
    return false;
  }
}
