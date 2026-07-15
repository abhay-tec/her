// ==========================================================================
// Page Navigation Logic
// ==========================================================================

let currentPage = 1;
const totalPages = 3;

function updatePage() {
    // Remove active class from all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Add active class to current page
    const activePage = document.getElementById(`page-${currentPage}`);
    if (activePage) {
        activePage.classList.add('active');
    }
    
    // Trigger transition particles
    createTransitionHearts();
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        updatePage();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        updatePage();
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        nextPage();
    } else if (e.key === 'ArrowLeft') {
        prevPage();
    }
});

const firstPhotoTrigger = document.querySelector('.photo-strip-img-1');
if (firstPhotoTrigger) {
    firstPhotoTrigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePlay(0);
        }
    });
}


// ==========================================================================
// Interactive Particles (Hearts & Sparkles)
// ==========================================================================

const particleContainer = document.getElementById('particle-container');

function createHeart(x, y) {
    const heart = document.createElement('div');
    heart.classList.add('heart-particle');
    heart.innerHTML = Math.random() > 0.5 ? '♥' : '💖';
    
    // Random sizes and rotations
    const size = Math.random() * 15 + 10;
    heart.style.fontSize = `${size}px`;
    
    // Set position
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    
    // Random drift
    const driftX = (Math.random() - 0.5) * 60;
    heart.style.setProperty('--drift-x', `${driftX}px`);
    
    particleContainer.appendChild(heart);
    
    // Remove after animation completes
    setTimeout(() => {
        heart.remove();
    }, 1500);
}

// Spawn hearts on cursor clicks inside the scrapbook
document.addEventListener('click', (e) => {
    // Only spawn particles if clicking inside the scrapbook
    const rect = document.querySelector('.scrapbook-container').getBoundingClientRect();
    if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
    ) {
        // Translate coordinates to relative container coordinates
        const containerRect = particleContainer.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;
        
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                createHeart(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20);
            }, i * 100);
        }
    }
});

// Full page transition hearts
function createTransitionHearts() {
    const width = particleContainer.offsetWidth;
    const height = particleContainer.offsetHeight;
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const x = Math.random() * width;
            const y = height - 50 - (Math.random() * 100);
            createHeart(x, y);
        }, i * 50);
    }
}


// ==========================================================================
// Web Audio Synthesizer for Offline / Instant Music Playback
// ==========================================================================

let audioCtx = null;
let currentSynthInterval = null;
let activeTrackIndex = -1;
let isPlaying = false;

// Synthesizer Tracks (Melody definitions: Note frequencies and timings)
// Coords: [note, duration_beats]
// Frequencies mapping (Hz)
const NOTES = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'G4': 392.00, 'A4': 440.00,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.00,
    'B5': 987.77, 'C6': 1046.50
};

// Cozy Lofi Chord Progressions
const TRACK_MELODIES = [
    // Track 1: Lofi Star (Warm slow chords & bells)
    {
        name: "Jab Tak",
        chords: [['C4', 'E4', 'G4', 'C5'], ['A4', 'C5', 'E5'], ['F4', 'A4', 'C5'], ['G4', 'B5', 'D5']],
        melody: ['C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5'],
        tempo: 600 // ms per beat
    },
    // Track 2: Sunshine Smile (Sweet cozy vibes)
    {
        name: "Kinna Sona",
        chords: [['E4', 'G4', 'B5'], ['A4', 'C5', 'E5'], ['D4', 'F4', 'A4'], ['G4', 'B5', 'D5']],
        melody: ['E5', 'G5', 'A5', 'C6', 'B5', 'A5', 'G5', 'E5'],
        tempo: 500
    },
    // Track 3: Forever Love (Warm retro plucks)
    {
        name: "And it's the kind of love I've hoped I'd find",
        chords: [['F4', 'A4', 'C5'], ['G4', 'B5', 'D5'], ['E4', 'G4', 'B5'], ['A4', 'C5', 'E5']],
        melody: ['A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'D5', 'E5'],
        tempo: 450
    }
];

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Plays a single synthetic note (soft electric piano sound)
function playNote(freq, startTime, duration, type = 'sine') {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Vintage warmth filter
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, startTime);
    
    // Connect nodes
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Envelope (Attack Decay Sustain Release)
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.08); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + duration * 0.4); // Decay
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.05); // Release
    
    osc.start(startTime);
    osc.stop(startTime + duration);
}

