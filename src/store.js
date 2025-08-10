const DEFAULT_STATE = {
  posts: [],
  messages: [],
  events: [],
  profile: {},
};

// Basic localStorage-backed adapter.
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
let storage = {
  load: () => {
    if (!isBrowser) return {};
    try {
      return JSON.parse(window.localStorage.getItem('timtalk-store') || '{}');
    } catch {
      return {};
    }
  },
  save: (data) => {
    if (!isBrowser) return;
    window.localStorage.setItem('timtalk-store', JSON.stringify(data));
  },
};

let state = { ...DEFAULT_STATE, ...storage.load() };
const subscribers = {};

function notify(key) {
  if (!subscribers[key]) return;
  for (const fn of subscribers[key]) fn(state[key]);
}

export function get(key) {
  return state[key];
}

export function set(key, value) {
  state[key] = value;
  storage.save(state);
  notify(key);
}

export function update(key, updater) {
  const value = typeof updater === 'function' ? updater(state[key]) : updater;
  set(key, value);
}

export function subscribe(key, fn) {
  subscribers[key] ||= new Set();
  subscribers[key].add(fn);
  return () => subscribers[key].delete(fn);
}

export function setStorageAdapter(adapter) {
  storage = adapter;
  state = { ...DEFAULT_STATE, ...storage.load() };
}
