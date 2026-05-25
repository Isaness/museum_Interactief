// --- ELEMENTEN SELECTEREN ---
const scrollContainer = document.getElementById('scrollContainer');
const tijdlijnPuntenContainer = document.getElementById('tijdlijnPunten');

// GECORRIGEERD: In jouw HTML heet de klasse '.archief-kaart' (niet .expeditie-kaart)
const kaarten = document.querySelectorAll('.archief-kaart');

const zoekbalk = document.getElementById('zoekbalk');
const filterKnoppen = document.querySelectorAll('.filter-btn');


// --- 1. TIJDLIJN AUTOMATISCH GENEREREN ---
if (tijdlijnPuntenContainer && kaarten.length > 0) {
    kaarten.forEach((kaart, index) => {
        const jaar = kaart.getAttribute('data-jaar');
        
        const punt = document.createElement('div');
        punt.classList.add('tijdlijn-point'); // Behoud je eigen CSS klasse voor styling
        punt.classList.add('tijdlijn-punt');
        
        // VERWIJDERD: punt.innerText = jaar; <--- Dit haalt de zwarte tekst weg!
        
        // Dit attribuut laten we staan, want jouw witte CSS-tekst gebruikt dit waarschijnlijk om het jaar te tonen
        punt.setAttribute('data-jaar', jaar);
        
        if (index === 0) punt.classList.add('actief');

        punt.addEventListener('click', () => {
            kaart.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        });

        tijdlijnPuntenContainer.appendChild(punt);
    });
}


// --- 2. ACTIVEER STIPJES BIJ SCROLLEN ---
if (scrollContainer) {
    scrollContainer.addEventListener('scroll', () => {
        let actieveIndex = 0;
        let minimaleAfstand = Infinity;

        kaarten.forEach((kaart, index) => {
            const box = kaart.getBoundingClientRect();
            const afstandTotMidden = Math.abs(box.left + box.width / 2 - window.innerWidth / 2);

            if (afstandTotMidden < minimaleAfstand) {
                minimaleAfstand = afstandTotMidden;
                actieveIndex = index;
            }
        });

        const stipjes = document.querySelectorAll('.tijdlijn-punt');
        stipjes.forEach((stip, index) => {
            if (index === actieveIndex) {
                stip.classList.add('actief');
            } else {
                stip.classList.remove('actief');
            }
        });
    });

    // --- 3. TOUCH/SLEEP FUNCTIONALITEIT VOOR MUIS ---
    let isDown = false;
    let startX;
    let scrollLeft;

    scrollContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - scrollContainer.offsetLeft;
        scrollLeft = scrollContainer.scrollLeft;
        scrollContainer.style.scrollSnapType = 'none';
    });

    scrollContainer.addEventListener('mouseleave', () => {
        isDown = false;
        scrollContainer.style.scrollSnapType = 'x mandatory';
    });

    scrollContainer.addEventListener('mouseup', () => {
        isDown = false;
        scrollContainer.style.scrollSnapType = 'x mandatory';
    });

    scrollContainer.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        e.preventDefault();
        const x = e.pageX - scrollContainer.offsetLeft;
        const walk = (x - startX) * 2;
        scrollContainer.scrollLeft = scrollLeft - walk;
    });
}


// --- 4. DE INACTIVITEIT TIMER (30 seconden) ---
let inactivityTimeout;
const TIJD_NAAR_HOME = 30000; 

function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    
    inactivityTimeout = setTimeout(() => {
        const huidigePagina = window.location.pathname.split("/").pop();

        // Als we NIET op index.html zijn, sturen we de bezoeker terug naar home
        if (huidigePagina !== "" && huidigePagina !== "index.html") {
            window.location.href = "index.html"; 
        }
    }, TIJD_NAAR_HOME); 
}

// Luister naar interacties om de timer te resetten
const interacties = ['mousemove', 'keypress', 'touchstart', 'click', 'scroll', 'input'];
interacties.forEach(event => {
    window.addEventListener(event, resetInactivityTimer, true);
});

resetInactivityTimer();


// --- 5. HET ZOEK- EN FILTERSYSTEEM ---
let actiefFilter = 'alles';

