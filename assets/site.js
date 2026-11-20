
    (() => {
      'use strict';

      const PAGE = document.body.dataset.page || 'home';
      const ROOT = document.documentElement.dataset.root || '';
      let expertHoursSel = 1;
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
      const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
      const money = value => `${nf.format(Math.round(value))} ₽`;
      const number = value => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      };
      const qtyText = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value);
      const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
      const plural = (count, forms) => {
        const n = Math.abs(count) % 100;
        const n1 = n % 10;
        if (n > 10 && n < 20) return forms[2];
        if (n1 > 1 && n1 < 5) return forms[1];
        if (n1 === 1) return forms[0];
        return forms[2];
      };

      let mode = 'package';
      let currentEstimate = null;
      let toastTimer;
      const expertPrices = { 1: 20000, 2: 35000, 3: 47000 };
      const hoursLabel = h => String(h).replace('.', ',');
      const cameraRates = {
        static1: { label: 'Статичная съёмка · 1 камера + свет', base: 8000, extra: 2000, full: 15000, fullFrom: false },
        static2: { label: 'Статичная съёмка · 2 камеры + свет', base: 10000, extra: 2500, full: 20000, fullFrom: false },
        static3: { label: 'Статичная съёмка · 3 камеры + свет', base: 12000, extra: 3000, full: 25000, fullFrom: false },
        dynamic: { label: 'Динамическая съёмка · 1 камера', base: 10000, extra: 2500, full: 20000, fullFrom: true },
        reportage: { label: 'Репортажная съёмка · стабилизатор / с рук', base: 15000, extra: 5000, full: 30000, fullFrom: true }
      };
      const talkRates = {
        talk2: { label: 'Интеллектуальный монтаж · 2 человека / 3 камеры', rate: 10000 },
        talk3: { label: 'Интеллектуальный монтаж · 3 человека / 4 камеры', rate: 15000 },
        talk4: { label: 'Интеллектуальный монтаж · 4 человека / 5 камер', rate: 20000 },
        basic: { label: 'Экспресс-мультикам · нейросети · результат в тот же день', rate: 3000 }
      };

      function toast(message) {
        const el = $('#toast');
        el.textContent = message;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
      }

      function setMode(nextMode) {
        mode = nextMode;
        $$('.mode-tab').forEach(tab => {
          const active = tab.dataset.mode === mode;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
        });
        $('#panel-package').hidden = mode !== 'package';
        $('#panel-custom').hidden = mode !== 'custom';
        $$('.package-only').forEach(el => { el.hidden = mode !== 'package'; });
        $$('.custom-only').forEach(el => { el.hidden = mode !== 'custom'; });
        calculate();
      }

      function choosePackage(name, hours) {
        const radio = $(`input[name="package"][value="${name}"]`);
        if (radio) radio.checked = true;
        if (hours && expertPrices[hours]) $('#package-hours').value = String(hours);
        setMode('package');
        syncPackageSettings();
        calculate();
        openCalc();
        $('#calculator').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      function syncExpertIncluded() {
        const el = $('#expert-included'); if (!el) return;
        el.textContent = Number($('#package-hours').value) === 1
          ? 'Включено в тариф 1 час: студия, 3 камеры, звук, 2 специалиста, 30 минут подготовки в тайминге, экспресс-монтаж подкаста и превью (обложка). 5 Reels/Shorts входят в пакеты от 2 часов.'
          : 'Включено: студия, 3 камеры, звук, 2 специалиста, грим-подготовка, интеллектуальный монтаж, 5 простых вертикальных роликов и 1 обложка.';
      }

      function syncPackageSettings() {
        syncExpertIncluded();
        const selected = $('input[name="package"]:checked').value;
        $('#package-expert-settings').hidden = selected !== 'expert';
        $('#package-monthly-settings').hidden = selected !== 'monthly';
        $('#package-shorts-settings').hidden = selected !== 'shorts';
        $('#shorts-location-note').hidden = $('#shorts-location').value !== 'location';
      }

      function syncCustomSettings() {
        const script = $('#script-type').value;
        const needsMinutes = script === 'youtube' || script === 'film';
        $('#script-minutes-field').hidden = !needsMinutes;
        if (needsMinutes) {
          $('#script-minutes').value = script === 'film' && number($('#script-minutes').value) === 7 ? 10 : $('#script-minutes').value;
          const included = script === 'film' ? 10 : 7;
          const extra = script === 'film' ? 500 : 1000;
          $('#script-minutes-hint').textContent = `Включено ${included} мин, далее ${nf.format(extra)} ₽ / мин`;
        }

        const camera = $('#camera-type').value;
        const cameraActive = camera !== 'none';
        $('#camera-settings').hidden = !cameraActive;
        if (cameraActive) {
          const rate = cameraRates[camera];
          const full = $('input[name="camera-billing"]:checked').value === 'full';
          $('#camera-hours').disabled = full;
          $('#camera-rate-hint').textContent = full ? `Фиксированно: ${money(rate.full)}${rate.fullFrom ? ' (от)' : ''}` : `Включены первые 2 часа, далее ${money(rate.extra)} / час`;
        }

        const drone = $('#drone-type').value;
        $('#drone-hours-field').hidden = drone === 'none';
        const soundActive = $$('[data-sound]').some(input => input.checked);
        $('#sound-hours-field').hidden = !soundActive;
        const talk = $('#talk-type').value;
        $('#talk-hours-field').hidden = talk === 'none';
        $('#basic-multicam-note').hidden = talk !== 'basic';
      }

      function calculate() {
        syncPackageSettings();
        syncCustomSettings();
        const items = [];
        const warnings = [];
        let editSubtotal = 0;

        const add = (label, amount, category, detail = '', from = false, isEdit = false, admin = false) => {
          if (!(amount > 0)) return;
          const chartCategory = category === 'edit' ? 'post' : category;
          items.push({ label, amount, category: chartCategory, detail, from, admin });
          if (isEdit) editSubtotal += amount;
        };

        if (mode === 'package') {
          const selected = $('input[name="package"]:checked').value;
          if (selected === 'expert') {
            const hours = $('#package-hours').value;
            add('Пакет «Подкаст Эксперта»', expertPrices[hours], 'pre', Number(hours) === 1 ? 'Запись 1 ч (+30 минут подготовки) · экспресс-монтаж подкаста и превью' : `${hoursLabel(hours)} ч записи (+30 минут подготовки) · монтаж, 5 роликов и обложка`);
          } else if (selected === 'monthly') {
            add('Пакет «Экспертный контент на месяц на месяц»', 85000, 'pre', '4 эпизода · 15 Shorts/Reels · 4 обложки · продюсирование контента');
          } else {
            const isLocation = $('#shorts-location').value === 'location';
            add('Пакет «Корпоративный 30 коротких видео»', 50000, 'pre', '30 роликов · 1 съёмочная смена до 4 часов · сценарии и SEO', isLocation);
            if (isLocation) warnings.push('Выездная динамическая съёмка оценивается индивидуально и не добавлена к сумме.');
          }
          $$('#panel-package [data-qty]').forEach(input => {
            const qty = number(input.value);
            if (!qty) return;
            const price = Number(input.dataset.price);
            add(input.dataset.label, qty * price, input.dataset.category, `${qtyText(qty)} × ${money(price)}${input.dataset.from ? ' · минимальная цена' : ''}`, input.dataset.from === 'true', input.dataset.edit === 'true');
          });
        } else {
          $$('#panel-custom [data-check]').forEach(input => {
            if (!input.checked) return;
            const price = Number(input.dataset.price);
            add(input.dataset.label, price, input.dataset.category, input.dataset.from ? 'Минимальная стоимость по прайсу' : 'Фиксированная стоимость', input.dataset.from === 'true');
          });

          const script = $('#script-type').value;
          const scriptMap = {
            podcast: { label: 'Сценарий + покадровый план · подкаст / интервью', base: 2000, from: false, included: 0, extra: 0 },
            reels: { label: 'Сценарий + покадровый план · Reels / Shorts до 3 мин', base: 2000, from: true, included: 0, extra: 0 },
            youtube: { label: 'Сценарий + покадровый план · YouTube / промо', base: 5000, from: true, included: 7, extra: 1000 },
            film: { label: 'Сценарий + покадровый план · корп. / док. фильм', base: 10000, from: true, included: 10, extra: 500 },
            commercial: { label: 'Сценарий коммерческой рекламы', base: 7000, from: true, included: 0, extra: 0 }
          };
          if (script !== 'none') {
            const item = scriptMap[script];
            const minutes = number($('#script-minutes').value);
            const extraMinutes = item.included ? Math.max(0, minutes - item.included) : 0;
            const amount = item.base + extraMinutes * item.extra;
            const detail = item.included ? `${qtyText(minutes)} мин · ${money(item.base)} + ${qtyText(extraMinutes)} доп. мин × ${money(item.extra)}` : 'Минимальная стоимость по прайсу';
            add(item.label, amount, 'pre', detail, item.from);
          }

          const camera = $('#camera-type').value;
          if (camera !== 'none') {
            const rate = cameraRates[camera];
            const full = $('input[name="camera-billing"]:checked').value === 'full';
            if (full) {
              add(rate.label, rate.full, 'shoot', 'Полная съёмочная смена', rate.fullFrom);
            } else {
              const hours = Math.max(2, number($('#camera-hours').value) || 2);
              const extraHours = Math.max(0, hours - 2);
              add(rate.label, rate.base + extraHours * rate.extra, 'shoot', `${qtyText(hours)} ч · ${money(rate.base)} за 2 ч + ${qtyText(extraHours)} ч × ${money(rate.extra)}`);
            }
          }

          const drone = $('#drone-type').value;
          if (drone !== 'none') {
            const rate = drone === 'fpv' ? 20000 : 10000;
            const hours = Math.max(.5, number($('#drone-hours').value) || 1);
            add(drone === 'fpv' ? 'FPV-аэросъёмка' : 'Аэросъёмка обычным дроном', hours * rate, 'shoot', `${qtyText(hours)} ч × ${money(rate)}`);
          }

          const soundHours = Math.max(.5, number($('#sound-hours').value) || 2);
          const soundNames = { lav: 'Петличная система · 1–2 шт.', recorder: 'Многоканальный рекордер', operator: 'Выездной звукооператор' };
          $$('[data-sound]:checked').forEach(input => {
            const base = Number(input.dataset.base);
            const extra = Number(input.dataset.extra);
            const extraHours = Math.max(0, soundHours - 2);
            add(soundNames[input.dataset.sound], base + extraHours * extra, 'shoot', `${qtyText(soundHours)} ч · первые 2 ч ${money(base)}, продление ${money(extra)} / ч`);
          });

          const talk = $('#talk-type').value;
          if (talk !== 'none') {
            const rate = talkRates[talk];
            const hours = Math.max(.5, number($('#talk-hours').value) || 1);
            add(rate.label, hours * rate.rate, 'edit', `${qtyText(hours)} ч исходника × ${money(rate.rate)}`, false, true);
          }

          const filmMinutes = number($('[data-film]').value);
          if (filmMinutes) {
            const first = Math.min(20, filmMinutes);
            const next = Math.max(0, filmMinutes - 20);
            add('Монтаж фильма / шоу', first * 2000 + next * 1200, 'edit', `${qtyText(first)} мин × 2 000 ₽ + ${qtyText(next)} мин × 1 200 ₽`, false, true);
          }

          const simpleTitles = number($('[data-simple-titles]').value);
          if (simpleTitles) {
            add('Простые плашки и титры', 1500 + Math.max(0, simpleTitles - 2) * 500, 'post', `${qtyText(simpleTitles)} шт. · 2 шт. за 1 500 ₽, далее 500 ₽ / шт.`);
          }

          $$('#panel-custom [data-qty]').forEach(input => {
            const qty = number(input.value);
            if (!qty) return;
            const price = Number(input.dataset.price);
            add(input.dataset.label, qty * price, input.dataset.category, `${qtyText(qty)} × ${money(price)}${input.dataset.from ? ' · минимальная цена' : ''}`, input.dataset.from === 'true', input.dataset.edit === 'true');
          });
        }

        const workSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const fast = mode === 'custom' && $('#common-fast').checked;
        if (fast && editSubtotal > 0) {
          add('Срочный монтаж · Fast Track', editSubtotal, 'post', `+100% к позициям монтажа (${money(editSubtotal)})`, false, false, true);
        } else if (fast && editSubtotal === 0) {
          warnings.push('Fast Track включён, но позиции монтажа не выбраны — наценка пока равна 0 ₽.');
        }

        const productionBase = workSubtotal + (fast ? editSubtotal : 0);
        if ($('#common-producer').checked && productionBase > 0) {
          const producer = Math.max(15000, productionBase * .2);
          add('Продюсирование / режиссура проекта', producer, 'service', `20% от ${money(productionBase)}, минимум 15 000 ₽`, false, false, true);
        }

        const storageGB = number($('#storage-gb').value);
        const storageWeeks = number($('#storage-weeks').value);
        if (storageGB && storageWeeks) {
          add('Дополнительное хранение данных', storageGB * storageWeeks * 50, 'service', `${qtyText(storageGB)} ГБ × ${qtyText(storageWeeks)} нед. × 50 ₽ · после 3 бесплатных недель`, false, false, true);
        } else if (storageGB || storageWeeks) {
          warnings.push('Для расчёта хранения укажите и объём данных, и число дополнительных недель.');
        }

        const renderBlocks = number($('#render-blocks').value);
        if (renderBlocks) {
          add('Рендер тяжёлого проекта', renderBlocks * 500, 'service', `${qtyText(renderBlocks)} × 30 мин × 500 ₽ · минимальная цена`, true, false, true);
        }

        const total = items.reduce((sum, item) => sum + item.amount, 0);
        const hasFrom = items.some(item => item.from);
        const categories = { pre: 0, shoot: 0, post: 0, service: 0 };
        items.forEach(item => { categories[item.category] = (categories[item.category] || 0) + item.amount; });
        currentEstimate = { items, total, hasFrom, warnings, categories, mode, productionBase, editSubtotal };
        renderEstimate();
      }

      function renderEstimate() {
        const estimate = currentEstimate;
        const { items, total, hasFrom, warnings, categories } = estimate;
        $('#estimate-mode').textContent = `${mode === 'package' ? 'Готовый пакет' : 'Конструктор проекта'} · предварительно`;
        $('#legend-pre-label').textContent = mode === 'package' ? 'Пакет' : 'Разработка';
        $('#estimate-status').textContent = hasFrom || warnings.length ? 'НУЖНО УТОЧНИТЬ' : 'РАСЧЁТ';
        $('#estimate-empty').hidden = items.length > 0;
        $('#estimate-lines').innerHTML = items.map(item => `
          <div class="estimate-line${item.admin ? ' admin' : ''}">
            <div><strong>${escapeHTML(item.label)}</strong>${item.detail ? `<small>${escapeHTML(item.detail)}</small>` : ''}</div>
            <span>${item.from ? 'от ' : ''}${money(item.amount)}</span>
          </div>`).join('');
        $('#estimate-total-label').textContent = hasFrom || warnings.length ? 'Ориентировочный итог' : 'Итого';
        $('#estimate-total-value').textContent = `${hasFrom || warnings.length ? 'от ' : ''}${money(total)}`;
        $('#estimate-count').textContent = `${items.length} ${plural(items.length, ['позиция', 'позиции', 'позиций'])}`;
        const allWarnings = [...warnings];
        if (hasFrom) allWarnings.unshift('Есть позиции «от»: итог показан по минимальной цене прайса и требует подтверждения.');
        if (!total) allWarnings.push('Начните с выбора пакета или услуг конструктора.');
        $('#estimate-warning').hidden = allWarnings.length === 0;
        $('#estimate-warning').innerHTML = allWarnings.map(escapeHTML).join('<br>');
        Object.entries(categories).forEach(([category, amount]) => {
          $(`#bar-${category}`).style.width = total ? `${amount / total * 100}%` : '0%';
        });
        ['pre', 'shoot', 'edit', 'post'].forEach(group => {
          const target = $(`[data-group-total="${group}"]`);
          if (!target) return;
          const amount = group === 'edit' ? estimate.editSubtotal : categories[group];
          target.textContent = amount ? money(amount) : 'Не выбрано';
        });
      }

      function estimateText() {
        const e = currentEstimate;
        const date = new Date().toLocaleDateString('ru-RU');
        const lines = [
          'VOLNA FILM · ПРЕДВАРИТЕЛЬНАЯ СМЕТА',
          `Дата: ${date}`,
          `Формат: ${mode === 'package' ? 'готовый пакет' : 'конструктор проекта'}`,
          ''
        ];
        e.items.forEach((item, index) => lines.push(`${index + 1}. ${item.label}${item.detail ? ` — ${item.detail}` : ''} — ${item.from ? 'от ' : ''}${money(item.amount)}`));
        lines.push('', `${e.hasFrom || e.warnings.length ? 'ОРИЕНТИРОВОЧНЫЙ ИТОГ' : 'ИТОГО'}: ${e.hasFrom || e.warnings.length ? 'от ' : ''}${money(e.total)}`);
        if (e.hasFrom) lines.push('В расчёте есть позиции «от» — использованы минимальные цены прайса.');
        if (e.warnings.length) lines.push(...e.warnings.map(item => `Внимание: ${item}`));
        lines.push('', 'Предварительный расчёт, не публичная оферта. Финальная смета подтверждается после брифа.');
        return lines.join('\n');
      }

      async function copyEstimate() {
        const text = estimateText();
        try {
          await navigator.clipboard.writeText(text);
          toast('Смета скопирована в буфер обмена');
        } catch (error) {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const success = document.execCommand('copy');
          textarea.remove();
          toast(success ? 'Смета скопирована' : 'Не удалось скопировать. Выделите текст сметы вручную.');
        }
      }

      function printEstimate() {
        const e = currentEstimate;
        const date = new Date().toLocaleDateString('ru-RU');
        $('#print-area').innerHTML = `
          <div class="print-brand"><img style="width:100px;height:auto" alt="VOLNA" src="${ROOT}assets/img-92fe70ae1b.png"></div><div class="print-head"><div><h1>Предварительная смета</h1><p>Видеопродакшен полного цикла · ${mode === 'package' ? 'готовый пакет' : 'конструктор проекта'}</p></div><p>Дата: ${date}</p></div>
          <div class="print-total"><span>${e.hasFrom || e.warnings.length ? 'Ориентировочный итог' : 'Итого'}</span><strong>${e.hasFrom || e.warnings.length ? 'от ' : ''}${money(e.total)}</strong></div>
          <table class="print-table"><thead><tr><th>Услуга</th><th>Комментарий</th><th>Стоимость</th></tr></thead><tbody>${e.items.map(item => `<tr><td>${escapeHTML(item.label)}</td><td>${escapeHTML(item.detail)}</td><td>${item.from ? 'от ' : ''}${money(item.amount)}</td></tr>`).join('')}</tbody></table>
          <div class="print-note">${e.hasFrom ? '<p>В расчёте есть позиции «от»: использованы минимальные значения прайса.</p>' : ''}${e.warnings.map(item => `<p>${escapeHTML(item)}</p>`).join('')}<p>Предварительный расчёт, не публичная оферта. Финальная стоимость зависит от брифа, исходников, локаций, сложности графики и согласованных сроков.</p></div>`;
        const contactLine=document.createElement('p');contactLine.textContent=studioLine();$('#print-area').appendChild(contactLine);window.print();
      }

      function resetCalculator() {
        $$('#calculator input[type="number"]').forEach(input => { input.value = input.defaultValue; });
        $$('#calculator input[type="checkbox"]').forEach(input => { input.checked = input.defaultChecked; });
        $$('#calculator select').forEach(select => { select.value = select.querySelector('option[selected]')?.value || select.options[0].value; });
        $$('input[name="camera-billing"]').forEach(input => { input.checked = input.defaultChecked; });
        const expert = $('input[name="package"][value="expert"]');
        expert.checked = true;
        $('#package-hours').value = '1';
        setMode('package');
        syncExpertCard(1);
        toast('Калькулятор сброшен');
      }

      function syncExpertCard(hours) {
        $('#expert-card-price').textContent = money(expertPrices[hours]);
        $('#expert-card-caption').textContent = Number(hours) === 1 ? '1 час записи (+30 минут подготовки) · экспресс-монтаж и превью' : `за ${hours} ${plural(Number(hours), ['час', 'часа', 'часов'])} исходного материала`;
        $$('[data-expert-hour]').forEach(button => button.classList.toggle('active', Number(button.dataset.expertHour) === Number(hours)));
      }

      $$('.mode-tab').forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
      $('.mode-tabs').addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const next = mode === 'package' ? 'custom' : 'package';
        setMode(next);
        $(`.mode-tab[data-mode="${next}"]`).focus();
      });
      $$('input[name="package"]').forEach(input => input.addEventListener('change', calculate));
      $('#package-hours').addEventListener('change', () => { syncExpertIncluded(); syncExpertCard(Number($('#package-hours').value)); calculate(); });
      $$('[data-expert-hour]').forEach(button => button.addEventListener('click', () => {
        const hours = Number(button.dataset.expertHour);
        syncExpertCard(hours);
        $('#package-hours').value = String(hours);
        expertHoursSel = hours;
        $$('[data-calc-pkg="expert"]').forEach(a => { a.href = `${ROOT}smeta/?package=expert&hours=${hours}#calculator`; });
        if (PAGE === 'smeta') choosePackage('expert', hours);
      }));
      $$('[data-choose-package]').forEach(button => button.addEventListener('click', () => choosePackage(button.dataset.choosePackage, button.dataset.hours || $('#package-hours').value)));
      $$('[data-custom-format]').forEach(link => link.addEventListener('click', () => {
        setMode('custom');
        const format = link.dataset.customFormat;
        if (format === 'film' || format === 'commercial') {
          $('#script-type').value = format;
          if (format === 'film') $('#script-minutes').value = '10';
          $('[data-group="pre"]').open = true;
        }
        calculate();
      }));
      $$('#calculator input, #calculator select').forEach(input => {
        if (input.id === 'package-hours') return;
        input.addEventListener('input', calculate);
        input.addEventListener('change', calculate);
      });
      $('#copy-estimate').addEventListener('click', copyEstimate);
      $('#print-estimate').addEventListener('click', printEstimate);
      $('#reset-calculator').addEventListener('click', resetCalculator);

      // Price catalogue filters and search
      let priceFilter = 'all';
      function filterPrices() {
        const query = $('#price-search-input').value.trim().toLocaleLowerCase('ru');
        let visibleBlocks = 0;
        $$('.price-block').forEach(block => {
          const categoryMatches = priceFilter === 'all' || block.dataset.priceCategory === priceFilter;
          let visibleRows = 0;
          $$('.price-searchable', block).forEach(row => {
            const selectionMatches = !quickOnlySelected || $('.catalog-check', row)?.checked;
            const matches = categoryMatches && selectionMatches && (!query || row.textContent.toLocaleLowerCase('ru').includes(query));
            row.hidden = !matches;
            if (matches) visibleRows += 1;
          });
          block.hidden = !categoryMatches || visibleRows === 0;
          if (query || quickOnlySelected) {
            block.open = !block.hidden;
          } else if (block.dataset.autoOpened === 'true') {
            block.open = false;
            block.dataset.autoOpened = 'false';
          }
          if ((query || quickOnlySelected) && !block.hidden) block.dataset.autoOpened = 'true';
          if (!block.hidden) visibleBlocks += 1;
        });
        $('#price-empty').style.display = visibleBlocks ? 'none' : 'block';
      }
      $$('[data-price-filter]').forEach(button => button.addEventListener('click', () => {
        priceFilter = button.dataset.priceFilter;
        $$('[data-price-filter]').forEach(item => item.classList.toggle('active', item === button));
        filterPrices();
      }));
      $('#price-search-input').addEventListener('input', filterPrices);

      // Quick service selection inside the full price catalogue.
      const quickDefinitions = {
        'Разработка концепции проекта': { kind: 'fixed', price: 5000, unit: 'проект', detail: 'Фиксированная стоимость разработки' },
        'Сценарий + покадровый план: подкаст / интервью': { kind: 'fixed', price: 2000, unit: 'сценарий', detail: 'Структура и тезисы' },
        'Сценарий Reels / Shorts': { kind: 'fixed', price: 2000, unit: 'ролик', from: true, detail: 'Сценарий до 3 минут · минимальная цена' },
        'Сценарий YouTube-видео / промо': { kind: 'script', price: 5000, included: 7, extra: 1000, unit: 'мин', from: true, detail: '7 минут включено, далее 1 000 ₽ / мин' },
        'Сценарий корпоративного или документального фильма': { kind: 'script', price: 10000, included: 10, extra: 500, unit: 'мин', from: true, detail: '10 минут включено, далее 500 ₽ / мин' },
        'Сценарий коммерческой рекламы': { kind: 'fixed', price: 7000, unit: 'сценарий', from: true, detail: 'Минимальная цена по прайсу' },
        'Локейшн-скаутинг': { kind: 'fixed', price: 5000, unit: 'проект', from: true, detail: 'Подбор выездных локаций · минимальная цена' },
        'Поиск реквизита / кастинг актёров': { kind: 'choice', unit: 'услуга', options: [{ label: 'Поиск реквизита', price: 2000, from: true }, { label: 'Кастинг актёров', price: 15000, from: true }] },
        'Составление и юридическое сопровождение договора': { kind: 'fixed', price: 2000, unit: 'договор', from: true, detail: 'Минимальная цена по прайсу' },
        '1 камера + свет': { kind: 'hours2', price: 8000, extra: 2000, unit: 'час', detail: 'Первые 2 часа 8 000 ₽, далее 2 000 ₽ / час' },
        '2 камеры + свет': { kind: 'hours2', price: 10000, extra: 2500, unit: 'час', detail: 'Первые 2 часа 10 000 ₽, далее 2 500 ₽ / час' },
        '3 камеры + свет': { kind: 'hours2', price: 12000, extra: 3000, unit: 'час', detail: 'Первые 2 часа 12 000 ₽, далее 3 000 ₽ / час' },
        'Динамическая съёмка · 1 камера': { kind: 'hours2', price: 10000, extra: 2500, unit: 'час', detail: 'Первые 2 часа 10 000 ₽, далее 2 500 ₽ / час' },
        'Репортажная съёмка со стабилизатора / с рук': { kind: 'hours2', price: 15000, extra: 5000, unit: 'час', detail: 'Первые 2 часа 15 000 ₽, далее 5 000 ₽ / час' },
        'Обычный дрон': { kind: 'unit', price: 10000, unit: 'час', detail: 'Общие планы и панорамы' },
        'FPV-дрон': { kind: 'unit', price: 20000, unit: 'час', detail: 'Динамика и пролёты сквозь объекты' },
        'Петличная система, 1–2 шт.': { kind: 'hours2', price: 1000, extra: 200, unit: 'час', detail: 'Первые 2 часа 1 000 ₽, далее 200 ₽ / час' },
        'Многоканальный рекордер': { kind: 'hours2', price: 500, extra: 100, unit: 'час', detail: 'Первые 2 часа 500 ₽, далее 100 ₽ / час' },
        'Выездной звукооператор': { kind: 'hours2', price: 5000, extra: 1000, unit: 'час', detail: 'Первые 2 часа 5 000 ₽, далее 1 000 ₽ / час' },
        'Подкаст / интервью · 2 человека, 3 камеры': { kind: 'unit', price: 10000, unit: 'час исходника', detail: 'Интеллектуальный монтаж' },
        'Подкаст / интервью · 3 человека, 4 камеры': { kind: 'unit', price: 15000, unit: 'час исходника', detail: 'Интеллектуальный монтаж' },
        'Подкаст / интервью · 4 человека, 5 камер': { kind: 'unit', price: 20000, unit: 'час исходника', detail: 'Интеллектуальный монтаж' },
        'Экспресс-мультикам с помощью нейросетей': { kind: 'unit', price: 3000, unit: 'час исходника', detail: 'Результат в тот же день · без чистки речи · объём и время передачи подтверждаются до заказа' },
        'Клиповый монтаж': { kind: 'unit', price: 5000, unit: 'мин готового видео', step: 0.5, from: true, detail: 'Минимальная цена за минуту готового видео' },
        'Монтаж фильма / шоу': { kind: 'film', price: 2000, extra: 1200, included: 20, unit: 'мин', step: 0.5, detail: 'До 20 минут — 2 000 ₽ / мин, далее — 1 200 ₽ / мин' },
        'Простой монтаж Reels / Shorts': { kind: 'unit', price: 1000, unit: 'ролик', detail: 'Склейка и базовый цвет' },
        'Сложный монтаж Reels / Shorts': { kind: 'unit', price: 1800, unit: 'ролик', from: true, detail: 'Субтитры, SFX и всплывающие картинки · минимальная цена' },
        'Цветокоррекция': { kind: 'unit', price: 1500, unit: 'локация', detail: 'Стоимость за одну локацию' },
        'Художественный грейдинг': { kind: 'unit', price: 3000, unit: 'сцена', detail: 'Расчёт за сцену · покадровый тариф 200–500 ₽ согласуется отдельно' },
        'Простые плашки и титры': { kind: 'titles', unit: 'титр', detail: '2 шт. — 1 500 ₽, каждая следующая — 500 ₽' },
        'Кастомные дизайнерские плашки и титры': { kind: 'unit', price: 5000, unit: 'комплект', detail: 'Дизайнерская разработка' },
        'Кеинг / ротоскопинг': { kind: 'unit', price: 3000, unit: 'сцена', detail: 'Расчёт за сцену · покадровый тариф 500 ₽ согласуется отдельно' },
        'Клинап': { kind: 'unit', price: 500, unit: 'кадр', from: true, detail: 'Удаление лишних объектов · минимальная цена' },
        '2D / 3D-трекинг': { kind: 'choice', unit: 'сцена', options: [{ label: '2D-трекинг', price: 300 }, { label: '3D-трекинг', price: 1000, from: true }] },
        'Интеграция 3D-объекта': { kind: 'unit', price: 5000, unit: 'объект', from: true, detail: 'Минимальная цена по прайсу' },
        'Клиповый саунд-дизайн': { kind: 'unit', price: 3500, unit: 'мин', step: 0.5, detail: 'SFX, шумы и акценты' },
        'Фоновый саунд-дизайн': { kind: 'unit', price: 5000, unit: 'час', step: 0.5, detail: 'Атмосфера и подложки' },
        'Генерация уникальной фоновой музыки': { kind: 'unit', price: 2000, unit: 'трек', detail: 'Генерация через ИИ, без авторских прав' },
        'Разработка YouTube-превью': { kind: 'unit', price: 1000, unit: 'обложка', detail: 'Стоимость одной обложки' },
        'Пакет «Превью A/B-тест»': { kind: 'unit', price: 2000, unit: 'пакет', detail: '3 варианта одной обложки' }
      };

      let quickItems = [];
      let quickOnlySelected = false;
      const quickRow = name => $$('.price-searchable').find(row => row.dataset.service === name);

      function updateQuickEstimate() {
        quickItems = [];
        $$('.price-searchable').forEach(row => {
          const checkbox = $('.catalog-check', row);
          const quantityInput = $('.catalog-qty', row);
          const def = quickDefinitions[row.dataset.service];
          if (!def) return;
          row.classList.toggle('service-selected', checkbox.checked);
          quantityInput.disabled = !checkbox.checked || def.kind === 'fixed';
          quantityInput.title = def.kind === 'fixed' ? 'Фиксированная стоимость за услугу' : 'Изменить количество';
          if (!checkbox.checked) return;
          const quantity = Math.max(def.step || 1, number(quantityInput.value) || 1);
          let amount = 0;
          let label = row.dataset.service;
          let detail = '';
          let from = Boolean(def.from);
          if (def.kind === 'fixed') {
            amount = def.price;
            detail = def.detail;
          } else if (def.kind === 'unit') {
            amount = quantity * def.price;
            detail = `${qtyText(quantity)} ${def.unit} × ${money(def.price)} · ${def.detail}`;
          } else if (def.kind === 'hours2') {
            const hours = Math.max(2, quantity);
            const extension = Math.max(0, hours - 2);
            amount = def.price + extension * def.extra;
            detail = `${money(def.price)} за первые 2 ч + ${qtyText(extension)} ч × ${money(def.extra)}`;
          } else if (def.kind === 'script') {
            const minutes = Math.max(def.included, quantity);
            amount = def.price + Math.max(0, minutes - def.included) * def.extra;
            detail = `${qtyText(minutes)} мин · ${money(def.price)} + ${qtyText(Math.max(0, minutes - def.included))} доп. мин × ${money(def.extra)}`;
          } else if (def.kind === 'film') {
            const first = Math.min(def.included, quantity);
            const next = Math.max(0, quantity - def.included);
            amount = first * def.price + next * def.extra;
            detail = `${qtyText(first)} мин × ${money(def.price)} + ${qtyText(next)} мин × ${money(def.extra)}`;
          } else if (def.kind === 'titles') {
            amount = 1500 + Math.max(0, quantity - 2) * 500;
            detail = `${qtyText(quantity)} шт. · 2 шт. за 1 500 ₽, далее 500 ₽ / шт.`;
          } else if (def.kind === 'choice') {
            const select = $('.catalog-choice', row);
            const option = def.options[Number(select.value) || 0];
            amount = option.price * quantity;
            label = option.label;
            from = Boolean(option.from);
            detail = `${qtyText(quantity)} ${def.unit} × ${money(option.price)}${from ? ' · минимальная цена' : ''}`;
          }
          quickItems.push({ label, amount, detail, from, id: checkbox.id });
        });

        const total = quickItems.reduce((sum, item) => sum + item.amount, 0);
        const hasFrom = quickItems.some(item => item.from);
        const panel = $('#quick-estimate');
        panel.classList.toggle('has-items', quickItems.length > 0);
        panel.classList.toggle('has-from', hasFrom);
        $('#quick-estimate-total').textContent = money(total);
        $('#quick-estimate-count').textContent = quickItems.length ? `${quickItems.length} ${plural(quickItems.length, ['услуга', 'услуги', 'услуг'])} · без наценок и спецусловий` : 'Пока ничего не выбрано';
        $('#quick-estimate-lines').innerHTML = quickItems.map(item => `<div class="quick-line"><div><strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(item.detail)}</small></div><span>${item.from ? 'от ' : ''}${money(item.amount)}</span></div>`).join('');
        const note = $('#quick-estimate-note');
        note.classList.toggle('has-from', hasFrom);
        note.textContent = hasFrom ? 'В подборе есть позиции «от» — использованы минимальные цены. Финальная смета уточняется после брифа. Наценки и спецусловия сюда не включены.' : 'Итог включает только отмеченные услуги. Пакеты, продюсирование, Fast Track, хранение и рендер рассчитываются отдельно в основном калькуляторе выше.';

        $$('.price-block').forEach(block => {
          if ($$('.catalog-check:checked', block).length) block.open = true;
          const selected = $$('.catalog-check:checked', block).length;
          let badge = $('.price-selected-count', block);
          if (selected && !badge) {
            badge = document.createElement('span');
            badge.className = 'price-selected-count';
            $('.price-block-head', block).insertBefore(badge, $('.price-accordion-icon', block));
          }
          if (badge) {
            badge.hidden = !selected;
            badge.textContent = `Выбрано: ${selected}`;
          }
        });
        updateQuickMobileBar(total, hasFrom);
      }

      function updateQuickMobileBar(total, hasFrom) {
        let bar = $('.quick-mobile-bar');
        if (!bar && quickItems.length && window.innerWidth <= 650) {
          bar = document.createElement('button');
          bar.type = 'button';
          bar.className = 'quick-mobile-bar';
          bar.addEventListener('click', () => $('#quick-estimate').scrollIntoView({ behavior: 'smooth', block: 'center' }));
          document.body.appendChild(bar);
        }
        if (bar) {
          const priceRect = $('#price').getBoundingClientRect();
          bar.hidden = !quickItems.length || window.innerWidth > 650 || priceRect.bottom < 100 || priceRect.top > window.innerHeight;
          bar.innerHTML = `<span>${quickItems.length} ${plural(quickItems.length, ['услуга', 'услуги', 'услуг'])}</span><strong>${hasFrom ? 'от ' : ''}${money(total)} <i>→</i></strong>`;
        }
      }

      function quickText() {
        const total = quickItems.reduce((sum, item) => sum + item.amount, 0);
        const hasFrom = quickItems.some(item => item.from);
        const lines = ['VOLNA FILM · ПРЕДВАРИТЕЛЬНЫЙ ПОДБОР УСЛУГ', `Дата: ${new Date().toLocaleDateString('ru-RU')}`, ''];
        quickItems.forEach((item, index) => lines.push(`${index + 1}. ${item.label} — ${item.detail} — ${item.from ? 'от ' : ''}${money(item.amount)}`));
        lines.push('', `${hasFrom ? 'ОРИЕНТИРОВОЧНЫЙ ИТОГ: от ' : 'ИТОГО: '}${money(total)}`);
        lines.push('Без пакетов, наценок и спецусловий. Предварительный расчёт, не публичная оферта.');
        if (hasFrom) lines.push('Позиции «от» рассчитаны по минимальной цене прайса и требуют уточнения.');
        return lines.join('\n');
      }

      $$('.price-searchable').forEach(row => {
        const def = quickDefinitions[row.dataset.service];
        if (!def) return;
        const checkbox = $('.catalog-check', row);
        const qty = $('.catalog-qty', row);
        qty.min = String(def.kind === 'hours2' ? 2 : (def.step || 1));
        qty.step = String(def.step || 1);
        if (def.kind === 'hours2') qty.value = '2';
        if (def.kind === 'script') qty.value = String(def.included);
        $('.catalog-unit', row).textContent = def.unit;
        if (def.kind === 'choice') {
          const choice = document.createElement('select');
          choice.className = 'catalog-choice';
          choice.setAttribute('aria-label', `Вариант услуги: ${row.dataset.service}`);
          choice.innerHTML = def.options.map((option, index) => `<option value="${index}">${escapeHTML(option.label)} · ${option.from ? 'от ' : ''}${money(option.price)}</option>`).join('');
          $('.catalog-select', row).appendChild(choice);
          choice.disabled = true;
          choice.addEventListener('change', updateQuickEstimate);
          checkbox.addEventListener('change', () => { choice.disabled = !checkbox.checked; });
        }
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) row.closest('.price-block').open = true;
          if (quickOnlySelected) filterPrices();
          updateQuickEstimate();
        });
        qty.addEventListener('input', updateQuickEstimate);
        qty.addEventListener('change', () => {
          if (number(qty.value) < number(qty.min)) qty.value = qty.min;
          updateQuickEstimate();
        });
      });

      async function copyQuickSelection() {
        if (!quickItems.length) { toast('Сначала отметьте нужные услуги'); return; }
        const text = quickText();
        try {
          await navigator.clipboard.writeText(text);
          toast('Подбор услуг скопирован');
        } catch (error) {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
          toast('Подбор услуг скопирован');
        }
      }
      $('#quick-copy').addEventListener('click', copyQuickSelection);
      $('#quick-reset').addEventListener('click', () => {
        $$('.catalog-check').forEach(input => { input.checked = false; });
        $$('.catalog-qty').forEach(input => {
          const def = quickDefinitions[input.closest('tr').dataset.service];
          input.value = def.kind === 'hours2' ? '2' : (def.kind === 'script' ? String(def.included) : String(def.step || 1));
        });
        quickOnlySelected = false;
        $('#quick-show').textContent = 'Показать выбранное';
        updateQuickEstimate();
        filterPrices();
        toast('Подбор услуг очищен');
      });
      $('#quick-show').addEventListener('click', () => {
        if (!quickItems.length) { toast('Сначала отметьте нужные услуги'); return; }
        quickOnlySelected = !quickOnlySelected;
        $('#quick-show').textContent = quickOnlySelected ? 'Показать весь прайс' : 'Показать выбранное';
        filterPrices();
        $('#price').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      window.addEventListener('scroll', () => {
        if (quickItems.length) updateQuickMobileBar(quickItems.reduce((sum, item) => sum + item.amount, 0), quickItems.some(item => item.from));
      }, { passive: true });
      window.addEventListener('resize', () => {
        if (quickItems.length) updateQuickMobileBar(quickItems.reduce((sum, item) => sum + item.amount, 0), quickItems.some(item => item.from));
      });
      const initialPriceBlock = $('.price-block');
      if (initialPriceBlock) initialPriceBlock.open = true;
      updateQuickEstimate();

      // Navigation, reveal and reading progress
      $('#menu-button').addEventListener('click', () => {
        const open = $('#main-nav').classList.toggle('open');
        $('#menu-button').setAttribute('aria-expanded', String(open));
      });
      $$('#main-nav a').forEach(link => link.addEventListener('click', () => {
        $('#main-nav').classList.remove('open');
        $('#menu-button').setAttribute('aria-expanded', 'false');
      }));
      const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: .08 }) : null;
      $$('.reveal').forEach(el => revealObserver ? revealObserver.observe(el) : el.classList.add('visible'));
            function updateProgress() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        $('#scroll-progress').style.width = `${max > 0 ? window.scrollY / max * 100 : 0}%`;
      }
      window.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('resize', updateProgress);


