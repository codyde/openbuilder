/**
 * Utility functions for safe clipboard operations
 * Handles the NotAllowedError that occurs when document is not focused
 */

export async function copyToClipboard(text: string): Promise<{ success: boolean; error?: string }> {
  // Check if Clipboard API is available
  if (!navigator.clipboard) {
    return {
      success: false,
      error: 'Clipboard API not available in this browser',
    };
  }

  // Check if document has focus (required by Clipboard API)
  if (!document.hasFocus()) {
    return {
      success: false,
      error: 'Please focus the window before copying',
    };
  }

  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (err) {
    // Log the specific error type
    const errorMessage = err instanceof Error ? err.message : 'Unknown clipboard error';
    console.error('Failed to copy to clipboard:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}