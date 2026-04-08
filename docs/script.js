// Terminal Animation
document.addEventListener('DOMContentLoaded', () => {
  const cmdElem = document.getElementById('cmd-1');
  const cursorElem = document.getElementById('cursor-1');
  const outElem = document.getElementById('term-out-1');
  const fullText = "npx gmail-mcp-server setup";
  
  let i = 0;
  
  function typeWriter() {
    if (i < fullText.length) {
      cmdElem.innerHTML += fullText.charAt(i);
      i++;
      setTimeout(typeWriter, 50 + Math.random() * 50);
    } else {
      setTimeout(() => {
        cursorElem.style.display = 'none';
        outElem.classList.remove('hidden');
      }, 500);
    }
  }
  
  setTimeout(typeWriter, 1000);
});

// Copy button
function copyInstall() {
  const text = "npx gmail-mcp-server setup";
  navigator.clipboard.writeText(text);
  
  const span = document.getElementById('copy-text');
  const oldText = span.innerText;
  span.innerText = "Copied!";
  
  setTimeout(() => {
    span.innerText = oldText;
  }, 2000);
}

function copyText(text) {
  navigator.clipboard.writeText(text);
}

// Tabs
function switchTab(tabId) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  document.getElementById('tab-' + tabId).classList.remove('hidden');
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
