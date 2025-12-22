// Hours - Prayer App JavaScript

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/hours/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initTraditionTabs();
    initTopicTabs();
    restoreState();
    setInitialBackground();
    initLiturgicalDisplay();
    initDailyOffice();
    initMusicPlayer();

    // Update every minute
    setInterval(updateTimeBasedContent, 60000);
});

// Music sources (local files, originally from archive.org public domain)
const MUSIC_SOURCES = {
    gregorian: 'audio/gregorian.mp3',
    orthodox: 'audio/orthodox.mp3',
    organ: 'audio/mighty-fortress.mp3'
};

// Initialize music player
function initMusicPlayer() {
    const toggleBtn = document.getElementById('music-toggle');
    const selectEl = document.getElementById('music-select');
    const audio = document.getElementById('ambient-audio');
    const audioSource = document.getElementById('audio-source');

    if (!toggleBtn || !audio) return;

    // Set initial source
    audioSource.src = MUSIC_SOURCES.gregorian;
    audio.load();

    // Toggle play/pause
    toggleBtn.addEventListener('click', function() {
        if (audio.paused) {
            audio.play().then(() => {
                toggleBtn.classList.add('playing');
            }).catch(err => {
                console.log('Audio playback failed:', err);
            });
        } else {
            audio.pause();
            toggleBtn.classList.remove('playing');
        }
    });

    // Change music source
    selectEl.addEventListener('change', function() {
        const wasPlaying = !audio.paused;
        audioSource.src = MUSIC_SOURCES[this.value];
        audio.load();
        if (wasPlaying) {
            audio.play();
        }
    });

    // Update button state when audio ends/plays
    audio.addEventListener('play', () => toggleBtn.classList.add('playing'));
    audio.addEventListener('pause', () => toggleBtn.classList.remove('playing'));
    audio.addEventListener('ended', () => toggleBtn.classList.remove('playing'));
}

// Handle tradition (main) tab navigation
function initTraditionTabs() {
    const traditionTabs = document.querySelectorAll('.tradition-tab');

    traditionTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tradition = this.dataset.tradition;

            // Update active tab
            traditionTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Update visible content
            document.querySelectorAll('.tradition-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tradition).classList.add('active');

            // Update body background class
            document.body.classList.remove('tradition-catholic', 'tradition-byzantine', 'tradition-protestant');
            document.body.classList.add('tradition-' + tradition);

            // Save state
            saveState();
        });
    });
}

// Set initial background on page load
function setInitialBackground() {
    const activeTab = document.querySelector('.tradition-tab.active');
    if (activeTab) {
        const tradition = activeTab.dataset.tradition;
        document.body.classList.add('tradition-' + tradition);
    }
}

// Handle topic (secondary) tab navigation
function initTopicTabs() {
    const topicTabs = document.querySelectorAll('.topic-tab');

    topicTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const topic = this.dataset.topic;
            const tradition = topic.split('-')[0];
            const traditionSection = document.getElementById(tradition);

            // Update active tab within this tradition
            traditionSection.querySelectorAll('.topic-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');

            // Update visible content within this tradition
            traditionSection.querySelectorAll('.topic-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(topic).classList.add('active');

            // Save state
            saveState();
        });
    });
}

// Initialize liturgical season display
function initLiturgicalDisplay() {
    const season = LiturgicalCalendar.getSeason();
    updateSeasonBanner(season);
}

// Initialize daily office display
function initDailyOffice() {
    const currentHour = DailyOffice.getCurrentHour();
    updateOfficeBanner(currentHour);
    updateOfficeContent(currentHour);
}

// Update the season banner
function updateSeasonBanner(season) {
    const banner = document.getElementById('season-banner');
    if (banner) {
        banner.textContent = season.fullName || season.name;
        banner.style.backgroundColor = season.color;
        // Adjust text color for light backgrounds
        if (['#ffffff', '#ffd700'].includes(season.color)) {
            banner.style.color = '#333';
        } else {
            banner.style.color = '#fff';
        }
    }

    // Update seasonal prayers in the Daily Office tab
    updateSeasonalPrayers(season);
}

// Update the office hour banner
function updateOfficeBanner(hour) {
    const banner = document.getElementById('office-banner');
    if (banner) {
        banner.innerHTML = `<span class="office-name">${hour.name}</span><span class="office-desc">${hour.description}</span>`;
    }

    // Highlight current hour in the office tabs
    document.querySelectorAll('.office-tab').forEach(tab => {
        tab.classList.remove('current');
        if (tab.dataset.office === hour.key) {
            tab.classList.add('current');
        }
    });
}

