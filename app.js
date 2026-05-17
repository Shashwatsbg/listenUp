// Mock AI Curated News Articles
const articles = [
    {
        title: "New AI Breakthrough in Accessibility",
        content: "Researchers have announced a new artificial intelligence system designed to provide real-time audio descriptions of the environment for the visually impaired. Early tests show remarkable accuracy and speed, potentially replacing traditional navigation aids."
    },
    {
        title: "Global Tech Summit 2026 Focuses on Inclusion",
        content: "At the 2026 Global Tech Summit in Geneva, keynotes heavily emphasized making technology accessible to everyone. Major companies pledged new resources to develop advanced screen readers, tactile feedback devices, and affordable braille displays."
    },
    {
        title: "Weather Update: Sunny Skies Expected All Week",
        content: "For those planning outdoor activities, you are in luck. Meteorologists predict clear, sunny skies and mild temperatures for the entire week across the region. No rain is expected until at least next Monday."
    },
    {
        title: "Local Library Expands Audio Book Collection",
        content: "The City Library has just added over ten thousand new titles to its free audio book collection. The new additions focus heavily on classic literature, modern science fiction, and educational podcasts."
    }
];

let currentArticleIndex = 0;
let synth = window.speechSynthesis;
let utterance = null;
let isPlaying = false;
let voices = [];

// DOM Elements
const titleEl = document.getElementById('article-title');
const contentEl = document.getElementById('article-content');
const progressEl = document.getElementById('article-progress');
const statusText = document.getElementById('status-text');
const btnPlayPause = document.getElementById('btn-play-pause');
const playPauseIcon = document.getElementById('play-pause-icon');
const playPauseText = document.getElementById('play-pause-text');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const btnStop = document.getElementById('btn-stop');
const voiceSelect = document.getElementById('voice-select');
const rateRange = document.getElementById('rate-range');
const rateValue = document.getElementById('rate-value');

// Initialize voices
function populateVoiceList() {
    voices = synth.getVoices();
    voiceSelect.innerHTML = '';
    
    // Prioritize English voices
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
    const voicesToUse = englishVoices.length > 0 ? englishVoices : voices;
    
    voicesToUse.forEach((voice, i) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

function loadArticle(index) {
    if (index < 0) index = 0;
    if (index >= articles.length) index = articles.length - 1;
    
    currentArticleIndex = index;
    const article = articles[currentArticleIndex];
    
    titleEl.textContent = article.title;
    contentEl.textContent = article.content;
    progressEl.textContent = `Article ${currentArticleIndex + 1} of ${articles.length}`;
    
    stopReading(); // Stop reading previous when changing article
}

function prepareUtterance() {
    const article = articles[currentArticleIndex];
    const textToRead = `${article.title}. ${article.content}`;
    
    utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Set selected voice
    const selectedVoiceName = voiceSelect.selectedOptions[0]?.getAttribute('data-name');
    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) {
        utterance.voice = voice;
    }
    
    // Set rate
    utterance.rate = rateRange.value;
    
    utterance.onend = () => {
        isPlaying = false;
        updateUI();
        // Auto-play next article if there is one
        if (currentArticleIndex < articles.length - 1) {
            loadArticle(currentArticleIndex + 1);
            setTimeout(() => togglePlayPause(), 500); // slight pause between articles
        }
    };
    
    utterance.onerror = (e) => {
        console.error('SpeechSynthesis error:', e);
        isPlaying = false;
        updateUI();
    };
}

function togglePlayPause() {
    if (synth.speaking && !synth.paused && isPlaying) {
        synth.pause();
        isPlaying = false;
    } else if (synth.paused) {
        synth.resume();
        isPlaying = true;
    } else {
        prepareUtterance();
        synth.speak(utterance);
        isPlaying = true;
    }
    updateUI();
}

function stopReading() {
    synth.cancel();
    isPlaying = false;
    updateUI();
}

function updateUI() {
    if (isPlaying) {
        playPauseIcon.textContent = '⏸';
        playPauseText.textContent = 'Pause';
        statusText.textContent = 'Status: Playing';
        btnPlayPause.setAttribute('aria-label', 'Pause News');
    } else {
        playPauseIcon.textContent = '▶';
        playPauseText.textContent = 'Play';
        statusText.textContent = 'Status: Paused';
        btnPlayPause.setAttribute('aria-label', 'Play News');
    }
}

// Event Listeners
btnPlayPause.addEventListener('click', togglePlayPause);
btnStop.addEventListener('click', stopReading);

btnNext.addEventListener('click', () => {
    loadArticle(currentArticleIndex + 1);
    if(isPlaying) togglePlayPause(); // auto-play on next if it was playing
});

btnPrev.addEventListener('click', () => {
    loadArticle(currentArticleIndex - 1);
    if(isPlaying) togglePlayPause(); // auto-play on prev if it was playing
});

rateRange.addEventListener('input', () => {
    rateValue.textContent = rateRange.value + 'x';
});

// Keyboard shortcuts for blind users (very important)
document.addEventListener('keydown', (e) => {
    // Space to play/pause (if not focused on a button or select to avoid double firing)
    if (e.code === 'Space' && document.activeElement.tagName !== 'BUTTON') {
        e.preventDefault();
        togglePlayPause();
    }
    // Right Arrow for Next
    if (e.code === 'ArrowRight' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        btnNext.click();
    }
    // Left Arrow for Prev
    if (e.code === 'ArrowLeft' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        btnPrev.click();
    }
});

// Initial load
loadArticle(0);
