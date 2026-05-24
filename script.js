const scrollContainer = document.getElementById('scrollContainer');
const tijdlijnPuntenContainer = document.getElementById('tijdlijnPunten');
const kaarten = document.querySelectorAll('.archief-kaart');

// 1. Genereer automatisch de tijdlijnpunten onderaan
kaarten.forEach((kaart, index) => {
    const jaar = kaart.getAttribute('data-jaar');
    
    const punt = document.createElement('div');
    punt.classList.add('tijdlijn-punt');
    punt.setAttribute('data-jaar', jaar);
    if (index === 0) punt.classList.add('actief'); // Eerste is standaard actief

    // Als je op een stipje klikt, scroll naar die kaart
    punt.addEventListener('click', () => {
        kaart.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    });

    tijdlijnPuntenContainer.appendChild(punt);
});

// 2. Luister naar het scrollen om het actieve stipje bij te werken
scrollContainer.addEventListener('scroll', () => {
    let actieveIndex = 0;
    let minimaleAfstand = Infinity;

    kaarten.forEach((kaart, index) => {
        // Bereken welke kaart het dichtst bij het midden van het scherm is
        const box = kaart.getBoundingClientRect();
        const afstandTotMidden = Math.abs(box.left + box.width / 2 - window.innerWidth / 2);

        if (afstandTotMidden < minimaleAfstand) {
            minimaleAfstand = afstandTotMidden;
            actieveIndex = index;
        }
    });

    // Update de stipjes op de tijdlijn
    const stipjes = document.querySelectorAll('.tijdlijn-punt');
    stipjes.forEach((stip, index) => {
        if (index === actieveIndex) {
            stip.classList.add('actief');
        } else {
            stip.classList.remove('actief');
        }
    });
});

// 3. Touch/Sleep functionaliteit voor computers zonder touchscreen (klikken en slepen met de muis)
let isDown = false;
let startX;
let scrollLeft;

scrollContainer.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - scrollContainer.offsetLeft;
    scrollLeft = scrollContainer.scrollLeft;
    scrollContainer.style.scrollSnapType = 'none'; // Tijdelijk uitschakelen tijdens slepen
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
    const walk = (x - startX) * 2; // Snelheid van het slepen
    scrollContainer.scrollLeft = scrollLeft - walk;
});