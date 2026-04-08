// Intersection Observer for Scroll Reveals
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active')
    }
  })
}, observerOptions)

document.addEventListener('DOMContentLoaded', () => {
  // Observe all reveal elements
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

  // Mouse tracking for feature cards (Linear style glow)
  const cards = document.querySelectorAll('.feature-card')
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      card.style.setProperty('--mouse-x', `${x}px`)
      card.style.setProperty('--mouse-y', `${y}px`)
    })
  })

  // Hero Terminal Typing Animation
  document.querySelectorAll('.terminal-line').forEach((line, i) => {
    setTimeout(() => {
      line.classList.remove('hidden')
    }, 500 + (i * 1000))
  })
})

// Tab Switching Logic
function switchTab(clientId) {
  // Buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active')
    if (btn.getAttribute('onclick').includes(clientId)) {
      btn.classList.add('active')
    }
  })
  
  // Content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden')
  })
  document.getElementById(`tab-${clientId}`).classList.remove('hidden')
}

// Copy to Clipboard
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    const btn = event.target || document.querySelector('.copy-small')
    const originalText = btn.innerText
    btn.innerText = 'Copied!'
    setTimeout(() => {
      btn.innerText = originalText
    }, 2000)
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}
