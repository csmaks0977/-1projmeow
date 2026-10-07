"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: number;
  title: string;
  price: number;
  category: string;
  contact: string;
  is_sold: boolean;
  created_at: string;
};

type FormData = {
  title: string;
  price: string;
  category: string;
  contact: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const CATEGORIES = ["Учеба", "Электроника", "Одежда", "Спорт", "Другое"];

const EMPTY_FORM: FormData = { title: "", price: "", category: "", contact: "" };

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.title.trim()) {
    errors.title = "Название обязательно";
  }

  const priceNum = Number(data.price);
  if (data.price === "" || isNaN(priceNum)) {
    errors.price = "Укажите цену числом";
  } else if (priceNum < 0) {
    errors.price = "Цена не может быть отрицательной";
  } else if (priceNum > 1_000_000) {
    errors.price = "Цена не может превышать 1 000 000 ₸";
  }

  if (!data.category) {
    errors.category = "Выберите категорию";
  }

  if (!data.contact.trim()) {
    errors.contact = "Укажите ник в Telegram";
  }

  return errors;
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ID карточек, на которых нажата кнопка "Продано" (для блокировки повторного нажатия)
  const [soldLoading, setSoldLoading] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setLoading(true);
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setFetchError(error.message);
    } else {
      setListings(data || []);
    }
    setLoading(false);
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Убираем ошибку поля при изменении
    if (formErrors[name as keyof FormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const { data, error } = await supabase
      .from("listings")
      .insert({
        title: form.title.trim(),
        price: Number(form.price),
        category: form.category,
        contact: form.contact.trim(),
      })
      .select()
      .single();

    if (error) {
      setSubmitError("Не удалось сохранить объявление. Попробуйте ещё раз.");
      setSubmitting(false);
      return;
    }

    // Добавляем новую карточку в начало списка без перезагрузки
    setListings((prev) => [data, ...prev]);
    setSubmitting(false);
    closeModal();
  }

  async function handleMarkSold(id: number) {
    setSoldLoading((prev) => new Set(prev).add(id));

    const { error } = await supabase
      .from("listings")
      .update({ is_sold: true })
      .eq("id", id);

    if (!error) {
      // Обновляем карточку локально
      setListings((prev) =>
        prev.map((ad) => (ad.id === id ? { ...ad, is_sold: true } : ad))
      );
    }

    setSoldLoading((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Барахолка <span className="text-green-600">Колледжа</span>
          </h1>
          <button
            onClick={openModal}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            + Добавить объявление
          </button>
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-400 text-lg animate-pulse">
              Загрузка объявлений...
            </div>
          </div>
        )}

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Ошибка подключения к базе данных:</strong> {fetchError}
          </div>
        )}

        {!loading && !fetchError && listings.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            Объявлений пока нет. Будьте первым!
          </div>
        )}

        {!loading && !fetchError && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((ad) => (
              <div
                key={ad.id}
                className={`relative bg-white p-5 rounded-xl shadow-sm border flex flex-col transition-all duration-300 ${
                  ad.is_sold
                    ? "border-gray-200 opacity-50 grayscale"
                    : "border-gray-100 hover:shadow-md"
                }`}
              >
                {/* Бейдж "Продано" */}
                {ad.is_sold && (
                  <span className="absolute top-3 right-3 bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded-md">
                    Продано
                  </span>
                )}

                <div className="mb-2">
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md mb-2">
                    {ad.category}
                  </span>
                  <h2 className="text-lg font-semibold text-gray-800 leading-tight pr-16">
                    {ad.title}
                  </h2>
                </div>

                <p className="text-xl font-bold text-green-600 my-2">
                  {ad.price.toLocaleString("ru-RU")} ₸
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
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

                  {/* Кнопка "Продано" */}
                  {!ad.is_sold && (
                    <button
                      onClick={() => handleMarkSold(ad.id)}
                      disabled={soldLoading.has(ad.id)}
                      className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 rounded-md px-2 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {soldLoading.has(ad.id) ? "..." : "Продано"}
                    </button>
                  )}
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
              <h3 className="text-xl font-bold text-gray-800">
                Новое объявление
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              {/* Общая ошибка сервера */}
              {submitError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                {/* Название */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Например: Учебник по истории"
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                      formErrors.title
                        ? "border-red-400 focus:ring-2 focus:ring-red-300"
                        : "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    }`}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>
                  )}
                </div>

                {/* Цена */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена (₸)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    max="1000000"
                    placeholder="0"
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                      formErrors.price
                        ? "border-red-400 focus:ring-2 focus:ring-red-300"
                        : "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    }`}
                  />
                  {formErrors.price && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>
                  )}
                </div>

                {/* Категория */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all bg-white ${
                      formErrors.category
                        ? "border-red-400 focus:ring-2 focus:ring-red-300"
                        : "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    }`}
                  >
                    <option value="">Выберите категорию...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>
                  )}
                </div>

                {/* Telegram */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ник в Telegram
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={form.contact}
                    onChange={handleChange}
                    placeholder="@username"
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                      formErrors.contact
                        ? "border-red-400 focus:ring-2 focus:ring-red-300"
                        : "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    }`}
                  />
                  {formErrors.contact && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.contact}</p>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Сохраняем..." : "Добавить"}
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
