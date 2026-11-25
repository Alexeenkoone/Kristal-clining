
const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');

menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});

nav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

function message() {
  const form = document.querySelector('#lead');

  if (!form.reportValidity()) return null;

  const data = new FormData(form);

  return {
    name: data.get('name'),
    phone: data.get('phone'),
    service: data.get('service'),
    comment: data.get('comment') || ''
  };
}

function messengerMessage(data) {
  return `Здравствуйте! Хочу заказать клининг.

Имя: ${data.name}
Телефон: ${data.phone}
Услуга: ${data.service}
Комментарий: ${data.comment || '—'}`;
}

function sendMessenger(type) {
  const data = message();
  if (!data) return;

  const text = encodeURIComponent(messengerMessage(data));

  const urls = {
    wa: `https://wa.me/79141898673?text=${text}`,
    tg: `https://t.me/share/url?url=&text=${text}`,
    max: `https://max.ru/:share?text=${text}`
  };

  window.open(urls[type], '_blank', 'noopener,noreferrer');
}

// WhatsApp
document.querySelector('#sendwa').addEventListener('click', () => {
  sendMessenger('wa');
});

// Telegram
document.querySelector('#sendtg').addEventListener('click', () => {
  sendMessenger('tg');
});

// MAX
document.querySelector('#sendmax').addEventListener('click', () => {
  sendMessenger('max');
});

// Отправка заявки через Cloudflare Worker
document.querySelector('#lead').addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = message();

  if (!data) return;

  const button = form.querySelector('button[type="submit"]');
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = 'Отправляем...';

  try {
    const response = await fetch(
      'https://late-sky-7ec6.alexeenkoone.workers.dev',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error('Не удалось отправить заявку');
    }

    alert('Спасибо! Ваша заявка успешно отправлена.');
    form.reset();

  } catch (error) {
    alert('Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами через мессенджер.');

  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});
