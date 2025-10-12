// Simple screen navigation and fake ad playback
const screens = {
  welcome: document.getElementById('screen-welcome'),
  start: document.getElementById('screen-start'),
  thanks: document.getElementById('screen-thanks'),
}

function showScreen(name){
  Object.values(screens).forEach(s=>s.classList.remove('active'));
  screens[name].classList.add('active');
}

document.getElementById('btn-next').addEventListener('click', ()=>{
  showScreen('start');
});

document.getElementById('btn-back').addEventListener('click', ()=>{
  showScreen('welcome');
});

const btnStart = document.getElementById('btn-start-ad');
const adStatus = document.getElementById('ad-status');
btnStart.addEventListener('click', async ()=>{
  btnStart.disabled = true;
  adStatus.textContent = 'Loading ad...';

  // Simulate loading time
  await new Promise(r=>setTimeout(r, 1200));
  adStatus.textContent = 'Playing ad — please wait';

  // Simulate ad duration
  await new Promise(r=>setTimeout(r, 4000));
  adStatus.textContent = 'Ad finished! You earned 10 points.';

  // small celebration
  setTimeout(()=>{
    showScreen('thanks');
    btnStart.disabled = false;
    adStatus.textContent = '';
  }, 1000);
});