// Заполнить перед публикацией: контакты продюсера и город. Пустые значения не имитируют отправку.
const studio={producer:'',city:'Новосибирск',email:'',phone:'',tg:'https://t.me/Egmarch'};
// Куда уходят заявки (email хранится только в сервисе рассылки и на сайте нигде не показывается).
// web3formsKey — ключ с web3forms.com (приходит на вашу почту); tgBotToken/tgChatId — бот в Telegram для уведомлений.
const FORM={endpoint:'https://volna-leads.marchen.workers.dev',web3formsKey:'246fd5d1-07e1-4796-921d-62bdc22d6393'};
function studioLine(){return ['VOLNA film',studio.city,studio.producer,studio.phone].filter(Boolean).join(' · ')}
$('#identity').textContent=studioLine();$('#recipient-note').textContent='Продюсер свяжется с вами по указанному контакту.';
/* ===== Заявка: общий диалог с контекстом (кейс / пакет) ===== */
let attached='',leadCtx=null,lastLeadKey='';
const LEAD_DEFAULT={taskLabel:'Что зритель должен понять или сделать?',taskHint:'Например, понять, чем наша технология отличается от аналогов',placeLabel:'Город, площадка и желаемая дата',placeHint:'Например, съёмка в цехе к отраслевой выставке',format:'Другой проект'};
function buildBrief(){
  const L=[studioLine(),'Запрос предложения: '+$('#req-format').value];
  if(leadCtx){
    const isPkg=leadCtx.kind==='package';
    L.push([(isPkg?'Выбранный пакет: «':'Выбранная работа: «')+leadCtx.title+'»'+(leadCtx.detail?' — '+leadCtx.detail:''),'Тип проекта: '+leadCtx.type,'ID: '+leadCtx.id].join('\n'));
  }
  L.push('Задача: '+($('#req-task').value||'уточнить'),'Место и сроки: '+($('#req-place').value||'уточнить'),'Контакт: '+($('#req-contact').value||'не указан'),attached);
  return L.filter(Boolean).join('\n\n');
}
const leadDlg=$('#lead-dialog');
function setAttachment(text){attached=text||'';$('#attach-text').textContent=attached;$('#attachment').hidden=!attached}
function openLead(o){
  o=o||{};
  leadCtx=o.ctx||null;
  const key=leadCtx?leadCtx.id:'general';
  if(key!==lastLeadKey){$('#req-task').value='';$('#req-place').value=''}
  lastLeadKey=key;
  const c=leadCtx||{};
  const sel=$('#lead-selected'),q=$('#lead-question');
  sel.hidden=!leadCtx;
  if(leadCtx){
    $('#lead-selected-kind').textContent=leadCtx.kind==='package'?'Вы выбрали пакет':'Вы выбрали работу';
    $('#lead-selected-title').textContent='«'+leadCtx.title+'»';
  }
  q.hidden=!c.question;q.textContent=c.question||'';
  $('#lead-title').textContent=leadCtx?(leadCtx.kind==='package'?'Обсудим этот пакет':'Обсудим ваш проект'):'Расскажите о задаче';
  $('#req-task-label').textContent=c.taskLabel||LEAD_DEFAULT.taskLabel;
  $('#req-task').placeholder=c.taskHint||LEAD_DEFAULT.taskHint;
  $('#req-place-label').textContent=c.placeLabel||LEAD_DEFAULT.placeLabel;
  $('#req-place').placeholder=c.placeHint||LEAD_DEFAULT.placeHint;
  const fmt=o.format||c.format||LEAD_DEFAULT.format;
  const sf=$('#req-format');if([...sf.options].some(x=>x.value===fmt||x.text===fmt))sf.value=fmt;
  setAttachment(o.attach);
  if(!leadDlg.open){
    if(typeof leadDlg.showModal==='function')leadDlg.showModal();else leadDlg.setAttribute('open','');
    document.documentElement.classList.add('lead-open');
  }
}
function closeLead(){
  if(typeof leadDlg.close==='function'&&leadDlg.open)leadDlg.close();else leadDlg.removeAttribute('open');
  onLeadClosed();
}
function onLeadClosed(){
  document.documentElement.classList.remove('lead-open');
  leadCtx=null;attached='';$('#lead-selected').hidden=true;$('#lead-question').hidden=true;$('#attachment').hidden=true;
}
leadDlg.addEventListener('close',onLeadClosed);
leadDlg.addEventListener('click',e=>{if(e.target===leadDlg)closeLead()});
$('#lead-close').onclick=closeLead;
$('#lead-clear').onclick=()=>openLead({});
$('#detach').onclick=()=>setAttachment('');
function ctxFromButton(t){
  const d=t.dataset;
  if(d.leadCase)return{ctx:{kind:'case',id:d.leadCase,title:d.title,type:d.type,question:d.question,taskLabel:d.taskLabel,taskHint:d.taskHint,placeLabel:d.placeLabel,placeHint:d.placeHint,format:d.format}};
  if(d.leadPackage){
    let detail=d.detail||'';
    if(d.leadPackage==='expert'){const h=expertHoursSel;detail=h+' '+(h===1?'час':'часа')+' записи, '+money(expertPrices[h]);}
    return{ctx:{kind:'package',id:'pkg-'+d.leadPackage,title:d.title,type:'Подкаст / Shorts (готовый пакет)',detail,format:'Экспертный контент',question:'Вы выбрали пакет «'+d.title+'». Расскажите, о чём будет подкаст или серия видео и для кого.',taskLabel:'О чём подкаст или серия видео',taskHint:'Например: эксперт в своей нише, нужен регулярный выпуск',placeLabel:'Город и желаемая дата записи',placeHint:'Например: Новосибирск, в ближайшие две недели'}};
  }
  return{format:d.request};
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-lead],[data-lead-case],[data-lead-package],[data-request],[data-attach],a[href="#brief"]');
  if(!t)return;
  e.preventDefault();
  const o=ctxFromButton(t);
  if(t.dataset.attach){
    const isQuick=t.dataset.attach==='quick';
    if(isQuick?!quickItems.length:!currentEstimate.items.length){toast('Сначала выберите услуги');return}
    o.attach=isQuick?quickText():estimateText();
  }
  openLead(o);
});
$('#make-email').onclick=async()=>{
  const c=$('#req-contact').value.trim();
  if(!c){toast('Укажите контакт для ответа');$('#req-contact').focus();return}
  const text=buildBrief();const btn=$('#make-email');btn.disabled=true;
  const jobs=[];
  if(FORM.endpoint){jobs.push(fetch(FORM.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Заявка с сайта\n\n'+text})}).then(r=>r.ok))}
  if(FORM.web3formsKey){const fd=new FormData();fd.append('access_key',FORM.web3formsKey);fd.append('subject','VOLNA film — новая заявка'+(leadCtx?' · '+leadCtx.title:''));fd.append('from_name','Сайт VOLNA film');fd.append('message',text);jobs.push(fetch('https://api.web3forms.com/submit',{method:'POST',body:fd}).then(r=>r.json().then(j=>r.ok&&j.success!==false).catch(()=>r.ok)))}
  const res=await Promise.allSettled(jobs);
  const ok=res.some(r=>r.status==='fulfilled'&&r.value===true);
  btn.disabled=false;
  if(ok){toast('Заявка отправлена — продюсер свяжется с вами');$('#req-task').value='';$('#req-place').value='';lastLeadKey='';closeLead();return}
  try{await navigator.clipboard.writeText(text)}catch(e){}
  window.open(studio.tg+'?text='+encodeURIComponent(text),'_blank','noopener');
  toast('Не удалось отправить автоматически — открываем Telegram, текст скопирован');
};
$('#save-brief').onclick=()=>{let url=URL.createObjectURL(new Blob(['﻿'+buildBrief()],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='VOLNA-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)};

/* кнопка «Обсудить» в каждой карточке полного портфолио (контекст — только название и тип работы) */
$$('#workpage .caseunit').forEach(card=>{
  const stage=$('.video-stage',card),body=$('.casebody',card);if(!stage||!body||$('[data-lead-case]',card))return;
  const title=(stage.dataset.ytTitle||'').trim(),sec=card.closest('.vf-section')?.querySelector('h2')?.textContent.trim()||'Портфолио';
  const b=document.createElement('button');b.type='button';b.className='btn btn-outline case-ask';b.textContent='Хочу такой же проект';
  b.dataset.leadCase='vk-'+(stage.dataset.vk||title).replace(/[^0-9a-z_-]/gi,'');b.dataset.title=title;b.dataset.type=sec;b.dataset.format=/Реклама/.test(sec)?'Реклама':/событ/i.test(sec)?'Съёмка мероприятия':'Фильм';
  b.dataset.question='Вам понравилась работа «'+title+'». Расскажите, что хотите снять вы.';
  const w=document.createElement('div');w.className='case-actions';w.appendChild(b);body.appendChild(w);
});

/* число работ — из данных портфолио */
const worksN=$$('#workpage .video-stage').length;
const worksWord=n=>{const a=n%10,b=n%100;return a===1&&b!==11?'работа':a>=2&&a<=4&&(b<12||b>14)?'работы':'работ'};
if(worksN){
  $$('[data-works-count]').forEach(el=>el.textContent=worksN+' '+worksWord(worksN)+' в портфолио');
  $$('[data-works-link]').forEach(el=>el.textContent=(el.classList.contains('btn-accent')?'Все ':'Все ')+worksN+' '+worksWord(worksN)+' в портфолио '+(el.classList.contains('btn-accent')?'→':'↗'));
}

const OWN={home:['top','cases','formats','faq','portfolio','portfolio-shorts','more-paths'],podcast:['packages','example','outputs','podcast-how','podcast-top'],youtube:['yt-cases','yt-business','yt-packages','yt-request','youtube-top'],smeta:['process','calculator','price','quick-estimate','smeta-top']};
const PAGE_URL={home:ROOT||'./',podcast:ROOT+'podcast/',youtube:ROOT+'youtube/',smeta:ROOT+'smeta/'};
const PAGE_TITLE={home:document.title};
let lastView='';
function route(){
  let h='';try{h=decodeURIComponent(location.hash.slice(1))}catch(e){h=location.hash.slice(1)}
  if(h==='brief'){history.replaceState(null,'',location.pathname+location.search);h='';openLead({})}
  // старые ссылки (до разделения на страницы): якорь ведёт на страницу, где теперь лежит содержимое
  const own=Object.keys(OWN).find(k=>OWN[k].includes(h));
  if(own&&own!==PAGE){location.replace(PAGE_URL[own]+'#'+h);return}
  const port=PAGE==='home'&&(h==='portfolio'||h==='portfolio-shorts');
  document.documentElement.classList.toggle('pf-active',port);
  $('#top').hidden=PAGE!=='home'||port;$('#workpage').hidden=!port;
  $('#podcastpage').hidden=PAGE!=='podcast';$('#youtubepage').hidden=PAGE!=='youtube';$('#smetapage').hidden=PAGE!=='smeta';
  document.title=port?'Портфолио — VOLNA film':PAGE_TITLE.home;
  const navKey=port?'portfolio':PAGE==='podcast'||PAGE==='youtube'||PAGE==='smeta'?PAGE:h==='faq'?'faq':'';
  $$('#main-nav a[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===navKey));
  if(h==='calculator')openCalc();
  const view=PAGE+(port?':work':'');
  const changed=view!==lastView;lastView=view;
  requestAnimationFrame(()=>{
    const el=h&&!port&&h!=='top'?document.getElementById(h):null;
    if(el)el.scrollIntoView({behavior:'instant'});
    else if(port||h==='top'||changed&&!h)window.scrollTo({top:0,behavior:'instant'});
  });
}
function openCalc(){const d=document.getElementById('calc-details');if(d)d.open=true}
(function(){const v=document.getElementById('estimate-total-value'),o=document.getElementById('calc-sum');
if(v&&o){const u=()=>{o.textContent=v.textContent};u();new MutationObserver(u).observe(v,{childList:true,characterData:true,subtree:true})}
document.querySelectorAll('a[href="#calculator"]').forEach(a=>a.addEventListener('click',openCalc))})();
window.addEventListener('hashchange',route);route();


// Inline-плеер по клику: VK Видео (если указан data-vk), иначе YouTube
$$('.video-stage').forEach(stage => {
  const btn = $('.video-play-btn', stage);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const title = stage.dataset.ytTitle || 'Видео проекта VOLNA film';
    if (location.protocol === 'file:' && stage.dataset.vk) { window.open('https://vkvideo.ru/video' + stage.dataset.vk, '_blank', 'noopener'); return; }
    if (location.protocol === 'file:' && stage.dataset.ytId) { window.open('https://youtu.be/' + stage.dataset.ytId, '_blank', 'noopener'); return; } // VK не встраивается на страницах с диска
    let src;
    if (stage.dataset.vk) {
      const [oid, id] = stage.dataset.vk.split('_');
      src = `https://vkvideo.ru/video_ext.php?oid=${encodeURIComponent(oid)}&id=${encodeURIComponent(id)}&hd=2&autoplay=1`;
    } else {
      src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(stage.dataset.ytId)}?autoplay=1&rel=0`;
    }
    stage.innerHTML = `<iframe src="${src}" title="${escapeHTML(title)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock; accelerometer; gyroscope; clipboard-write; web-share" allowfullscreen></iframe>`;
  });
});

// Download / Print B2B Presentation KP with key rates & cases
$$('[data-kp]').forEach(kpBtn => {
  kpBtn.addEventListener('click', () => {
    const date = new Date().toLocaleDateString('ru-RU');
    const logoSrc = $('.brand-symbol')?.getAttribute('src') || '';
    $('#print-area').innerHTML = `
      <div class="print-brand"><img style="width:100px;height:auto" alt="VOLNA" src="${ROOT}assets/img-92fe70ae1b.png"></div>
      <div class="print-head">
        <div>
          <h1>Презентация и базовый прайс для B2B</h1>
          <p>Видеопродакшен полного цикла · Девелопмент, промышленность, госсектор, корпоративный контент</p>
        </div>
        <p>Дата: ${date}</p>
      </div>
      <div class="print-total">
        <span>Формат работы с юридическими лицами и госзаказчиками</span>
        <strong style="font-size:16pt">Договор и ЭДО · 100% прав заказчику · Фиксированная смета до съёмки</strong>
      </div>
      <h3 style="margin:14px 0 6px;font-size:12pt">Готовые пакетные решения</h3>
      <table class="print-table">
        <thead><tr><th>Пакет</th><th>Что входит</th><th>Стоимость</th></tr></thead>
        <tbody>
          <tr><td>Подкаст Эксперта</td><td>Студия (1/2/3 ч записи + 30 минут подготовки), 3 камеры, свет, звук; 1 ч — экспресс-монтаж и превью; 2–3 ч — монтаж, 5 Shorts, обложка</td><td>20 000 / 35 000 / 47 000 ₽</td></tr>
          <tr><td>Экспертный контент на месяц</td><td>4 выпуска на студии, 15 Shorts/Reels, 4 обложки, темы, структура, ресайзы</td><td>85 000 ₽ / мес.</td></tr>
          <tr><td>30 коротких видео с экспертом</td><td>1 смена до 4 ч, сценарии, съёмка, чистка речи, субтитры, SEO-описания</td><td>50 000 ₽</td></tr>
          <tr><td>Корпоративные фильмы и реклама</td><td>Сценарий, выезд в цех / на стройку, аэросъёмка, 3D-инфографика, VFX, грейдинг</td><td>По смете / конструктору</td></tr>
        </tbody>
      </table>
      <h3 style="margin:16px 0 6px;font-size:12pt">Реализованные проекты (примеры)</h3>
      <table class="print-table">
        <thead><tr><th>Заказчик / сфера</th><th>Решённая задача</th><th>Ссылка</th></tr></thead>
        <tbody>
          <tr><td>Сити-квартал «Инские холмы»</td><td>Имиджевый фильм о деловой среде и резидентах для девелопера</td><td>vkvideo.ru/video-240438229_456239021</td></tr>
          <tr><td>Завод «ПРО МК»</td><td>Производственная видеопрезентация цеха и объектов металлоконструкций</td><td>vkvideo.ru/video-240438229_456239019</td></tr>
          <tr><td>«Сибирский Экспедитор»</td><td>Продуктовый 3D-ролик о сборной реф-логистике с экономией до 20%</td><td>vkvideo.ru/video-240438229_456239026</td></tr>
          <tr><td>Отель MIROTEL</td><td>Игровой имиджевый ролик с VFX и креативным сценарием</td><td>vkvideo.ru/video-240438229_456239044</td></tr>
        </tbody>
      </table>
      <div class="print-note">
        <p>Опыт работы с застройщиками, производственными предприятиями, Министерством природных ресурсов и Министерством экономического развития НСО.</p>
        <p>${escapeHTML(studioLine())} · Предварительное КП, не является публичной офертой.</p>
      </div>`;
    window.print();
  });
});

      calculate();
      if (PAGE === 'smeta') {
        const q = new URLSearchParams(location.search), pk = q.get('package');
        if (['expert', 'monthly', 'shorts'].includes(pk)) setTimeout(() => choosePackage(pk, q.get('hours')), 0);
      }
      updateProgress();
    })();
  