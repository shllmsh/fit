export type Hotspot = {
  label: string;
  rect: [number, number, number, number];
  to?: string;
  href?: string;
  action?: 'home' | 'back';
};

export type Screen = {
  id: string;
  source: number;
  height: number;
  title: string;
  description: string;
  parent: string;
  next?: string;
  hotspots: Hotspot[];
};

const link = (label: string, to: string, rect: Hotspot['rect']): Hotspot => ({ label, to, rect });
const external = (label: string, href: string, rect: Hotspot['rect']): Hotspot => ({ label, href, rect });
const phone = 'tel:+79151818790';
const site = 'https://taftingstudio.ru';
const telegram = 'https://t.me/koversMK';
const instagram = 'https://www.instagram.com/zabeykover?igsh=MX';

export const screens: Screen[] = [
  {
    id: 'home', source: 8, height: 742.5, title: 'Забей ковёр', parent: 'home',
    description: 'Интерактив, который задействует гостей и оставляет после себя настоящий ковёр. Для корпоративов, фестивалей, презентаций, свадеб и других мероприятий.',
    hotspots: [
      link('Выездной интерактив', 'events', [34.4, 532.8, 405.6, 79.1]),
      link('Ковёр для бигбосса', 'boss', [457.2, 532.8, 405.6, 79.1]),
      link('Ковры на заказ', 'custom', [34.4, 629.1, 405.6, 79]),
      link('Мастер-классы в студии', 'workshops', [457.2, 629.1, 405.6, 79]),
      link('О нас', 'about', [1113.1, 567.2, 172.5, 61.9]),
      link('Контакты', 'contacts', [1113.1, 646.2, 172.5, 61.9]),
    ],
  },
  {
    id: 'about', source: 9, height: 742.5, title: 'О нас', parent: 'home',
    description: 'Забей ковёр — студия тафтинга в Москве. Мастер-классы в студии, выездные интерактивы, ковры на заказ и специальные проекты для компаний.',
    hotspots: [
      link('Выездной интерактив', 'shared', [900.6, 350.6, 385, 79.1]),
      link('Ковёр для бигбосса', 'boss', [900.6, 443.4, 385, 79.1]),
      link('Мастер-классы в студии', 'workshops', [900.6, 536.2, 385, 79.1]),
      link('Ковры на заказ', 'custom', [900.6, 629.1, 385, 79]),
    ],
  },
  {
    id: 'events', source: 28, height: 742.5, title: 'Тафтинг-интерактив для вашего мероприятия', parent: 'home',
    description: 'Три формата: большой общий ковёр, мини-коврики для гостей и составной ковёр.',
    hotspots: [
      link('Подробнее: большой общий ковёр', 'shared', [61.9, 608.4, 343.7, 79.1]),
      link('Подробнее: мини-коврики для гостей', 'mini', [488.1, 608.4, 343.8, 79.1]),
      link('Подробнее: составной ковёр', 'composite', [914.4, 608.4, 343.7, 79.1]),
    ],
  },
  {
    id: 'shared', source: 10, height: 742.5, title: 'Один большой общий ковёр', parent: 'events',
    description: 'Гости вместе создают один большой ковёр. Одновременно работают два человека, более 50 участников в час. Любой дизайн: логотип, фирменный стиль или праздничная тематика.',
    hotspots: [
      link('Время изготовления ковра', 'timing', [935, 165, 351, 79]),
      link('Что получает гость', 'guest', [935, 258, 351, 79]),
      link('Что получает компания', 'company', [935, 351, 351, 79]),
      link('Монтаж и оборудование', 'equipment', [935, 443, 351, 79]),
      link('Стоимость', 'event-price', [935, 536, 351, 79]),
      link('Фото', 'shared-gallery-1', [935, 629, 351, 79]),
    ],
  },
  {
    id: 'event-price', source: 11, height: 742.5, title: 'Стоимость выездного интерактива', parent: 'shared',
    description: '1 м² — 104 000 ₽; 1,5 м² — 130 000 ₽; 2 м² — 143 000 ₽; 2,5 м² — 156 000 ₽; 3 м² — 182 000 ₽; 3,5 м² — 205 000 ₽; 4 м² — 221 000 ₽. При оплате по расчётному счёту стоимость увеличивается на 7%.',
    hotspots: [link('Что входит в стоимость', 'turnkey', [909.6, 627, 376, 79.1])],
  },
  {
    id: 'turnkey', source: 12, height: 742.5, title: 'Мы работаем под ключ', parent: 'event-price', next: 'booking',
    description: 'В стоимость входят логистика, монтаж и демонтаж, работа мастеров, все материалы и оборудование и финальная доделка ковра. Москва включена; выезд за МКАД — плюс 7 000 ₽; другие города рассчитываются отдельно.',
    hotspots: [],
  },
  {
    id: 'booking', source: 13, height: 742.5, title: 'Хотите такой интерактив на своём мероприятии?', parent: 'turnkey',
    description: 'Расскажите о мероприятии, подберём формат и размер ковра, согласуем дизайн, приедем и проведём интерактив. Контакт: 8-915-181-87-90.',
    hotspots: [
      external('Позвонить: 8-915-181-87-90', phone, [884, 178, 400, 55]),
      external('Сайт студии', site, [980, 274, 175, 205]),
      external('Telegram студии', telegram, [884, 498, 170, 209]),
      external('Instagram студии', instagram, [1077, 498, 171, 209]),
    ],
  },
  {
    id: 'shared-gallery-1', source: 14, height: 742.5, title: 'Как это выглядит вживую — большой общий ковёр', parent: 'shared', next: 'shared-gallery-2',
    description: 'Фотографии выездных мероприятий: гости создают большой общий ковёр.',
    hotspots: [link('Листайте дальше: следующие фотографии', 'shared-gallery-2', [1100, 260, 200, 95])],
  },
  {
    id: 'shared-gallery-2', source: 15, height: 742.5, title: 'Большой общий ковёр — фотографии, страница 2', parent: 'shared-gallery-1', next: 'shared-gallery-3',
    description: 'Примеры брендированных ковров для OZON, Сбера, VK team и других компаний.',
    hotspots: [link('Листайте дальше: следующие фотографии', 'shared-gallery-3', [1120, 589, 175, 127])],
  },
  {
    id: 'shared-gallery-3', source: 16, height: 742.5, title: 'Большой общий ковёр — фотографии, страница 3', parent: 'shared-gallery-2',
    description: 'Фотографии гостей за работой и готовых общих ковров на мероприятиях.', hotspots: [],
  },
  {
    id: 'guest', source: 17, height: 742.5, title: 'Что получает гость', parent: 'shared',
    description: 'Гость пробует профессиональный тафтинг-пистолет, создаёт часть ковра, получает необычный опыт, становится частью общего результата и получает яркие фотографии и эмоции.', hotspots: [],
  },
  {
    id: 'company', source: 18, height: 742.5, title: 'Что получает компания', parent: 'shared',
    description: 'Необычный интерактив, возможность задействовать большое количество участников и ковёр после мероприятия.', hotspots: [],
  },
  {
    id: 'timing', source: 19, height: 742.5, title: 'Время изготовления ковра', parent: 'shared', next: 'four-hours',
    description: 'Ковёр 1×1 м — около 5 часов; 1,5×1,5 м — около 8 часов; 2×2 м — около 12 часов. Время изготовления не равно времени мероприятия: часть можно подготовить заранее или разделить работу на несколько дней.', hotspots: [],
  },
  {
    id: 'four-hours', source: 20, height: 742.5, title: 'А если у нас только 4 часа?', parent: 'timing', next: 'booking',
    description: 'Можно подготовить часть ковра заранее или позволить гостям создать основную часть, а мастерам закончить после мероприятия.', hotspots: [],
  },
  {
    id: 'equipment', source: 21, height: 742.5, title: 'Монтаж и оборудование', parent: 'shared',
    description: 'Привозим раму, материалы, пряжу, ткань, тафтинг-пистолеты и всё необходимое. Монтаж занимает 1–2 часа; после мероприятия — демонтаж.', hotspots: [],
  },
  {
    id: 'boss', source: 22, height: 742.5, title: 'Подарок для бигбосса всем коллективом', parent: 'home', next: 'boss-result',
    description: 'Сотрудники создают большой ковёр для руководителя. На мероприятии создаётся часть ковра, затем мастера профессионально завершают его в студии.',
    hotspots: [link('Листайте дальше: готовый подарок', 'boss-result', [1040, 610, 250, 110])],
  },
  {
    id: 'boss-result', source: 23, height: 742.5, title: 'Ковёр с историей, которую создали все вместе', parent: 'boss',
    description: 'Совместная работа превращается в масштабный арт-объект и становится подарком руководителю.',
    hotspots: [link('Стоимость', 'boss-price', [975, 629, 311, 79])],
  },
  {
    id: 'boss-price', source: 24, height: 742.5, title: 'Ковёр для бигбосса — стоимость', parent: 'boss-result', next: 'contacts',
    description: 'От 180 000 ₽. Минимальный размер — 1,5×1,5 м. В стоимость входят интерактив для сотрудников и профессиональная доработка в студии.', hotspots: [],
  },
  {
    id: 'contacts', source: 25, height: 742.5, title: 'Контакты', parent: 'home',
    description: 'Студия тафтинга «Забей ковёр». Телефон: 8-915-181-87-90. Сайт, Telegram и Instagram открываются по соответствующим QR-кодам.',
    hotspots: [
      external('Позвонить: 8-915-181-87-90', phone, [37, 337, 580, 76]),
      external('Сайт студии', site, [37, 440, 216, 270]),
      external('Telegram студии', telegram, [283, 440, 216, 270]),
      external('Instagram студии', instagram, [528, 440, 218, 270]),
    ],
  },
  {
    id: 'custom', source: 26, height: 742.5, title: 'Ковры на заказ', parent: 'home', next: 'contacts',
    description: 'От 25 000 ₽ за м². Стоимость зависит от сложности дизайна и размера. Чем сложнее дизайн, тем выше стоимость квадратного метра.', hotspots: [],
  },
  {
    id: 'workshops', source: 27, height: 742.5, title: 'Мастер-классы в студии', parent: 'home', next: 'contacts',
    description: 'Индивидуальный — 7 500 ₽; групповой — 5 300 ₽; детский — 6 500 ₽; тафтинговое зеркало — 5 500 ₽; для двоих «Свидание» — 15 000 ₽. Размеры и условия указаны на экране.', hotspots: [],
  },
  {
    id: 'mini', source: 29, height: 742.5, title: 'Мини-коврики для гостей', parent: 'events',
    description: 'Каждому гостю — свой коврик. До 30 участников за один заход, размер 20×20 см. Можно организовать несколько заходов.',
    hotspots: [
      link('Стоимость', 'event-price', [888.9, 534.9, 396.7, 79]),
      link('Фото', 'mini-gallery', [888.9, 629.1, 396.7, 79]),
    ],
  },
  {
    id: 'mini-gallery', source: 30, height: 742.5, title: 'Как это выглядит вживую — мини-коврик для каждого', parent: 'mini',
    description: 'Фотографии гостей с созданными своими руками мини-ковриками.', hotspots: [],
  },
  {
    id: 'composite', source: 31, height: 742.5, title: 'Составной ковёр', parent: 'events',
    description: 'Один дизайн, несколько команд, один общий ковёр. Картина делится на 6, 9, 12 или 15 частей размером 40×40 или 50×50 см. Каждая группа создаёт свою часть.',
    hotspots: [
      link('Стоимость', 'event-price', [467.5, 629.1, 396.7, 79]),
      link('Фото', 'composite-gallery', [888.9, 629.1, 396.7, 79]),
    ],
  },
  {
    id: 'composite-gallery', source: 32, height: 742.5, title: 'Как это выглядит вживую — составной ковёр', parent: 'composite',
    description: 'Фотографии командной работы над частями общего ковра и готовых составных ковров.', hotspots: [],
  },
];

export const screenById = new Map(screens.map(screen => [screen.id, screen]));

export function hotspotsFor(screen: Screen): Hotspot[] {
  return [
    { label: 'Главная', action: 'home', rect: [999.6, 34.4, 139.6, 48.1] },
    { label: 'Назад', action: 'back', rect: [1159.8, 34.4, 125.8, 48.1] },
    ...(screen.next ? [link('Следующий слайд', screen.next, [1190, 100, 130, screen.height - 100])] : []),
    ...screen.hotspots,
  ];
}
