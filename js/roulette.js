/**
 * Horizontal prize roulette (adapted from UmBaza lootbox assets).
 * Server decides the winner; this module only animates to that index.
 */
class PrizeRoulette {
    constructor(container, { prizes = [], arrowSrc = 'assets/roulette/arrow.svg' } = {}) {
        this.container = container;
        this.prizes = prizes;
        this.arrowSrc = arrowSrc;
        this.prizeWidth = 210;
        this.spinning = false;
        this._build();
    }

    setPrizes(prizes) {
        this.prizes = prizes || [];
        this._build();
    }

    _build() {
        this.container.innerHTML = '';
        this.container.classList.add('prize-roulette');

        const trackWrap = document.createElement('div');
        trackWrap.className = 'prize-roulette__viewport';

        const pointer = document.createElement('img');
        pointer.className = 'prize-roulette__pointer';
        pointer.src = this.arrowSrc;
        pointer.alt = '';

        this.track = document.createElement('div');
        this.track.className = 'prize-roulette__track';

        // More copies let the animation make several calm, readable turns.
        const strip = Array.from({ length: 5 }, () => this.prizes).flat();
        strip.forEach((prize) => {
            const cell = document.createElement('div');
            cell.className = 'prize-roulette__cell';
            cell.dataset.prizeId = prize.id;
            const img = document.createElement('img');
            img.src = prize.image;
            img.alt = prize.label || '';
            const label = document.createElement('span');
            label.textContent = prize.label || '';
            cell.appendChild(img);
            cell.appendChild(label);
            this.track.appendChild(cell);
        });

        trackWrap.appendChild(this.track);
        trackWrap.appendChild(pointer);
        this.container.appendChild(trackWrap);
        this._resetPosition();
    }

    _resetPosition() {
        this.track.style.transition = 'none';
        this.track.style.transform = 'translateX(0)';
    }

    /**
     * Animate to a prize by id. Resolves when animation ends.
     */
    spinTo(prizeId, { duration = 9500 } = {}) {
        if (this.spinning || !this.prizes.length) {
            return Promise.reject(new Error('Roulette busy or empty'));
        }
        const winnerIndex = this.prizes.findIndex((p) => p.id === prizeId);
        if (winnerIndex < 0) {
            return Promise.reject(new Error('Unknown prize'));
        }

        this.spinning = true;
        this._resetPosition();

        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const viewport = this.container.querySelector('.prize-roulette__viewport');
                const viewportWidth = viewport?.clientWidth || 320;
                const sampleCell = this.track.querySelector('.prize-roulette__cell');
                this.prizeWidth = sampleCell?.getBoundingClientRect().width || this.prizeWidth;
                const loops = 3;
                const targetIndex = this.prizes.length * loops + winnerIndex;
                const cellCenter = targetIndex * this.prizeWidth + this.prizeWidth / 2;
                const offset = cellCenter - viewportWidth / 2;
                const jitter = (Math.random() - 0.5) * (this.prizeWidth * 0.25);

                this.track.style.transition = `transform ${duration}ms cubic-bezier(0.08, 0.72, 0.14, 1)`;
                this.track.style.transform = `translateX(-${offset + jitter}px)`;

                const cells = this.track.querySelectorAll('.prize-roulette__cell');
                cells.forEach((c) => c.classList.remove('is-winner'));

                setTimeout(() => {
                    const winnerCell = cells[targetIndex];
                    if (winnerCell) winnerCell.classList.add('is-winner');
                    this.spinning = false;
                    resolve(this.prizes[winnerIndex]);
                }, duration + 50);
            });
        });
    }
}

window.PrizeRoulette = PrizeRoulette;
