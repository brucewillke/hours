// Hours - Prayer App JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initTraditionTabs();
    initTopicTabs();
    restoreState();
});

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

            // Save state
            saveState();
        });
    });
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
