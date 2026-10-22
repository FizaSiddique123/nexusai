export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMOptions {
  prompt: string;
  systemPrompt?: string;
  history?: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

export class LLMService {
  /**
   * Check if any external LLM provider is configured
   */
  static isConfigured(): boolean {
    return Boolean(
      process.env.GEMINI_API_KEY?.trim() && !process.env.GEMINI_API_KEY.includes('your_gemini') ||
      process.env.OPENAI_API_KEY?.trim() && !process.env.OPENAI_API_KEY.includes('your_openai') ||
      process.env.ANTHROPIC_API_KEY?.trim() && !process.env.ANTHROPIC_API_KEY.includes('your_anthropic')
    );
  }

  /**
   * Get active provider name
   */
  static getActiveProvider(): string {
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_gemini')) return 'Google Gemini';
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai')) return 'OpenAI';
    if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your_anthropic')) return 'Anthropic Claude';
    return 'Nexus Autonomous Academic Engine (Deterministic Offline Mode)';
  }

  /**
   * Call external LLM if configured, otherwise return null to trigger deterministic engine
   */
  static async callLLM(options: LLMOptions): Promise<string | null> {
    const { prompt, systemPrompt, history = [], temperature = 0.4, maxTokens = 2048 } = options;

    // 1. Google Gemini
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey && !geminiKey.includes('your_gemini')) {
      try {
        return await this.callGemini(prompt, systemPrompt, history, geminiKey, temperature, maxTokens);
      } catch (err: any) {
        console.warn('[LLMService] Gemini API call failed, falling back to next provider or offline engine:', err.message);
      }
    }

    // 2. OpenAI / OpenAI Compatible
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (openaiKey && !openaiKey.includes('your_openai')) {
      try {
        return await this.callOpenAI(prompt, systemPrompt, history, openaiKey, temperature, maxTokens);
      } catch (err: any) {
        console.warn('[LLMService] OpenAI API call failed, falling back to next provider or offline engine:', err.message);
      }
    }

    // 3. Anthropic Claude
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (anthropicKey && !anthropicKey.includes('your_anthropic')) {
      try {
        return await this.callAnthropic(prompt, systemPrompt, history, anthropicKey, temperature, maxTokens);
      } catch (err: any) {
        console.warn('[LLMService] Anthropic API call failed, falling back to offline engine:', err.message);
      }
    }

    return null;
  }

  /**
   * Gemini REST API
   */
  private static async callGemini(
    prompt: string,
    systemPrompt: string | undefined,
    history: LLMMessage[],
    apiKey: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const contents = [];

      // History
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        });
      }

      // Current prompt
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const body: any = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      };

      if (systemPrompt) {
        body.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error [${res.status}]: ${errorText.substring(0, 150)}`);
      }

      const json = await res.json() as any;
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No candidate response returned from Gemini API.');
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * OpenAI Chat Completions REST API
   */
  private static async callOpenAI(
    prompt: string,
    systemPrompt: string | undefined,
    history: LLMMessage[],
    apiKey: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      for (const h of history.slice(-6)) {
        messages.push({ role: h.role, content: h.content });
      }

      messages.push({ role: 'user', content: prompt });

      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenAI API error [${res.status}]: ${errorText.substring(0, 150)}`);
      }

      const json = await res.json() as any;
      const text = json?.choices?.[0]?.message?.content;
      if (!text) throw new Error('No completion returned from OpenAI.');
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Anthropic Messages REST API
   */
  private static async callAnthropic(
    prompt: string,
    systemPrompt: string | undefined,
    history: LLMMessage[],
    apiKey: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const messages: any[] = [];
      for (const h of history.slice(-6)) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      }
      messages.push({ role: 'user', content: prompt });

      const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages,
          max_tokens: maxTokens,
          temperature
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Anthropic API error [${res.status}]: ${errorText.substring(0, 150)}`);
      }

      const json = await res.json() as any;
      const text = json?.content?.[0]?.text;
      if (!text) throw new Error('No text returned from Anthropic.');
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }
}
