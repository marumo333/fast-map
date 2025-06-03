  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        {isSearching && (
          <div className="flex items-center space-x-2">
            <div className="flex-grow">
              <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="出発地を入力"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearchStartLocation}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              検索
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <div className="flex-grow">
            <input
              type="text"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              placeholder="目的地を入力"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearchEndLocation}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            検索
          </button>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setIsSearching(!isSearching)}
          className="px-4 py-2 text-blue-500 hover:text-blue-600 transition-colors"
        >
          {isSearching ? '現在地を使用' : '出発地を検索'}
        </button>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          ルート検索
        </button>
      </div>
    </div>
  ); 