function voerFilteringUit() {
    if (!zoekbalk) return; 

    const zoekTerm = zoekbalk.value.toLowerCase();

    kaarten.forEach(kaart => {
        const tekstInKaart = kaart.innerText.toLowerCase();
        
        // Koppeling naar de data-attributen in je HTML
        const kaartRegio = kaart.dataset.regio;
        const kaartType = kaart.dataset.type;

        const matchtZoekbalk = tekstInKaart.includes(zoekTerm);
        const matchtFilter = (actiefFilter === 'alles' || kaartRegio === actiefFilter || kaartType === actiefFilter);

        // Oplossing voor de kaart-links: we verbergen de hele link (de 'a' tag) 
        // zodat er geen lege klikbare ruimtes achterblijven
        const kaartLink = kaart.parentElement;

        if (matchtZoekbalk && matchtFilter) {
            kaartLink.style.display = "block"; 
        } else {
            kaartLink.style.display = "none";
        }
    });
}

if (zoekbalk) {
    zoekbalk.addEventListener('input', voerFilteringUit);
}

if (filterKnoppen.length > 0) {
    filterKnoppen.forEach(knop => {
        knop.addEventListener('click', (e) => {
            filterKnoppen.forEach(k => k.classList.remove('actief'));
            e.target.classList.add('actief');

            actiefFilter = e.target.dataset.filter;
            voerFilteringUit();
        });
    });
}

/* --- INTERACTIEVE KAART LOGICA (LEAFLET) --- */
// We zetten de focus direct op het Antarctisch Schiereiland (latitude -68, longitude -70) met een hogere zoom (4)
const map = L.map('map').setView([-68.0, -70.0], 4);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

// De gedetailleerde route die de Belgica voer langs en in het Antarctische ijs
const routePoints = [
    [-54.8019, -68.3030], // Start vanaf Ushuaia (Vuurland)
    [-62.9150, -60.6200], // Deception Island (Zuid-Shetlandeilanden)
    [-64.3000, -61.5000], // Begin van de Gerlache Straat (toen Hughes Golf)
    [-64.7500, -62.5000], // Gerlache Straat (blijvende ontdekkingen)
    [-65.2500, -64.1000], // Kaap Renard
    [-71.5000, -85.0000], // Positie waar ze ingesloten raakten in het pakijs
    [-70.5000, -100.5000] // Driften in de Amundsenzee / Bellingshausenzee en uiteindelijke ontsnapping
];

const routeLine = L.polyline(routePoints, {
    color: 'rgb(119, 102, 116)', 
    weight: 3,
    dashArray: '6, 8', 
    opacity: 0.85
}).addTo(map);

const markerStorage = [];

// De specifieke markers voor de interactieve sidebar
const markerData = [
    {
        coords: [-64.7500, -62.5000],
        title: '1. Ontdekking van de Straat',
        desc: 'In januari 1898 vaart de Belgica de straat binnen die later de "Gerlache Straat" genoemd zal worden. Ze brachten tientallen nieuwe eilanden en kusten nauwkeurig in kaart.'
    },
    {
        coords: [-71.5000, -85.0000],
        title: '2. De IJsgreep begint',
        desc: 'Op 2 maart 1898 raakt het schip hopeloos ingesloten door het dikke pakijs op 71°30\'S. De bemanning is onvoorbereid en begint aan de allereerste overwintering op Antarctica.'
    },
    {
        coords: [-70.5000, -100.5000],
        title: '3. Het handgezaagde kanaal',
        desc: 'Na een helse poolnacht zaagt de bemanning begin 1899 in wekenlang zwaar werk een honderden meters lang kanaal door het ijs om de Belgica net op tijd te bevrijden.'
    }
];

markerData.forEach((data, index) => {
    const pinNumber = index + 1;
    
    const customIcon = L.divIcon({
        className: 'custom-pin',
        html: pinNumber,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const marker = L.marker(data.coords, { icon: customIcon }).addTo(map);
    
    marker.bindPopup(`
        <h4>${data.title}</h4>
        <p>${data.desc}</p>
    `);

    markerStorage.push(marker);
});

function focusOnMarker(index) {
    const targetMarker = markerStorage[index];
    const targetCoords = markerData[index].coords;
    
    // Zoomt in op de specifieke regio in Antarctica wanneer je op de sidebar klikt
    map.setView(targetCoords, 6, {
        animate: true,
        duration: 1.2
    });
    
    setTimeout(() => {
        targetMarker.openPopup();
    }, 600);
}