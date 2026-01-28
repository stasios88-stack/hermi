(function() {
    const k = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    window.wykonajKorekte = () => {
        const o = document.querySelector('tbody[id$="output"]');
        if (!o) return;
        
        const rozmiar = getR();
        let suma = 0;
        const wiersze = Array.from(o.querySelectorAll('tr'));
        const naglowki = Array.from(document.querySelectorAll('thead img[src*="unit_"]')).map(img => img.src.match(/unit_(\w+)\.png/)[1]);

        wiersze.forEach(row => {
            naglowki.forEach((unit, idx) => {
                suma += (parseInt(row.cells[idx + 1]?.innerText) || 0) * (k[unit] || 0);
            });
        });

        let nadmiar = suma % rozmiar;
        if (nadmiar > 0) {
            for (let i = wiersze.length - 1; i >= 0 && nadmiar > 0; i--) {
                for (let j = naglowki.length - 1; j >= 0 && nadmiar > 0; j--) {
                    const unit = naglowki[j], koszt = k[unit] || 0;
                    if (koszt === 0) continue;
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
            o.parentElement.parentElement.prepend(panel);
        }
        panel.innerHTML = `WYNIK: ${suma - (suma % rozmiar)} | PACZEK: ${(suma - (suma % rozmiar)) / rozmiar}`;
    };

    // FUNKCJA DODAJE POLE DO USTAWIEŃ
    function injectPaczkaField() {
        const settingsTable = document.querySelector('.popup_helper table');
        if (settingsTable && !document.getElementById('paczka-row')) {
            const row = settingsTable.insertRow(-1);
            row.id = 'paczka-row';
            row.innerHTML = `<td>Rozmiar paczki:</td><td><input type="number" id="g-p-val" value="${getR()}" style="width: 50px;"></td>`;
            
            const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'Zapisz');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const newVal = document.getElementById('g-p-val').value;
                    localStorage.setItem('gemini_paczka_size', newVal);
                });
            }
        }
    }

    if (!document.getElementById('gemini-monitor')) {
        const monitor = document.createElement('div'); monitor.id = 'gemini-monitor';
        document.body.appendChild(monitor);
        
        setInterval(() => {
            const btn = document.querySelector('button[id*="generate"]');
            if (btn && !btn.dataset.hooked) {
                btn.addEventListener('click', () => setTimeout(window.wykonajKorekte, 500));
                btn.dataset.hooked = "1";
            }
            // CIĄGŁA PRÓBA WSTRZYKNIĘCIA POLA GDY OKNO JEST OTWARTE
            if (document.querySelector('.popup_helper')) {
                injectPaczkaField();
            }
        }, 500);
    }
})();
