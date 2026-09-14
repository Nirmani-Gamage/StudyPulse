const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;
const RETRY_DELAYS = [2000, 5000, 10000];

/**
 * Reusable helper to call Gemini API with timeout, error classification, and exponential backoff.
 * 
 * @param {string} url - The complete Gemini API endpoint with API key.
 * @param {object} payload - The request payload body (JSON object).
 * @returns {object} The parsed JSON response.
 */
async function callGeminiApi(url, payload) {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    if (attempt > 0) {
      console.log(`[AI Coach] Retry ${attempt} after delay...`);
    } else {
      console.log(`[AI Coach] Gemini request started`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        if (attempt > 0) {
          console.log(`[AI Coach] Gemini request successful`);
        }
        const data = await response.json();
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) throw new Error("Invalid response format from Gemini");
        
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
        return JSON.parse(content);
      } else {
        const status = response.status;
        const text = await response.text();
        
        console.log(`[AI Coach] Gemini returned ${status}`);

        // Classify errors
        const isTemporary = status === 503 || status === 429 || status >= 500;
        
        if (isTemporary) {
          throw new Error(`TEMPORARY_ERROR_${status}: ${text}`);
        } else {
          // Permanent error (e.g. 400, 401, 403, 404)
          throw new Error(`PERMANENT_ERROR_${status}: ${text}`);
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      const isAbort = error.name === 'AbortError';
      const isNetworkOrTemporary = isAbort || 
        error.message.includes('fetch failed') || 
        error.message.includes('TEMPORARY_ERROR');

      if (isNetworkOrTemporary && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt];
        console.log(`[AI Coach] Temporary error - retrying in ${delay / 1000} seconds`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } else {
        if (isNetworkOrTemporary) {
          console.log(`[AI Coach] Gemini unavailable after maximum retries`);
          throw new Error("TEMPORARY_UNAVAILABLE");
        }
        // If permanent error or other failure
        throw error;
      }
    }
  }
}

module.exports = { callGeminiApi };