// Update office content based on current hour
function updateOfficeContent(hour) {
    const prayers = HourPrayers[hour.key];
    if (!prayers) return;

    // Update the Daily Office section content
    const officeContent = document.getElementById('office-prayers');
    if (officeContent && prayers) {
        let html = '';

        if (prayers.invitatory) {
            html += `<div class="office-section">
                <h4>Invitatory</h4>
                <p class="prayer-text">${prayers.invitatory.replace(/\n/g, '<br>')}</p>
            </div>`;
        }

        if (prayers.confession) {
            html += `<div class="office-section">
                <h4>Confession</h4>
                <p class="prayer-text">${prayers.confession.replace(/\n/g, '<br>')}</p>
            </div>`;
        }

        if (prayers.hymn) {
            html += `<div class="office-section">
                <h4>Hymn</h4>
                <p class="prayer-text hymn">${prayers.hymn.replace(/\n/g, '<br>')}</p>
            </div>`;
        }

        if (prayers.psalm) {
            html += `<div class="office-section">
                <h4>Psalmody</h4>
                <p class="prayer-text">${prayers.psalm.replace(/\n/g, '<br>')}</p>
            </div>`;
        }

        if (prayers.canticle) {
            html += `<div class="office-section">
                <h4>Canticle</h4>
                <p class="prayer-text">${prayers.canticle.replace(/\n/g, '<br>')}</p>
            </div>`;
        }

        if (prayers.antiphon) {
            html += `<div class="office-section">
                <h4>Antiphon</h4>
                <p class="prayer-text">${prayers.antiphon.replace(/\n/g, '<br>')}</p>
            </div>`;
        }

        if (prayers.closing) {
            html += `<div class="office-section">
                <h4>Closing</h4>
                <p class="prayer-text">${prayers.closing.replace(/\n/g, '<br>')}</p>
            </div>`;
        }

        officeContent.innerHTML = html;
    }
}

// Update seasonal prayers
function updateSeasonalPrayers(season) {
    let seasonKey = 'ORDINARY';
    if (season.name === 'Advent') seasonKey = 'ADVENT';
    else if (season.name === 'Christmas') seasonKey = 'CHRISTMAS';
    else if (season.name === 'Lent') seasonKey = 'LENT';
    else if (season.name === 'Holy Week') seasonKey = 'HOLY_WEEK';
    else if (season.name === 'Easter') seasonKey = 'EASTER';

    const prayers = SeasonalPrayers[seasonKey];
    const seasonalContent = document.getElementById('seasonal-prayers');

    if (seasonalContent && prayers) {
        let html = `<div class="season-intro">
            <p class="season-opening">${prayers.opening}</p>
        </div>`;

        html += `<div class="office-section">
            <h4>Collect for ${season.fullName || season.name}</h4>
            <p class="prayer-text">${prayers.collect}</p>
        </div>`;

        if (prayers.canticle) {
            html += `<div class="office-section">
                <h4>Seasonal Canticle</h4>
                <p class="prayer-text hymn">${prayers.canticle.replace(/\n/g, '<br>')}</p>
            </div>`;
        }

        seasonalContent.innerHTML = html;
    }
}

// Update all time-based content
function updateTimeBasedContent() {
    const season = LiturgicalCalendar.getSeason();
    const currentHour = DailyOffice.getCurrentHour();

    updateSeasonBanner(season);
    updateOfficeBanner(currentHour);
    updateOfficeContent(currentHour);
}

// Handle office tab clicks
function initOfficeTabs() {
    document.querySelectorAll('.office-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const officeKey = this.dataset.office;

            // Update active tab
            document.querySelectorAll('.office-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Update content
            const hour = { key: officeKey, ...DailyOffice.HOURS[officeKey] };
            updateOfficeContent(hour);
        });
    });
}

// Save current state to localStorage
function saveState() {
    const activeTradition = document.querySelector('.tradition-tab.active');
    if (activeTradition) {
        localStorage.setItem('hours-tradition', activeTradition.dataset.tradition);
    }

    // Save active topic for each tradition
    document.querySelectorAll('.tradition-content').forEach(tradition => {
        const activeTopicTab = tradition.querySelector('.topic-tab.active');
        if (activeTopicTab) {
            localStorage.setItem(`hours-topic-${tradition.id}`, activeTopicTab.dataset.topic);
        }
    });
}

// Restore state from localStorage
function restoreState() {
    const savedTradition = localStorage.getItem('hours-tradition');

    if (savedTradition) {
        // Restore tradition tab
        const traditionTab = document.querySelector(`.tradition-tab[data-tradition="${savedTradition}"]`);
        if (traditionTab) {
            traditionTab.click();
        }
    }

    // Restore topic tabs for each tradition
    document.querySelectorAll('.tradition-content').forEach(tradition => {
        const savedTopic = localStorage.getItem(`hours-topic-${tradition.id}`);
        if (savedTopic) {
            const topicTab = tradition.querySelector(`.topic-tab[data-topic="${savedTopic}"]`);
            if (topicTab) {
                // Update active tab
                tradition.querySelectorAll('.topic-tab').forEach(t => t.classList.remove('active'));
                topicTab.classList.add('active');

                // Update visible content
                tradition.querySelectorAll('.topic-content').forEach(c => c.classList.remove('active'));
                const topicContent = document.getElementById(savedTopic);
                if (topicContent) {
                    topicContent.classList.add('active');
                }
            }
        }
    });
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    // Left/Right arrows to navigate traditions
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const traditionTabs = Array.from(document.querySelectorAll('.tradition-tab'));
        const activeIndex = traditionTabs.findIndex(t => t.classList.contains('active'));

        let newIndex;
        if (e.key === 'ArrowLeft') {
            newIndex = activeIndex > 0 ? activeIndex - 1 : traditionTabs.length - 1;
        } else {
            newIndex = activeIndex < traditionTabs.length - 1 ? activeIndex + 1 : 0;
        }

        traditionTabs[newIndex].click();
    }
});
