(function() {
    const koszty = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    
    // Pobieranie aktualnego rozmiaru
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    window.wykonajKorekte = () => {
        const output = document.querySelector('tbody[id$="output"]');
        if (!output) return;
        
        const rozmiar = getR();
        let suma = 0;
        const wiersze = Array.from(output.querySelectorAll('tr'));
        const naglowki = Array.from(document.querySelectorAll('thead img[src*="unit_"]')).map(img => {
            const match = img.src.match(/unit_(\w+)\.png/);
            return match ? match[1] : null;
        });

        wiersze.forEach(row => {
            naglowki.forEach((unit, idx) => {
                if (unit) suma += (parseInt(row.cells[idx + 1]?.innerText) || 0) * (koszty[unit] || 0);
            });
        });

        let nadmiar = suma % rozmiar;
        if (nadmiar > 0) {
            for (let i = wiersze.length - 1; i >= 0 && nadmiar > 0; i--) {
                for (let j = naglowki.length - 1; j >= 0 && nadmiar > 0; j--) {
                    const unit = naglowki[j], koszt = koszty[unit] || 0;
                    if (!unit || koszt === 0) continue;
                    let cell = wiersze[i].cells[j + 1], val = parseInt(cell.innerText) || 0;
                    if (val > 0) {
                        const doZabrania = Math.min(val, Math.ceil(nadmiar / koszt));
                        val -= doZabrania; nadmiar -= (doZabrania * koszt);
                        cell.innerText = val; cell.style.color = "red"; cell.style.fontWeight = "bold";
                    }
                }
            }
        }

        let panel = document.getElementById('gemini-info');
        if (!panel) {
            panel = document.createElement('div'); panel.id = 'gemini-info';
            panel.style = "background:#dfcca6;border:2px solid #7d510f;padding:10px;margin:5px 0;text-align:center;border-radius:5px;font-weight:bold;";
            output.parentElement.parentElement.prepend(panel);
        }
        panel.innerHTML = `WYNIK: ${suma - (suma % rozmiar)} | PACZEK: ${(suma - (suma % rozmiar)) / rozmiar}`;
    };

    if (!document.getElementById('gemini-monitor')) {
        const monitor = document.createElement('div'); monitor.id = 'gemini-monitor';
        document.body.appendChild(monitor);
        
        setInterval(() => {
            const btn = document.querySelector('button[id*="generate"]');
            if (btn && !btn.dataset.hooked) {
                btn.addEventListener('click', () => setTimeout(window.wykonajKorekte, 500));
                
                const setBtn = document.createElement('button');
                setBtn.id = 'gemini-set-btn';
                setBtn.innerText = `USTAW PACZKĘ (${getR()})`;
                setBtn.className = 'btn';
                setBtn.style.marginLeft = '5px';
                setBtn.onclick = (e) => {
                    e.preventDefault();
                    let v = prompt("Rozmiar paczki (ludność):", getR());
                    if (v) { 
                        localStorage.setItem('gemini_paczka_size', v); 
                        setBtn.innerText = `USTAW PACZKĘ (${v})`;
                    }
                };
                btn.after(setBtn);
                btn.dataset.hooked = "1";
            }
        }, 1000);
    }
})();
