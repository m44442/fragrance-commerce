"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SubscriptionCalendarPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
          setSelectedDate(new Date(data.nextDeliveryDate));
        }
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
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}/subscription/update-delivery-date`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryDate: selectedDate,
        }),
      });

      if (!response.ok) {
        throw new Error("配送日の更新に失敗しました");
      }

      const data = await response.json();
      setSubscription(data);
      setSuccessMessage("配送日を更新しました");
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error updating delivery date:", err);
      setError("配送日の更新中にエラーが発生しました");
      
      // 3秒後にエラーメッセージを消す
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
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

  // 日付をクリックしたときの処理
  const handleDateClick = (day: any) => {
    if (!day.isSelectable) return;
    
    // すでに選択されている日付をクリックした場合は選択を解除
    if (isDateSelected(day.date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day.date);
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
        <h1 className="text-2xl font-bold mb-6">配送カレンダー</h1>
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
      <h1 className="text-2xl font-bold mb-6">配送カレンダー</h1>
      
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

      <div className="bg-white border rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => changeMonth(-1)} 
            className="p-2 rounded hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </h2>
          
          <button 
            onClick={() => changeMonth(1)} 
            className="p-2 rounded hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
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
          
          {calendar.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`
                    py-2 px-1 text-center rounded-md cursor-pointer relative
                    ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                    ${!day.isSelectable ? 'cursor-not-allowed' : 'hover:bg-gray-100'}
                    ${isDateSelected(day.date) ? 'bg-purple-100 text-purple-800' : ''}
                    ${day.date.getDay() === 0 ? 'text-red-500' : ''}
                    ${day.date.getDay() === 6 ? 'text-blue-500' : ''}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  {day.date.getDate()}
                  {day.isCurrentMonth && day.isSelectable && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                      {isDateSelected(day.date) && (
                        <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <div>
          <p className="mb-4 text-gray-600">
            {selectedDate ? (
              <>
                選択中: {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
              </>
            ) : (
              <>お届け希望日を選択してください</>
            )}
          </p>
          
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/subscription/setting')}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
            >
              キャンセル
            </button>
            
            <button
              onClick={updateDeliveryDate}
              disabled={!selectedDate || isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? "更新中..." : "お届け日を設定"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCalendarPage;