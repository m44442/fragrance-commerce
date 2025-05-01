"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, PlusCircle } from "lucide-react";
import Image from "next/image";

const SubscriptionCalendarPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [isItemSelectionModalOpen, setIsItemSelectionModalOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(-1);

  // サブスクリプション情報を取得
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/subscription`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/subscription");
            return;
          }
          throw new Error("サブスクリプション情報の取得に失敗しました");
        }

        const data = await response.json();
        setSubscription(data);
        
        // 次回のお届け日が設定されている場合は選択状態にする
        if (data.nextDeliveryDate) {
          console.log("次回配送日があります:", data.nextDeliveryDate);
          setSelectedDate(new Date(data.nextDeliveryDate));
          setShowItemSelection(true);
        }

        // アイテム数に応じてダミーの選択アイテムを作成
        const dummyItems = [];
        for (let i = 0; i < data.itemCount; i++) {
          dummyItems.push(null);
        }
        setSelectedItems(dummyItems);

        // ダミーのアイテム一覧を作成（実際の実装では、APIからお勧めアイテムを取得）
        setAvailableItems([
          { id: '1', name: 'フレッシュシトラス', brand: 'Rumini', imageUrl: '/images/dummy-fragrance-1.jpg' },
          { id: '2', name: 'ラベンダーブリーズ', brand: 'Rumini', imageUrl: '/images/dummy-fragrance-2.jpg' },
          { id: '3', name: 'ウッディアンバー', brand: 'Rumini', imageUrl: '/images/dummy-fragrance-3.jpg' },
          { id: '4', name: 'フローラルブーケ', brand: 'Rumini', imageUrl: '/images/dummy-fragrance-4.jpg' },
          { id: '5', name: 'スパイシーオリエンタル', brand: 'Rumini', imageUrl: '/images/dummy-fragrance-5.jpg' },
        ]);

      } catch (err) {
        console.error("Error fetching subscription:", err);
        setError("サブスクリプション情報の取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchSubscription();
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/subscription/calendar");
    }
  }, [session, status, router]);

  // 月を変更する関数
  const changeMonth = (amount: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + amount);
    setCurrentMonth(newMonth);
  };

  // 配送日を更新する関数
  const updateDeliveryDate = async () => {
    if (!session?.user?.id || !subscription || !selectedDate) return;
    
    setIsUpdating(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${session.user.id}/subscription/update-delivery-date`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryDate: selectedDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("配送日の更新に失敗しました");
      }

      const data = await response.json();
      setSubscription(data);
      setSuccessMessage("配送日を更新しました");
      
      // アイテム選択を表示
      setShowItemSelection(true);
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error updating delivery date:", err);
      setError(err.message || "配送日の更新中にエラーが発生しました");
      
      // 3秒後にエラーメッセージを消す
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  // 月のカレンダーを生成する関数
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 月の初日と最終日
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 月の初日の曜日（0: 日曜日, 6: 土曜日）
    const firstDayOfWeek = firstDay.getDay();
    
    // カレンダーの日付を格納する配列
    const calendarDays = [];
    
    // 前月の日を追加
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, 0 - (firstDayOfWeek - i - 1));
      calendarDays.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        isSelectable: false
      });
    }
    
    // 当月の日を追加
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      
      // 今日以降の日付のみ選択可能とする
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const isSelectable = currentDate >= today;
      
      calendarDays.push({
        date: currentDate,
        isCurrentMonth: true,
        isSelectable
      });
    }
    
    // 翌月の日を追加（6行×7日=42日になるまで）
    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      calendarDays.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        isSelectable: false
      });
    }
    
    // 7日ごとに区切って2次元配列にする
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    
    return weeks;
  };

  // 曜日の配列
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  // 日付が選択されているかチェック
  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const handleDateClick = (day: any) => {
    if (!day.isSelectable) return;
    
    // すでに選択されている日付をクリックした場合は選択を解除
    if (isDateSelected(day.date)) {
      setSelectedDate(null);
      // アイテム選択部分を非表示にする
      setShowItemSelection(false);
    } else {
      setSelectedDate(day.date);
      console.log("showItemSelectionをtrueに設定");
      // アイテム選択部分を表示する
      setShowItemSelection(true);
    }
  };

  // アイテム選択モーダルを開く
  const openItemSelectionModal = (index: number) => {
    setCurrentItemIndex(index);
    setIsItemSelectionModalOpen(true);
  };

  // アイテムを選択する関数
  const handleSelectItem = (item: any) => {
    if (currentItemIndex !== -1) {
      const newItems = [...selectedItems];
      newItems[currentItemIndex] = item;
      setSelectedItems(newItems);
      setIsItemSelectionModalOpen(false);
    }
  };

  // アイテムの設定を保存する関数
  const saveItemSelection = async () => {
    setIsUpdating(true);
    setError(null);
    
    try {
      // この部分は実際のAPIエンドポイントに合わせて実装
      // ここではダミー実装として、3秒後に成功したとする
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage("お届けアイテムを設定しました。次回の配送をお楽しみに！");
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // 設定が完了したらサブスクリプションページに戻る
      setTimeout(() => {
        router.push("/profile/subscription");
      }, 3000);
    } catch (err) {
      console.error("Error saving item selection:", err);
      setError("アイテム選択の保存中にエラーが発生しました");
      
      // 3秒後にエラーメッセージを消す
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">次回配送カレンダー</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="mb-4">サブスクリプションが見つかりません。</p>
          <Link
            href="/subscription"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            サブスクリプションに登録する
          </Link>
        </div>
      </div>
    );
  }

  const calendar = generateCalendar();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Calendar className="w-6 h-6 mr-2" />
        次回配送カレンダー
      </h1>
      
      {/* 成功メッセージ */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

          {/* 次回のご注文 */}
    <div className="bg-white border rounded-lg p-6 mb-8 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">次回のご注文</h2>
        <div className="text-sm text-gray-500">
          {selectedDate ? `変更: ${selectedDate.getMonth() + 1}/${selectedDate.getDate()}(${weekdays[selectedDate.getDay()]})まで` : ''}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-start gap-4 mb-4">
        {/* 配送日 */}
        <div className="bg-gray-50 p-4 rounded-lg w-full md:w-1/2">
          <h3 className="text-base font-medium mb-2">配送日</h3>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-600 mr-2" />
            {selectedDate ? (
              <p className="font-medium">{selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日({weekdays[selectedDate.getDay()]})</p>
            ) : (
              <p className="text-gray-500">配送日を選択してください</p>
            )}
          </div>
        </div>
        
        {/* プラン情報 */}
        <div className="bg-gray-50 p-4 rounded-lg w-full md:w-1/2">
          <h3 className="text-base font-medium mb-2">プラン情報</h3>
          <p>{subscription.planName}</p>
          <p className="text-sm text-gray-600">※ 注文から3営業日以内に発送予定</p>
        </div>
      </div>
    
      {/* 日付を選択した場合のみアイテム選択を表示 */}
      {selectedDate && subscription && subscription.itemCount > 0 && (
        <>
          {/* アイテム選択ボタン */}
          <div className="mt-6 mb-4 border-2 border-red-500 p-4 flex flex-col items-center"> {/* 一時的に境界を目立たせる */}
                <h3 className="text-base font-medium mb-2 text-center w-full">お届けアイテム</h3>
            
            <div className="w-full flex flex-wrap justify-center gap-6">
              {Array.from({length: subscription.itemCount || 1}).map((_, index) => {
                const selectedItem = selectedItems[index];
                
                return (
                  <div 
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden w-full max-w-xs mx-auto"
                  >
                    {selectedItem ? (
                      <div className="p-3">
                        <div className="h-36 relative rounded-lg overflow-hidden mb-2 w-full">
                          {selectedItem.imageUrl ? (
                            <img 
                              src={selectedItem.imageUrl} 
                              alt={selectedItem.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-sm">{selectedItem.name}</p>
                        <p className="text-xs text-gray-500">{selectedItem.brand}</p>
                        
                        <button
                          onClick={() => openItemSelectionModal(index)}
                          className="w-full mt-2 py-1 px-2 text-sm text-purple-600 border border-purple-600 rounded hover:bg-purple-50"
                        >
                          変更する
                        </button>
                      </div>
                    ) : (
                        <button
                        onClick={() => openItemSelectionModal(index)}
                        className="w-full h-48 flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 relative"
                      >
                        {/* 画像を相対サイズから固定サイズに変更 */}
                        <div className="flex justify-center items-center mb-2">
                          <div className="w-28 h-28 relative">
                            <Image 
                              src="/S__35864588.jpg" 
                              alt="新しい香水を追加" 
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-contain object-center rounded-md"
                            />
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">アイテムを追加する</p>
                      </button>
                    )}
                  </div>
                );
              })}         
            </div>
            <p className="text-sm text-gray-500 mt-6 text-center w-full">
              アイテムを追加せずに更新日を迎えると、前回と同じアイテムをお届けします。
            </p>
          </div>
        </>
      )}
    
      {/* 操作ボタン */}
      <div className="flex justify-between mt-6">
        {!selectedDate ? (
          <div className="bg-yellow-50 p-4 rounded-lg w-full text-center">
            <p className="text-yellow-700">カレンダーから配送希望日を選択してください</p>
          </div>
        ) : (
          <>
            <button
              onClick={() => router.push("/profile/subscription")}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            
            <button
              onClick={saveItemSelection}
              disabled={isUpdating}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isUpdating ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  保存中...
                </span>
              ) : (
                '配送設定を保存'
              )}
            </button>
          </>
        )}
      </div>
    </div>

      {/* カレンダー部分 */}
      <div className="bg-white border rounded-lg p-6 mb-8 shadow-sm">
        {/* 年月表示と前月/次月ボタン */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => changeMonth(-1)} 
            className="p-2 rounded hover:bg-gray-100"
            aria-label="前月"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </h2>
          
          <button 
            onClick={() => changeMonth(1)} 
            className="p-2 rounded hover:bg-gray-100"
            aria-label="次月"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((day, index) => (
            <div 
              key={index} 
              className={`text-center py-2 font-medium ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : ''
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* カレンダー本体 */}
        <div className="mb-4">
          {calendar.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`
                    py-4 px-1 text-center rounded-md cursor-pointer relative
                    ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                    ${!day.isSelectable ? 'cursor-not-allowed' : 'hover:bg-gray-100'}
                    ${isDateSelected(day.date) ? 'bg-purple-100 text-purple-800' : ''}
                    ${day.date.getDay() === 0 ? 'text-red-500' : ''}
                    ${day.date.getDay() === 6 ? 'text-blue-500' : ''}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  {day.date.getDate()}
                  {day.isCurrentMonth && day.isSelectable && isDateSelected(day.date) && (
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* アイテム選択モーダル */}
      {isItemSelectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">アイテムを選択</h2>
                <button 
                  onClick={() => setIsItemSelectionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {availableItems.map(item => (
                <div 
                  key={item.id}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSelectItem(item)}
                >
                  <div className="h-32 relative rounded-lg overflow-hidden mb-2">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.brand}</p>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t">
              <button
                onClick={() => setIsItemSelectionModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCalendarPage;