import React from 'react';

interface ItemSelectionButtonProps {
  onClick: () => void;
  className?: string;
}

const ItemSelectionButton: React.FC<ItemSelectionButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 ${className}`}
      aria-label="アイテムを追加"
    >
      <div className="relative w-24 h-24 mb-2">
        {/* 香水ボトルの形をした枠 */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 120 120" 
          className="w-full h-full"
          fill="none"
          stroke="#dddddd"
          strokeWidth="3"
        >
          {/* 香水ボトルの形状 */}
          <path d="M45,20 h30 v15 h15 v20 h-60 v-20 h15 z" />
          <rect x="30" y="55" width="60" height="50" rx="4" />
          
          {/* 噴射ノズル部分 */}
          <circle cx="60" cy="35" r="5" fill="#dddddd" />
        </svg>
        
        {/* プラス記号 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 100 100" 
            className="w-full h-full"
          >
            <circle cx="50" cy="50" r="40" fill="none" stroke="#cccccc" strokeWidth="5" />
            <line x1="30" y1="50" x2="70" y2="50" stroke="#cccccc" strokeWidth="5" strokeLinecap="round" />
            <line x1="50" y1="30" x2="50" y2="70" stroke="#cccccc" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <p className="text-gray-500 text-sm">オプションを追加する</p>
    </button>
  );
};

export default ItemSelectionButton;