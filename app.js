// News Sources Configuration
const newsSources = [
    { id: 'bbc', region: 'intl', name: 'BBC News', rss: 'http://feeds.bbci.co.uk/news/rss.xml' },
    { id: 'cnn', region: 'intl', name: 'CNN Top Stories', rss: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
    { id: 'nyt', region: 'intl', name: 'New York Times', rss: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
    { id: 'bloomberg', region: 'intl', name: 'Bloomberg', rss: 'https://feeds.bloomberg.com/markets/news.rss' },
    { id: 'fp', region: 'intl', name: 'Foreign Policy', rss: 'https://foreignpolicy.com/feed/' },
    { id: 'bs', region: 'india', name: 'Business Standard', rss: 'https://www.business-standard.com/rss/home_page_top_stories.rss' },
    { id: 'wion', region: 'india', name: 'WION', rss: 'https://www.wionews.com/feeds/wion-world.rss' },
    { id: 'aajtak', region: 'india', name: 'AajTak', rss: 'https://feed.aajtak.in/rss/1471018/rss.xml' },
    { id: 'rt', region: 'intl', name: 'Russia Today', rss: 'https://www.rt.com/rss/news/' },
    { id: 'gt', region: 'intl', name: 'Global Times', rss: 'https://www.globaltimes.cn/rss/rss.xml' },
    { id: 'sputnik', region: 'intl', name: 'Sputnik', rss: 'https://sputniknews.com/export/pool/custom_all/' },
    { id: 'france24', region: 'intl', name: 'France 24', rss: 'https://www.france24.com/en/rss' },
    { id: 'ndtv', region: 'india', name: 'NDTV', rss: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
    { id: 'thehindu', region: 'india', name: 'The Hindu', rss: 'https://www.thehindu.com/feeder/default.rss' },
    { id: 'ht', region: 'india', name: 'Hindustan Times', rss: 'https://www.hindustantimes.com/feeds/topnews/rss' },
    { id: 'theprint', region: 'india', name: 'The Print', rss: 'https://theprint.in/feed/' },
    { id: 'abp', region: 'india', name: 'ABP News', rss: 'https://news.abplive.com/home/feed' },
    { id: 'fars', region: 'intl', name: 'Fars News', rss: 'https://en.farsnews.ir/rss' },
    { id: 'aljazeera', region: 'intl', name: 'Al Jazeera', rss: 'https://www.aljazeera.com/xml/rss/all.xml' }
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
    
    // Add Mixed Option
    const mixedOption = document.createElement('option');
    mixedOption.value = 'mixed';
    mixedOption.textContent = 'Mixed Daily Digest (25 Articles)';
    sourceSelect.appendChild(mixedOption);

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
    if (e.target.value === 'mixed') {
        fetchMixedNews();
    } else {
        fetchNews(e.target.value);
    }
});

async function fetchMixedNews() {
    stopReading();
    titleEl.textContent = 'Loading Daily Digest...';
    contentEl.textContent = 'Aggregating 25 articles (15 India, 10 International). Please wait...';
    progressEl.textContent = '';
    articles = [];
    currentArticleIndex = 0;

    try {
        const indianUrls = newsSources.filter(s => s.region === 'india').map(s => s.rss);
        const intlUrls = newsSources.filter(s => s.region === 'intl').map(s => s.rss);
        
        // Randomly pick a few sources from each to distribute the load
        const selectedIndianUrls = indianUrls.sort(() => 0.5 - Math.random()).slice(0, 4);
        const selectedIntlUrls = intlUrls.sort(() => 0.5 - Math.random()).slice(0, 4);
        
        const fetchArticles = async (urls) => {
            let fetched = [];
            for (const url of urls) {
                try {
                    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
                    const data = await response.json();
                    if (data.status === 'ok') {
                        const parsed = data.items.map(item => {
                            const tmp = document.createElement("DIV");
                            tmp.innerHTML = item.description || item.content || '';
                            return { title: item.title, content: tmp.textContent || tmp.innerText || "" };
                        });
                        fetched = fetched.concat(parsed);
                    }
                } catch(e) { console.error(e); }
            }
            return fetched;
        };

        const [indianArticles, intlArticles] = await Promise.all([
            fetchArticles(selectedIndianUrls),
            fetchArticles(selectedIntlUrls)
        ]);
        
        const finalIndian = indianArticles.slice(0, 15);
        const finalIntl = intlArticles.slice(0, 10);
        
        let combined = [...finalIndian, ...finalIntl];
        
        if (combined.length > 0) {
            articles = combined;
            loadArticle(0);
        } else {
            titleEl.textContent = 'Error';
            contentEl.textContent = 'Failed to load any articles. Please try again.';
        }
    } catch (error) {
        console.error("Error fetching mixed news:", error);
        titleEl.textContent = 'Error';
        contentEl.textContent = 'A network error occurred while aggregating news.';
    }
}

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
fetchMixedNews();

// Auto-update news every 5 minutes (300,000 ms)
setInterval(() => {
    // Only refresh if the user is not actively listening to avoid interrupting them
    if (!isPlaying) {
        if (sourceSelect.value === 'mixed') {
            fetchMixedNews();
        } else {
            fetchNews(sourceSelect.value);
        }
    }
}, 5 * 60 * 1000);
