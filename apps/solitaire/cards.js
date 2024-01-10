const cards = document.querySelectorAll('img');

for (const card of cards) {
    card.addEventListener('click', function () {
        const activeCard = document.querySelector('img[data-active]');
        if (activeCard) {
            delete activeCard.dataset.active;
        }
        this.dataset.active = true;
        window.backFile = `url(${this.getAttribute('src')})`;
    });
}