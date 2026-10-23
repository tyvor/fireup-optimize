(function (root) {
  'use strict';
  const ru = {
    'Settings': 'Настройки', 'FireUp settings': 'Настройки FireUp', 'Pause': 'Приостановить', 'Resume': 'Продолжить',
    'Loading tabs…': 'Получаю список вкладок…', 'Find a tab or site': 'Найти вкладку или сайт', 'Search tabs': 'Поиск вкладок',
    'Show': 'Показать', 'All tabs': 'Все вкладки', 'Loaded': 'Загруженные', 'Sleeping': 'Спящие', 'Protected': 'С защитой', 'Refresh': 'Обновить', 'Tabs': 'Вкладки',
    'Tab protection': 'Защита вкладки', 'For 30 minutes': 'На 30 минут', 'For one hour': 'На час', 'Until removed': 'До снятия', 'Remove protection': 'Снять защиту', 'Close': 'Закрыть',
    'Unload tabs': 'Выгрузка вкладок', 'Unload': 'Усыпить', 'This window': 'В этом окне', 'Selected tabs': 'Выбранные вкладки', 'All windows': 'Во всех окнах',
    'Loading…': 'Загрузка…', 'Stop': 'Остановить', 'Protected tabs will stay loaded.': 'Защищённые вкладки останутся загруженными.', 'Retry': 'Повторить загрузку',
    'Unsaved input may be lost. Protect editors and forms before unloading.': 'Несохранённый ввод может потеряться. Перед выгрузкой защитите редакторы и формы.',
    'Loading settings…': 'Загружаю настройки…', 'Recent working set': 'Рабочий набор',
    'Keep this many recently used tabs loaded. Protected tabs may increase the total.': 'Столько последних использованных вкладок останется загруженными. Защищённые вкладки могут увеличить это число.',
    'Idle time before sleep, minutes': 'Простой до сна, минут',
    'Tabs outside the working set can sleep after this time. Background reloads do not count as visits.': 'Вкладки вне рабочего набора засыпают после этого времени. Фоновая перезагрузка не считается вашим обращением.',
    'Delay sleep after a quick return': 'Увеличивать отсрочку после быстрого возврата',
    'Returning within two minutes of a FireUp unload delays the next automatic sleep. With a 10-minute timer, the delay grows to 20, 40, 80 and 120 minutes. Manual unloading remains available.': 'Если вы вернули выгруженную FireUp вкладку за две минуты, её следующий автосон откладывается. При таймере 10 минут отсрочка растёт: 20, 40, 80 и до 120 минут. Ручная выгрузка остаётся доступна.',
    'Never unload these sites': 'Никогда не усыплять сайты', 'One domain per line': 'По одному домену в строке',
    'A domain also protects its subdomains. Use chatgpt.com to protect all its tabs. Do not include paths, ports or wildcards.': 'Домен защищает и поддомены. Укажите chatgpt.com, если хотите защитить все его вкладки. Не вводите пути, порты или звёздочки.',
    'Appearance': 'Оформление', 'System': 'Как в системе', 'Light': 'Светлое', 'Dark': 'Тёмное', 'Language': 'Язык', 'Browser default': 'Как в браузере',
    'Uses the browser interface language. Other languages fall back to English.': 'Используется язык интерфейса браузера. Для других языков выбран английский.',
    'Save settings': 'Сохранить настройки', 'Settings transfer': 'Перенос настроек',
    'Export includes applied settings and excluded domains. Per-tab protection and open-tab URLs are not included.': 'Экспорт сохраняет применённые настройки и исключения сайтов. Защита отдельных вкладок и их адреса в файл не входят.',
    'Export settings': 'Экспортировать настройки', 'Choose an import file': 'Выбрать файл для импорта', 'Settings from file': 'Настройки из файла', 'Excluded sites': 'Исключения сайтов',
    'Applying this file replaces all current settings, including whether automatic sleep is enabled.': 'Применение файла заменит текущие настройки, включая состояние автосна.',
    'Apply import': 'Применить импорт', 'Cancel': 'Отмена',
    'FireUp does not read page contents or detect every form or silent playback. Protect tabs or sites with unsaved input. Active, pinned, audible tabs and browser-reported calls are skipped. Private tabs are excluded.': 'FireUp не читает содержимое страниц и не распознаёт все формы и тихое воспроизведение. Защитите вкладки или сайты с несохранённым вводом. Текущие, закреплённые, звучащие вкладки и известные Firefox звонки пропускаются. Приватные вкладки не обрабатываются.',
    'Alt+Shift+U unloads unprotected background tabs in all windows. FireUp does not close tabs or terminate processes.': 'Alt+Shift+U выгружает фоновые вкладки без защиты во всех окнах. FireUp не закрывает вкладки и не завершает процессы.',
    'Asleep': 'Спит', 'Protected until {time}': 'Защищена до {time}', 'Temporary protection': 'Временная защита',
    'Quick return · sleep in about {minutes} min': 'Быстрый возврат · до сна около {minutes} мин', 'Waiting for activity data': 'Ожидает данных об активности',
    'Sleep in about {minutes} min': 'До сна около {minutes} мин', 'Ready to sleep · waiting for queue': 'Готова ко сну · ожидает очереди',
    'Queue: {processed} of {total}': 'В очереди: {processed} из {total}', 'Unload tabs: {count}': 'Усыпить вкладки: {count}',
    'Unloaded {slept}, skipped {skipped}, failed {failed}.': 'Выгружено {slept}, пропущено {skipped}, ошибок {failed}.',
    'Manual unloading includes recent tabs. Protected tabs stay loaded.': 'Ручная команда затронет и недавние вкладки. Защищённые останутся.',
    'Select: {title}': 'Выбрать: {title}', 'Protection: {title}': 'Защита: {title}', 'Loaded {loaded} of {total}': 'Загружено {loaded} из {total}',
    'Automatic sleep on': 'Автосон включён', 'Automatic sleep paused': 'Автосон на паузе', 'Protection': 'Защита', 'Protect': 'Защитить', 'Configure protection: {title}': 'Настроить защиту: {title}',
    'No matches. Change your search or filter.': 'Нет совпадений. Измените поиск или фильтр.', 'No regular tabs yet.': 'Обычных вкладок пока нет.', 'Site: {site}': 'Сайт: {site}',
    'Queue stopped.': 'Очередь остановлена.', 'The action failed. Try again.': 'Не удалось выполнить действие. Повторите попытку.',
    'Automatic sleep enabled.': 'Автосон включён.', 'Automatic sleep paused. Manual unloading is available.': 'Автосон приостановлен. Ручная выгрузка доступна.',
    'A queue is already running.': 'Очередь уже выполняется.', 'Tabs queued: {count}.': 'В очереди вкладок: {count}.',
    'Queue stopped. Tabs already unloaded remain asleep.': 'Очередь остановлена. Уже выгруженные вкладки остаются спящими.', 'List refreshed.': 'Список обновлён.', 'Protection updated.': 'Защита обновлена.',
    'Could not load settings: {error}': 'Не удалось получить настройки: {error}', 'Settings saved.': 'Настройки сохранены.',
    'The browser received fireup-settings.json for saving.': 'Файл fireup-settings.json передан браузеру для сохранения.', 'Reading settings file…': 'Читаю файл настроек…',
    'Automatic sleep: {enabled}. Working set: {keep}. Timer: {idle} min. Quick-return delay: {anti}. Theme: {theme}. Language: {language}. Sites: {sites}.': 'Автосон: {enabled}. Рабочий набор: {keep}. Таймер: {idle} мин. Защита от повторного сна: {anti}. Тема: {theme}. Язык: {language}. Сайтов: {sites}.',
    'On': 'Включён', 'Paused': 'На паузе', 'Enabled': 'Включена', 'Disabled': 'Выключена', 'No site exclusions': 'Исключений сайтов нет',
    'File validated. Review the settings before applying.': 'Файл проверен. Просмотрите настройки перед применением.', 'Imported settings applied.': 'Настройки из файла применены.', 'Import cancelled.': 'Импорт отменён.',
    'Private tab': 'Приватная вкладка', 'Active tab': 'Текущая вкладка', 'Pinned': 'Закреплена', 'Playing audio': 'Есть звук', 'Call or screen sharing': 'Звонок или демонстрация',
    'Loading': 'Загружается', 'Internal page': 'Служебная страница', 'Protected by Firefox': 'Защита Firefox', 'Could not verify protection': 'Не удалось проверить защиту',
    'Manual protection': 'Ручная защита', 'Excluded site': 'Сайт в исключениях', 'In working set': 'В рабочем наборе', 'First-install grace period': 'Отсрочка первого запуска', 'Untitled tab': 'Вкладка',
    'Unknown unload scope.': 'Неизвестная область выгрузки.', 'Invalid protection mode.': 'Неверный режим защиты.', 'Private tabs are not processed.': 'Приватные вкладки не обрабатываются.', 'Private tab.': 'Приватная вкладка.',
    'Enter a domain without a path or port, such as chatgpt.com.': 'Введите домен без пути и порта, например chatgpt.com.',
    'Automatic sleep and quick-return delay must be true or false.': 'Режим автосна и защита от повторного сна должны иметь значение true или false.',
    'The working set must be between 1 and 100.': 'Рабочий набор должен быть от 1 до 100.', 'The timer must be between 1 and 1440 minutes.': 'Таймер должен быть от 1 до 1440 минут.',
    'Unknown appearance setting.': 'Неизвестная тема оформления.', 'Unknown language setting.': 'Неизвестный язык интерфейса.', 'Use at most 500 excluded domains.': 'В исключениях должно быть не больше 500 доменов.',
    'The settings file must be no larger than 256 KB.': 'Файл настроек должен быть не больше 256 КБ.', 'Could not read JSON. Choose a FireUp settings export.': 'Не удалось прочитать JSON. Выберите файл экспорта FireUp.',
    'Unsupported FireUp settings format.': 'Неподдерживаемый формат настроек FireUp.', 'Invalid export version or date.': 'Неверная версия или дата экспорта.',
    'Invalid structure: {name}.': 'Неверная структура: {name}.', 'Missing fields: {name}.': 'В файле не хватает полей: {name}.', 'settings': 'настройки', 'FireUp file': 'файл FireUp',
    'Protect tab': 'Защитить вкладку', 'Protect for 30 minutes': 'Защитить на 30 минут', 'Protect for one hour': 'Защитить на час', 'Unload background tabs in this window': 'Усыпить фоновые вкладки этого окна',
    'Unload unprotected background tabs in all windows': 'Усыпить фоновые вкладки без защиты во всех окнах'
  };
  let language;
  function resolve(value = 'auto', browserLanguage) {
    if (value === 'en' || value === 'ru') return value;
    const detected = browserLanguage || root.browser?.i18n?.getUILanguage?.() || root.navigator?.language || 'en';
    return /^ru(?:-|_|$)/i.test(detected) ? 'ru' : 'en';
  }
  function set(value = 'auto') { language = resolve(value); return language; }
  function t(key, values = {}) {
    const template = language === 'ru' ? ru[key] || key : key;
    return template.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
  }
  function error(value) {
    const message = value?.message || String(value);
    for (const prefix of ['Invalid structure', 'Missing fields']) if (message.startsWith(prefix + ': ')) {
      return t(prefix + ': {name}.', { name: t(message.slice(prefix.length + 2, -1)) });
    }
    return t(message);
  }
  function apply(doc = root.document) {
    doc.documentElement.lang = language;
    for (const el of doc.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const [attr, key] of [['placeholder', 'i18nPlaceholder'], ['aria-label', 'i18nAria'], ['title', 'i18nTitle']]) {
      for (const el of doc.querySelectorAll(`[data-${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}]`)) el.setAttribute(attr, t(el.dataset[key]));
    }
    if (doc.documentElement.dataset.title) doc.title = t(doc.documentElement.dataset.title);
  }
  const api = { ru, resolve, set, t, error, apply, get language() { return language; } };
  root.FireUpI18n = api; set();
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
