const displayMain = document.getElementById('display-main');
const displaySub = document.getElementById('display-sub');
const keyboard = document.getElementById('keyboard');

function add(a, b) {
  return a + b;
}

let text = '0';

function show() {
  displayMain.textContent = text;
}

for (let n = 0; n <= 9; n += 1) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'key key--normal';
  button.textContent = String(n);
  button.addEventListener('click', () => {
    text = text === '0' ? String(n) : text + n;
    show();
  });
  keyboard.appendChild(button);
}

show();
