import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ encoding: 'utf-8' });

class Config {
  private config: Record<string, string> = {};

  constructor() {
    const requiredKeys = ['COOKIES', 'SEED', 'HASH', 'API_KEY'];
    const missingKeys: string[] = [];

    for (const key of requiredKeys) {
      const value = process.env[key]?.trim() || '';
      if (!value) {
        missingKeys.push(key);
      }
      this.config[key.toLowerCase()] = value;
    }

    if (missingKeys.length > 0) {
      console.error(`Missing required environment variables: ${missingKeys.join(', ')}`);
      console.error('Create .env file based on .env.example and fill all fields');
      process.exit(1);
    }

    console.info('Configuration loaded successfully');
  }

  public getConfig(): Record<string, string> {
    return { ...this.config };
  }

  public get(key: string, defaultVal: string = ''): string {
    return this.config[key] || defaultVal;
  }
}

export default Config;