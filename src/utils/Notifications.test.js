import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { sendNotification } from './Notifications.js';
import { auth } from '../firebase.js';

describe('sendNotification', () => {
  let originalFetch;
  let originalCurrentUser;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalCurrentUser = auth.currentUser;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    auth.currentUser = originalCurrentUser;
    vi.restoreAllMocks();
  });

  it('returns error when userId is missing', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const res = await sendNotification(null, { title: 't', body: 'b' });

    expect(res).toEqual({ success: false, error: 'Invalid user ID' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns error when no authenticated user', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    auth.currentUser = null;

    const res = await sendNotification('123', { title: 't', body: 'b' });

    expect(res).toEqual({ success: false, error: 'Not authenticated' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns success when notification dispatched', async () => {
    auth.currentUser = {
      getIdToken: vi.fn(() => Promise.resolve('token'))
    };

    const fetchMock = vi.fn(async (url) => {
      if (url.includes('checkUser')) {
        return {
          ok: true,
          json: async () => ({ exists: true })
        };
      }
      if (url.includes('simpleNotification')) {
        return {
          ok: true,
          json: async () => ({ success: true })
        };
      }
      return {
        ok: false,
        text: async () => 'not found'
      };
    });

    global.fetch = fetchMock;

    const res = await sendNotification('123', { title: 't', body: 'b' });

    expect(res).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

