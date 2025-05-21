type HeaderProps = {
  onToggleMenu: () => void;
  onGetCurrentLocation: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggleMenu, onGetCurrentLocation }) => {
  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={onGetCurrentLocation}
        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
      >
        現在地を取得
      </button>
      <button
        onClick={onToggleMenu}
        className="text-gray-600 hover:text-gray-900"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
};

export default Header; 