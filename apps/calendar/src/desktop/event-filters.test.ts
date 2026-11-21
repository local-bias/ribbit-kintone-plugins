import { describe, expect, it } from 'vitest';
import {
  type CalendarFilters,
  hasActiveFilters,
  isShownForCategories,
  isShownUnderFilters,
  matchesSearchWords,
} from './event-filters';

const NO_FILTERS: CalendarFilters = { categories: null, assignees: null, searchWords: [] };
const userA = { key: 'a', label: 'A', isUser: true };

describe('isShownForCategories', () => {
  it('shows events of displayed categories and events without a category', () => {
    expect(isShownForCategories({ category: '社内' }, ['社内'])).toBe(true);
    expect(isShownForCategories({ category: '社外' }, ['社内'])).toBe(false);
    expect(isShownForCategories({}, ['社内'])).toBe(true);
    expect(isShownForCategories({ category: '社外' }, null)).toBe(true);
  });
});

describe('matchesSearchWords', () => {
  it('requires every search word to be included', () => {
    expect(matchesSearchWords({ __quickSearch: '定例_$$_会議' }, ['定例', '会議'])).toBe(true);
    expect(matchesSearchWords({ __quickSearch: '定例_$$_会議' }, ['定例', '外出'])).toBe(false);
    expect(matchesSearchWords({ __quickSearch: '' }, ['定例'])).toBe(false);
    expect(matchesSearchWords({}, [])).toBe(true);
  });
});

describe('isShownUnderFilters', () => {
  it('shows an event only when it matches every filter', () => {
    const event = { category: '社内', assignees: [userA], __quickSearch: '定例' };
    expect(isShownUnderFilters(event, NO_FILTERS)).toBe(true);
    expect(
      isShownUnderFilters(event, {
        categories: ['社内'],
        assignees: { mode: 'only', keys: ['a'] },
        searchWords: ['定例'],
      })
    ).toBe(true);
    expect(isShownUnderFilters(event, { ...NO_FILTERS, categories: ['社外'] })).toBe(false);
    expect(
      isShownUnderFilters(event, { ...NO_FILTERS, assignees: { mode: 'hidden', keys: ['a'] } })
    ).toBe(false);
    expect(isShownUnderFilters(event, { ...NO_FILTERS, searchWords: ['外出'] })).toBe(false);
  });
});

describe('hasActiveFilters', () => {
  it('is true when any filter is applied', () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, categories: [] })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, assignees: { mode: 'hidden', keys: ['a'] } })).toBe(
      true
    );
    expect(hasActiveFilters({ ...NO_FILTERS, searchWords: ['a'] })).toBe(true);
  });
});
