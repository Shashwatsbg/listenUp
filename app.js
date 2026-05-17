// News Sources Configuration
const newsSources = [
    { id: 'bbc', name: 'BBC News', rss: 'http://feeds.bbci.co.uk/news/rss.xml' },
    { id: 'cnn', name: 'CNN Top Stories', rss: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
    { id: 'nyt', name: 'New York Times', rss: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
    { id: 'bloomberg', name: 'Bloomberg', rss: 'https://feeds.bloomberg.com/markets/news.rss' },
    { id: 'fp', name: 'Foreign Policy', rss: 'https://foreignpolicy.com/feed/' },
    { id: 'bs', name: 'Business Standard', rss: 'https://www.business-standard.com/rss/home_page_top_stories.rss' },
    { id: 'wion', name: 'WION', rss: 'https://www.wionews.com/feeds/wion-world.rss' },
    { id: 'aajtak', name: 'AajTak', rss: 'https://feed.aajtak.in/rss/1471018/rss.xml' },
    { id: 'rt', name: 'Russia Today', rss: 'https://www.rt.com/rss/news/' },
    { id: 'gt', name: 'Global Times', rss: 'https://www.globaltimes.cn/rss/rss.xml' },
    { id: 'sputnik', name: 'Sputnik', rss: 'https://sputniknews.com/export/pool/custom_all/' },
    { id: 'france24', name: 'France 24', rss: 'https://www.france24.com/en/rss' },
    { id: 'ndtv', name: 'NDTV', rss: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
    { id: 'thehindu', name: 'The Hindu', rss: 'https://www.thehindu.com/feeder/default.rss' },
    { id: 'ht', name: 'Hindustan Times', rss: 'https://www.hindustantimes.com/feeds/topnews/rss' },
    { id: 'theprint', name: 'The Print', rss: 'https://theprint.in/feed/' },
    { id: 'abp', name: 'ABP News', rss: 'https://news.abplive.com/home/feed' },
    { id: 'fars', name: 'Fars News', rss: 'https://en.farsnews.ir/rss' },
    { id: 'aljazeera', name: 'Al Jazeera', rss: 'https://www.aljazeera.com/xml/rss/all.xml' }
];

let articles = [];
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
const sourceSelect = document.getElementById('source-select');
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

// Initialize News Sources
function populateSourceList() {
    sourceSelect.innerHTML = '';
    newsSources.forEach(source => {
        const option = document.createElement('option');
        option.value = source.rss;
        option.textContent = source.name;
        sourceSelect.appendChild(option);
    });
}
populateSourceList();

async function fetchNews(rssUrl) {
    stopReading();
    titleEl.textContent = 'Loading News...';
    contentEl.textContent = 'Please wait while we fetch the latest articles.';
    progressEl.textContent = '';
    articles = [];
    currentArticleIndex = 0;

    try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items.length > 0) {
            articles = data.items.map(item => {
                // Strip HTML from description
                const tmp = document.createElement("DIV");
                tmp.innerHTML = item.description || item.content || '';
                const cleanContent = tmp.textContent || tmp.innerText || "";
                
                return {
                    title: item.title,
                    content: cleanContent
                };
            });
            loadArticle(0);
        } else {
            titleEl.textContent = 'Error';
            contentEl.textContent = 'Failed to load news articles. Please try another source.';
        }
    } catch (error) {
        console.error("Error fetching news:", error);
        titleEl.textContent = 'Error';
        contentEl.textContent = 'A network error occurred. Please try another source.';
    }
}

sourceSelect.addEventListener('change', (e) => {
    fetchNews(e.target.value);
});

function loadArticle(index) {
    if (articles.length === 0) return;
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
    if (articles.length === 0) return;
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
fetchNews(newsSources[0].rss);
