const input = document.getElementById('wordInput');
const applyBtn = document.getElementById('applyBtn');
const playground = document.getElementById('playground');

applyBtn.addEventListener('click', renderWord);
input.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') renderWord();
});

function renderWord() {
  const text = input.value;
  playground.innerHTML = '';
  if (!text.length) return;

  const startX = 10;
  const startY = 10;
  const step = 30;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const box = document.createElement('div');
    box.className = 'letter';
    box.textContent = ch === ' ' ? ' ' : ch;
    box.style.left = (startX + i * step) + 'px';
    box.style.top = startY + 'px';
    playground.appendChild(box);
  }
}

let dragMode = null;
let dragTarget = null;
const startPositions = new Map();
let pressX = 0;
let pressY = 0;

let rubberBox = null;
let rubberX = 0;
let rubberY = 0;

playground.addEventListener('mousedown', function (e) {
  const letterEl = e.target.closest('.letter');
  pressX = e.clientX;
  pressY = e.clientY;

  if (letterEl) {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      letterEl.classList.toggle('selected');
      dragMode = null;
      return;
    }

    if (letterEl.classList.contains('selected')) {
      dragMode = 'group';
      startPositions.clear();
      const selected = playground.querySelectorAll('.letter.selected');
      for (let i = 0; i < selected.length; i++) {
        const el = selected[i];
        startPositions.set(el, { left: parseFloat(el.style.left), top: parseFloat(el.style.top) });
      }
    } else {
      clearSelection();
      dragMode = 'single';
      dragTarget = letterEl;
      startPositions.clear();
      startPositions.set(letterEl, { left: parseFloat(letterEl.style.left), top: parseFloat(letterEl.style.top) });
    }
    return;
  }

  e.preventDefault();
  clearSelection();
  dragMode = 'rubber';

  const rect = playground.getBoundingClientRect();
  rubberX = e.clientX - rect.left;
  rubberY = e.clientY - rect.top;

  rubberBox = document.createElement('div');
  rubberBox.className = 'sel-box';
  rubberBox.style.left = rubberX + 'px';
  rubberBox.style.top = rubberY + 'px';
  rubberBox.style.width = '0px';
  rubberBox.style.height = '0px';
  playground.appendChild(rubberBox);
});

document.addEventListener('mousemove', function (e) {
  if (!dragMode) return;

  const dx = e.clientX - pressX;
  const dy = e.clientY - pressY;

  if (dragMode === 'single' || dragMode === 'group') {
    startPositions.forEach(function (pos, el) {
      el.style.left = (pos.left + dx) + 'px';
      el.style.top = (pos.top + dy) + 'px';
      el.classList.add('dragging');
    });
    return;
  }

  if (dragMode === 'rubber') {
    const rect = playground.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const left = Math.min(curX, rubberX);
    const top = Math.min(curY, rubberY);
    const width = Math.abs(curX - rubberX);
    const height = Math.abs(curY - rubberY);

    rubberBox.style.left = left + 'px';
    rubberBox.style.top = top + 'px';
    rubberBox.style.width = width + 'px';
    rubberBox.style.height = height + 'px';

    const boxRight = left + width;
    const boxBottom = top + height;

    const letters = playground.querySelectorAll('.letter');
    for (let i = 0; i < letters.length; i++) {
      const el = letters[i];
      const elLeft = parseFloat(el.style.left);
      const elTop = parseFloat(el.style.top);
      const elRight = elLeft + el.offsetWidth;
      const elBottom = elTop + el.offsetHeight;

      const hit = elLeft < boxRight && elRight > left && elTop < boxBottom && elBottom > top;
      el.classList.toggle('selected', hit);
    }
  }
});

document.addEventListener('mouseup', function () {
  if (dragMode === 'single' || dragMode === 'group') {
    startPositions.forEach(function (pos, el) {
      el.classList.remove('dragging');
      swapIfOverlapping(el, pos);
    });
  } else if (dragMode === 'rubber' && rubberBox) {
    rubberBox.remove();
    rubberBox = null;
  }

  dragMode = null;
  dragTarget = null;
  startPositions.clear();
});

function swapIfOverlapping(movedEl, originalPos) {
  const left = parseFloat(movedEl.style.left);
  const top = parseFloat(movedEl.style.top);
  const w = movedEl.offsetWidth;
  const h = movedEl.offsetHeight;

  let best = null;
  let bestArea = 0;

  const letters = playground.querySelectorAll('.letter');
  for (let i = 0; i < letters.length; i++) {
    const el = letters[i];
    if (el === movedEl) continue;

    const elLeft = parseFloat(el.style.left);
    const elTop = parseFloat(el.style.top);
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;

    const overlapX = Math.min(left + w, elLeft + elW) - Math.max(left, elLeft);
    const overlapY = Math.min(top + h, elTop + elH) - Math.max(top, elTop);

    if (overlapX > 0 && overlapY > 0) {
      const area = overlapX * overlapY;
      if (area > bestArea) {
        bestArea = area;
        best = { el: el, left: elLeft, top: elTop };
      }
    }
  }

  if (best) {
    best.el.style.left = originalPos.left + 'px';
    best.el.style.top = originalPos.top + 'px';
    movedEl.style.left = best.left + 'px';
    movedEl.style.top = best.top + 'px';
  }
}

function clearSelection() {
  const selected = playground.querySelectorAll('.letter.selected');
  for (let i = 0; i < selected.length; i++) {
    selected[i].classList.remove('selected');
  }
}
