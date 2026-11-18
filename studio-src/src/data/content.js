// ВСЕ редактируемые тексты и цены — здесь. 3D-логику трогать не нужно.

export const BRAND = {
  name: 'VOLNA film',
  siteUrl: '../index.html', // ссылка «на основной сайт»
  // Куда отправлять заявку. Если пусто — заявка копируется в буфер и открывается Telegram.
  telegram: 'https://t.me/Egmarch',
  phone: '+7 923 177-52-51',
  phoneHref: 'tel:+79231775251',
}

// Видео: embed — ссылка для iframe (Kinescope / VK Видео / YouTube). Пустая строка = заглушка.
// YouTube: https://www.youtube.com/embed/ID   VK: https://vk.com/video_ext.php?oid=..&id=..&hd=2
// Kinescope: https://kinescope.io/embed/ID
export const CINEMA_CATEGORIES = [
  {
    id: 'ads', title: 'Реклама', videos: [
      { title: 'Рекламный ролик — пример 1', desc: 'Коммерческая реклама с 3D и VFX', embed: '' },
      { title: 'Рекламный ролик — пример 2', desc: 'Динамичный монтаж, цветокоррекция', embed: '' },
    ],
  },
  {
    id: 'corp', title: 'Корпоративное кино', videos: [
      { title: 'Фильм о производстве', desc: 'Имиджевый фильм для завода', embed: '' },
      { title: 'Фильм о компании', desc: 'Интервью, процессы, аэросъёмка', embed: '' },
    ],
  },
  {
    id: 'realty', title: 'Недвижимость', videos: [
      { title: 'Жилой комплекс', desc: 'Презентационный ролик для застройщика', embed: '' },
      { title: 'Дрон-обзор квартала', desc: 'Аэросъёмка и 3D-графика', embed: '' },
    ],
  },
  {
    id: 'clips', title: 'Клипы', videos: [
      { title: 'Музыкальный клип', desc: 'Постановочная съёмка, свет, цвет', embed: '' },
    ],
  },
]

// Подкаст-студия: цены синхронизированы с основным сайтом.
export const PODCAST = {
  title: 'Подкаст-студия',
  lead: 'Запишем разговор на оборудованной студии: три камеры, свет, звук и команда. Вы приходите — мы делаем всё остальное.',
  from: '20 000 ₽',
  fromNote: '1,5 часа записи с подготовкой и завершением + экспресс-монтаж',
  tiers: [
    { label: '1,5 часа · экспресс-монтаж', price: '20 000 ₽' },
    { label: '2 часа исходника', price: '40 000 ₽' },
    { label: '3 часа исходника', price: '55 000 ₽' },
  ],
  features: [
    'Студия, 3 камеры, свет и звук',
    'Команда на съёмке — 2 специалиста',
    'Подготовка студии и завершение входят в 1,5 часа',
    'Экспресс-монтаж; в пакетах 2–3 часа — мультикам-монтаж и цветокоррекция',
  ],
  // ссылка на пример выпуска (embed). Пустая строка — блок не показывается.
  embed: '',
}

// Калькулятор сметы. Цены в рублях за единицу; итоговая вилка = сумма × [lo, hi].
export const ESTIMATE = {
  types: [
    { id: 'image', label: 'Имиджевый', base: 60000, perShift: 55000 },
    { id: 'ad', label: 'Рекламный', base: 80000, perShift: 70000 },
    { id: 'developer', label: 'Для застройщиков', base: 70000, perShift: 60000 },
    { id: 'youtube', label: 'YouTube-шоу', base: 30000, perShift: 35000 },
    { id: 'podcast', label: 'Подкаст (запись 1,5 ч)', base: 0, perShift: 20000 },
  ],
  shifts: { min: 1, max: 5 },
  options: [
    { id: 'aerial', label: 'Аэросъёмка / FPV-дрон', price: 30000, perShift: true },
    { id: 'light', label: 'Свет и доп. техника', price: 20000, perShift: true },
    { id: 'sound', label: 'Саунд-дизайн и цветокоррекция', price: 35000, perShift: false },
    { id: 'vfx', label: '3D-графика / VFX', price: 60000, perShift: false },
  ],
  range: [0.9, 1.25],
  disclaimer: 'Это ориентировочная вилка. Точную смету подготовит продюсер после брифа.',
}
