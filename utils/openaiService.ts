
import AsyncStorage from '@react-native-async-storage/async-storage';

const OPENAI_API_KEY_STORAGE = '@openai_api_key';
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface ChatCompletionParams {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ImageAnalysisParams {
  imageUri: string;
  prompt: string;
  model?: string;
}

class OpenAIService {
  private async getApiKey(): Promise<string | null> {
    try {
      const apiKey = await AsyncStorage.getItem(OPENAI_API_KEY_STORAGE);
      return apiKey;
    } catch (error) {
      console.error('Failed to get API key:', error);
      return null;
    }
  }

  async chatCompletion(params: ChatCompletionParams): Promise<string | null> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add it in Settings.');
    }

    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model || 'gpt-4o-mini',
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.max_tokens || 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error('Chat completion error:', error);
      throw error;
    }
  }

  async analyzeImage(params: ImageAnalysisParams): Promise<string | null> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add it in Settings.');
    }

    try {
      // Convert image to base64
      const base64Image = await this.imageToBase64(params.imageUri);
      
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model || 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: params.prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  }

  private async imageToBase64(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove the data:image/...;base64, prefix
          const base64 = base64data.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image to base64 conversion error:', error);
      throw error;
    }
  }

  async diagnosePlant(symptoms: string): Promise<string | null> {
    const systemPrompt = `You are an expert agricultural consultant specializing in plant health and disease diagnosis. 
Provide detailed, practical advice for small farms and homesteads. 
Format your response with clear sections: Diagnosis, Symptoms, Recommended Actions, and Prevention.`;

    return this.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `I'm experiencing the following plant issues: ${symptoms}. Please help diagnose the problem and provide solutions.` },
      ],
    });
  }

  async diagnosePlantFromImage(imageUri: string): Promise<string | null> {
    const prompt = `Analyze this plant image and identify any health issues, diseases, or pest problems. 
Provide a detailed diagnosis including:
1. What you observe in the image
2. Likely diagnosis
3. Recommended treatment actions
4. Prevention strategies
Format the response clearly with sections.`;

    return this.analyzeImage({ imageUri, prompt });
  }

  async generatePlantingWindows(crop: string, region: string): Promise<string | null> {
    const systemPrompt = `You are an expert agricultural planner specializing in crop timing and revenue optimization for small farms.
Provide detailed planting schedules with specific dates, succession planting strategies, and revenue optimization tips.`;

    return this.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Create an optimal planting schedule for ${crop} in ${region}. Include spring, summer, and fall planting windows, succession planting recommendations, and tips to maximize efficiency and revenue.` 
        },
      ],
    });
  }

  async answerFarmQuestion(question: string, conversationHistory?: ChatMessage[]): Promise<string | null> {
    const systemPrompt = `You are a knowledgeable farming advisor with expertise in small-scale agriculture, homesteading, and sustainable farming practices.
Provide practical, actionable advice tailored to small farms (100 acres or less) and homesteads.
Be specific, helpful, and consider both organic and conventional methods.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: question },
    ];

    return this.chatCompletion({ messages });
  }

  async generateMarketPrices(crops: string, location: string): Promise<string | null> {
    const systemPrompt = `You are a market analyst specializing in agricultural pricing and sales strategies for small farms.
Provide realistic market prices, pricing strategies, and revenue optimization tips.
Consider different sales channels: farmers markets, CSA, restaurants, and roadside stands.`;

    return this.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Generate a market price list for these crops: ${crops} in ${location}. Include pricing for different sales channels, seasonal adjustments, and revenue optimization strategies.` 
        },
      ],
    });
  }

  async generateHarvestPlan(plantingData: string, goals?: string): Promise<string | null> {
    const systemPrompt = `You are an expert farm operations planner specializing in harvest scheduling and logistics for small farms.
Create detailed, week-by-week harvest plans that optimize labor, storage, and revenue.
Consider crop maturation periods, succession plantings, and market timing.`;

    const userPrompt = goals
      ? `Based on these plantings: ${plantingData}, create an optimized harvest plan. Goals: ${goals}. Include weekly schedules, labor planning, storage needs, and revenue projections.`
      : `Based on these plantings: ${plantingData}, create an optimized harvest plan. Include weekly schedules, labor planning, storage needs, and revenue projections.`;

    return this.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
  }
}

export const openAIService = new OpenAIService();
