import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import { answerConfirmAtom, confirmStateAtom, requestConfirmAtom } from './confirm';

const request = { title: 'title', message: 'message' };

describe('requestConfirmAtom', () => {
  it('resolves with the answer and closes the dialog', async () => {
    const store = createStore();
    const answered = store.set(requestConfirmAtom, request);
    expect(store.get(confirmStateAtom)?.message).toBe('message');

    store.set(answerConfirmAtom, true);

    await expect(answered).resolves.toBe(true);
    expect(store.get(confirmStateAtom)).toBeNull();
  });

  it('cancels the previous request when a new one is opened', async () => {
    const store = createStore();
    const first = store.set(requestConfirmAtom, request);
    const second = store.set(requestConfirmAtom, { ...request, message: 'second' });

    await expect(first).resolves.toBe(false);
    expect(store.get(confirmStateAtom)?.message).toBe('second');

    store.set(answerConfirmAtom, false);
    await expect(second).resolves.toBe(false);
  });
});
