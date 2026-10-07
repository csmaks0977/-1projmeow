"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Тип данных из таблицы Supabase
type Listing = {
  id: number;
  title: string;
  price: number;
  category: string;
  contact: string;
  is_sold: boolean;
  created_at: string;
};

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchListings() {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setListings(data || []);
      }
      setLoading(false);
    }

    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Барахолка <span className="text-green-600">Колледжа</span>
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            + Добавить объявление
          </button>
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* Состояние загрузки */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-400 text-lg animate-pulse">Загрузка объявлений...</div>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Ошибка подключения к базе данных:</strong> {error}
          </div>
        )}

        {/* Пустой список */}
        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            Объявлений пока нет. Будьте первым!
          </div>
        )}

        {/* Сетка карточек */}
        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((ad) => (
              <div
                key={ad.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                <div className="mb-2">
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md mb-2">
                    {ad.category}
                  </span>
                  <h2 className="text-lg font-semibold text-gray-800 leading-tight">
                    {ad.title}
                  </h2>
                </div>
                <p className="text-xl font-bold text-green-600 my-2">
                  {ad.price.toLocaleString("ru-RU")} ₸
                </p>
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Telegram:{" "}
                    <a
                      href={`https://t.me/${ad.contact.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline font-medium"
                    >
                      {ad.contact}
                    </a>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Новое объявление</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsModalOpen(false);
                }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Учебник по истории"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена (₸)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                  >
                    <option value="">Выберите категорию...</option>
                    <option value="Учеба">Учеба</option>
                    <option value="Электроника">Электроника</option>
                    <option value="Одежда">Одежда</option>
                    <option value="Спорт">Спорт</option>
                    <option value="Другое">Другое</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ник в Telegram
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
