
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const form = $('lead');
  if (!form) return;

  const WORKER_URL = 'https://late-sky-7ec6.alexeenkoone.workers.dev';

  const WHATSAPP_URL = 'https://wa.me/79141898673';
  const TELEGRAM_URL = 'https://t.me/share/url?url=';
  const MAX_URL = 'https://max.ru/u/f9LHodD0cOIyPrLXuxXoHcYFt9ZClJZET6DS9RLdn0CJ-BxPrGx5ie5dDkU';

  // Год внизу сайта
  const year = $('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Мобильное меню
  const menuButton = document.querySelector('.menu');
  const nav = $('nav');

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('active');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Получение всех данных формы
  function getFormData() {
    const data = new FormData(form);

    return {
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      city: String(data.get('city') || '').trim(),
      address: String(data.get('address') || '').trim(),
      objectType: String(data.get('objectType') || '').trim(),

      services: data.getAll('services').map(value =>
        String(value).trim()
      ).filter(Boolean),

      area: String(data.get('area') || '').trim(),
      rooms: String(data.get('rooms') || '').trim(),
      date: String(data.get('date') || '').trim(),
      time: String(data.get('time') || '').trim(),
      comment: String(data.get('comment') || '').trim()
    };
  }

  // Формирование сообщения для мессенджеров
  function messengerMessage(data) {
    const lines = [
      'НОВАЯ ЗАЯВКА — КРИСТАЛЛ',
      '',
      'Имя: ' + (data.name || 'Не указано'),
      'Телефон: ' + (data.phone || 'Не указан'),
      'Город: ' + (data.city || 'Не указан'),
      'Адрес: ' + (data.address || 'Не указан'),
      'Тип объекта: ' + (data.objectType || 'Не указан'),
      '',
      'УСЛУГИ:',
      data.services.length
        ? data.services.map((service, index) => (index + 1) + '. ' + service).join('\n')
        : 'Не выбраны',
      '',
      'Площадь: ' + (data.area ? data.area + ' м²' : 'Не указана'),
      'Количество комнат: ' + (data.rooms || 'Не указано'),
      'Дата уборки: ' + (data.date || 'Не указана'),
      'Время: ' + (data.time || 'Не указано'),
      '',
      'Комментарий: ' + (data.comment || 'Нет')
    ];

    return lines.join('\n');
  }

  // Проверка формы
  function validateForm() {
    if (!form.reportValidity()) {
      return false;
    }

    const data = getFormData();

    if (data.services.length === 0) {
      alert('Пожалуйста, выберите хотя бы одну услугу.');
      return false;
    }

    return true;
  }

  // Открытие ссылки в новом окне
  function openMessenger(url) {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (!newWindow) {
      window.location.href = url;
    }
  }

  // WhatsApp
  const sendwa = $('sendwa');

  if (sendwa) {
    sendwa.addEventListener('click', () => {
      if (!validateForm()) return;

      const data = getFormData();
      const text = encodeURIComponent(messengerMessage(data));

      openMessenger(WHATSAPP_URL + '?text=' + text);
    });
  }

  // Telegram
  const sendtg = $('sendtg');

  if (sendtg) {
    sendtg.addEventListener('click', () => {
      if (!validateForm()) return;

      const data = getFormData();
      const text = encodeURIComponent(messengerMessage(data));

      openMessenger(TELEGRAM_URL + '&text=' + text);
    });
  }

  // MAX пока просто открывает профиль
  const sendmax = $('sendmax');

  if (sendmax) {
    sendmax.addEventListener('click', () => {
      openMessenger(MAX_URL);
    });
  }

  // Отправка заявки через существующий Cloudflare Worker
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const data = getFormData();
    const status = $('formStatus');
    const submitButton = $('submitLead');

    const payload = {
      ...data,

      // Совместимость с прежней формой:
      // выбранные услуги передаются также одной строкой.
      service: data.services.join(', '),

      // Готовый текст заявки.
      message: messengerMessage(data)
    };

    if (status) {
      status.textContent = 'Отправляем заявку...';
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Отправка...';
    }

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || 'Не удалось отправить заявку. Попробуйте ещё раз.'
        );
      }

      if (status) {
        status.textContent = 'Заявка успешно отправлена! Спасибо за обращение.';
      }

      form.reset();

    } catch (error) {
      console.error('Ошибка отправки заявки:', error);

      if (status) {
        status.textContent =
          'Не удалось отправить заявку через форму. Попробуйте написать нам в WhatsApp или Telegram.';
      }

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Отправить заявку →';
      }
    }
  });

})();
