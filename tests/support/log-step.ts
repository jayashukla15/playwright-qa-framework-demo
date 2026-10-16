import { test } from '../../src/fixtures/test.js';

export async function logStep<T>(title: string, action: () => Promise<T>): Promise<T> {
  return test.step(title, async () => {
    console.info(`[STEP START] ${title}`);

    try {
      const result = await action();
      console.info(`[STEP PASS] ${title}`);
      return result;
    } catch (error) {
      console.error(`[STEP FAIL] ${title}`, error);
      throw error;
    }
  });
}