// Main Scheduler Loop for the Synth Music
function startSynthLoop(trackIndex) {
    stopSynthLoop();
    
    const track = TRACK_MELODIES[trackIndex];
    
    // Update Master Play Bar
    document.getElementById('current-track-title').innerText = track.name;
    document.querySelector('.visualizer-container').classList.add('playing-wave');
    document.getElementById('master-play').innerHTML = '<i class="fa-solid fa-pause"></i>';
    
    if (trackIndex === 0) {
        // Play the downloaded YouTube Shorts audio file
        const bgAudio = document.getElementById('bg-audio');
        if (bgAudio) {
            bgAudio.src = 'assets/song1.mp3';
            bgAudio.play().catch(e => console.log("Audio play blocked/failed: ", e));
        }
        return; // Skip synth synthesis for track 1
    }

    if (trackIndex === 1) {
        const bgAudio = document.getElementById('bg-audio');
        if (bgAudio) {
            bgAudio.src = 'assets/song2.mp3';
            bgAudio.play().catch(e => console.log("Audio play blocked/failed: ", e));
        }
        return;
    }
    
    let step = 0;
    function playStep() {
        const time = audioCtx.currentTime;
        const chordIndex = Math.floor(step / 2) % track.chords.length;
        const melodyIndex = step % track.melody.length;
        
        // Play chord root/harmony on even beats
        if (step % 2 === 0) {
            track.chords[chordIndex].forEach(note => {
                const freq = NOTES[note] || 220;
                playNote(freq, time, 1.2, 'triangle');
            });
        }
        
        // Play high melody bells
        const noteName = track.melody[melodyIndex];
        const melodyFreq = NOTES[noteName] || 440;
        playNote(melodyFreq, time, 0.4, 'sine');
        
        step++;
    }
    
    // Pre-run first step
    playStep();
    currentSynthInterval = setInterval(playStep, track.tempo);
}

function stopSynthLoop() {
    if (currentSynthInterval) {
        clearInterval(currentSynthInterval);
        currentSynthInterval = null;
    }
    const bgAudio = document.getElementById('bg-audio');
    if (bgAudio) {
        bgAudio.pause();
    }
    document.querySelector('.visualizer-container').classList.remove('playing-wave');
    document.getElementById('master-play').innerHTML = '<i class="fa-solid fa-play"></i>';
}


// ==========================================================================
// Interactive Vinyl Playback Controller
// ==========================================================================

function togglePlay(trackIndex) {
    initAudioContext();
    
    const clickedCard = document.getElementById(`card-${trackIndex + 1}`);
    const isAlreadyPlaying = clickedCard.classList.contains('playing');
    
    // Reset all music cards and sleeves
    document.querySelectorAll('.music-card').forEach((card, index) => {
        card.classList.remove('playing');
        card.classList.remove('active');
        const lyricsBox = document.getElementById(`lyrics-${index}`);
        if (lyricsBox) lyricsBox.classList.remove('active');
    });
    
    if (isAlreadyPlaying) {
        // Pause playback
        stopSynthLoop();
        isPlaying = false;
        activeTrackIndex = -1;
        document.getElementById('current-track-title').innerText = "Select a vinyl record to play";
        // Keep the clicked card active even when paused so it stays visible on mobile
        clickedCard.classList.add('active');
    } else {
        // Start playing the selected track
        clickedCard.classList.add('playing');
        clickedCard.classList.add('active');
        const activeLyrics = document.getElementById(`lyrics-${trackIndex}`);
        if (activeLyrics) activeLyrics.classList.add('active');
        
        activeTrackIndex = trackIndex;
        isPlaying = true;
        
        startSynthLoop(trackIndex);
        
        // Scroll the clicked card into view smoothly on mobile
        clickedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        
        // Spawn mini hearts burst from the vinyl record
        const rect = clickedCard.querySelector('.vinyl-container').getBoundingClientRect();
        const containerRect = particleContainer.getBoundingClientRect();
        const x = (rect.left + rect.right) / 2 - containerRect.left;
        const y = (rect.top + rect.bottom) / 2 - containerRect.top;
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                createHeart(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40);
            }, i * 80);
        }
    }
}

// Master Controls (Bottom Player Bar)
function toggleMasterPlay() {
    if (activeTrackIndex === -1) {
        // If nothing is selected, play the first track
        togglePlay(0);
    } else {
        // Toggle the active track
        togglePlay(activeTrackIndex);
    }
}

function nextTrack() {
    let nextIndex = (activeTrackIndex + 1) % 3;
    togglePlay(nextIndex);
}

function prevTrack() {
    let prevIndex = activeTrackIndex - 1;
    if (prevIndex < 0) prevIndex = 2;
    togglePlay(prevIndex);
}
