import { useCookies } from 'react-cookie';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { incrementSearchCount, resetSearchCount } from '../store/authSlice';

const MAX_SEARCHES_PER_DAY = 3;

export const useSearchLimit = () => {
  const [cookies, setCookie] = useCookies(['lastSearchDate']);
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const checkAndUpdateSearchCount = () => {
    if (!user) return false;

    const today = new Date().toDateString();
    const lastSearchDate = cookies.lastSearchDate;

    // 日付が変わった場合は検索回数をリセット
    if (lastSearchDate !== today) {
      dispatch(resetSearchCount());
      setCookie('lastSearchDate', today, { path: '/' });
    }

    // 検索回数が上限に達している場合はfalseを返す
    if (user.searchCount >= MAX_SEARCHES_PER_DAY) {
      return false;
    }

    // 検索回数をインクリメント
    dispatch(incrementSearchCount());
    return true;
  };

  const getRemainingSearches = () => {
    if (!user) return 0;
    return Math.max(0, MAX_SEARCHES_PER_DAY - user.searchCount);
  };

  return {
    canSearch: checkAndUpdateSearchCount,
    remainingSearches: getRemainingSearches(),
  };
}; 