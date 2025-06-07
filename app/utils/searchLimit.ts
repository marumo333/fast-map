const SEARCH_LIMIT_KEY = 'daily_search_count';
const SEARCH_LIMIT = 3;

export const checkSearchLimit = (): boolean => {
  const today = new Date().toDateString();
  const storedData = localStorage.getItem(SEARCH_LIMIT_KEY);
  
  if (storedData) {
    const { date, count } = JSON.parse(storedData);
    if (date === today) {
      return count < SEARCH_LIMIT;
    }
  }
  
  return true;
};

export const incrementSearchCount = (): void => {
  const today = new Date().toDateString();
  const storedData = localStorage.getItem(SEARCH_LIMIT_KEY);
  
  if (storedData) {
    const { date, count } = JSON.parse(storedData);
    if (date === today) {
      localStorage.setItem(SEARCH_LIMIT_KEY, JSON.stringify({ date, count: count + 1 }));
    } else {
      localStorage.setItem(SEARCH_LIMIT_KEY, JSON.stringify({ date: today, count: 1 }));
    }
  } else {
    localStorage.setItem(SEARCH_LIMIT_KEY, JSON.stringify({ date: today, count: 1 }));
  }
};

export const getRemainingSearches = (): number => {
  const today = new Date().toDateString();
  const storedData = localStorage.getItem(SEARCH_LIMIT_KEY);
  
  if (storedData) {
    const { date, count } = JSON.parse(storedData);
    if (date === today) {
      return Math.max(0, SEARCH_LIMIT - count);
    }
  }
  
  return SEARCH_LIMIT;
}; 