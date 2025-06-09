import { useCookies } from 'react-cookie';

const MAX_SEARCHES_PER_DAY = 3;

export function useSearchLimit() {
  // 検索回数のカウントをlocalStorageで管理
  const getTodayKey = () => {
    const today = new Date();
    return `searchCount_${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
  };

  const checkSearchLimit = () => {
    const key = getTodayKey();
    const count = Number(localStorage.getItem(key) || '0');
    return count < MAX_SEARCHES_PER_DAY;
  };

  const incrementSearchCount = () => {
    const key = getTodayKey();
    const count = Number(localStorage.getItem(key) || '0');
    localStorage.setItem(key, String(count + 1));
  };

  const getRemainingSearches = () => {
    const key = getTodayKey();
    const count = Number(localStorage.getItem(key) || '0');
    return Math.max(0, MAX_SEARCHES_PER_DAY - count);
  };

  return { checkSearchLimit, incrementSearchCount, getRemainingSearches };
} 