(function() {
    const k = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    window.wykonajKorekte = () => {
        const o = $('tbody[id$="output"]');
        if (!o.length) return;

        const rozmiar = getR();
        let suma = 0;
        
        // --- 1. MAPOWANIE KOLUMN (Z ZABEZPIECZENIEM) ---
        let colMap = {};
        
        // Próba automatyczna
        const headerRow = $('thead tr').last();
        headerRow.find('th, td').each(function(idx) {
            const img = $(this).find('img[src*="unit_"]');
            if (img.length) {
                const m = img.attr('src').match(/unit_(\w+)\.png/);
                if (m) colMap[m[1]] = idx;
            }
        });

        // PLAN RATUNKOWY (To naprawi Twój błąd "0 paczek")
        // Jeśli automat nic nie znalazł, ustawiamy standardowy układ Hermitowskiego "na sztywno"
        if (Object.keys(colMap).length === 0) {
            colMap = {
                spear: 1, sword: 2, axe: 3, archer: 4, spy: 5, 
                light: 6, marcher: 7, heavy: 8, ram: 9, catapult: 10, snob: 11
            };
        }

        // --- 2. LICZENIE ---
        const wiersze = o.find('tr');
        wiersze.each(function() {
            const row = $(this);
            for (const [unit, koszt] of Object.entries(k)) {
                if (colMap[unit] !== undefined) {
                    const cell = row.find('td').eq(colMap[unit]);
                    // replace(/\D/g, '') usuwa wszystko co nie jest cyfrą (naprawia błędy z nawiasami/spacjami)
                    const txt = cell.text().replace(/\D/g, '');
                    const val = parseInt(txt) || 0;
                    suma += val * koszt;
                }
            }
        });

        // --- 3. KOREKTA (Odejmowanie nadmiaru) ---
        let nadmiar = suma % rozmiar;
        if (nadmiar > 0) {
            $(wiersze.get().reverse()).each(function() {
                const row = $(this);
                if (nadmiar <= 0) return false;

                const unitsInOrder = Object.keys(colMap).reverse();
                for (const unit of unitsInOrder) {
                    if (nadmiar <= 0) break;
                    
                    const koszt = k[unit];
                    const colIdx = colMap[unit];
                    const cell = row.find('td').eq(colIdx);
                    // Tutaj też czyścimy tekst przed parsowaniem
                    let val = parseInt(cell.text().replace(/\D/g, '')) || 0;

                    if (val > 0 && koszt > 0) {
                        const doZabrania = Math.min(val, Math.ceil(nadmiar / koszt));
                        val -= doZabrania;
                        nadmiar -= (doZabrania * koszt);
                        cell.text(val).css({'color': 'red', 'font-weight': 'bold', 'background': '#ffcccc'});
                    }
                }
            });
        }

        // --- 4. PANEL WYNIKU ---
        $('#gemini-info').remove();
        const idealnaSuma = suma - (suma % rozmiar);
        
        // Zabezpieczenie przed dzieleniem przez zero
        const iloscPaczek = rozmiar > 0 ? (idealnaSuma / rozmiar) : 0;

        const panel = $('<div id="gemini-info"></div>')
            .css({
                background: '#dfcca6', border: '2px solid #7d510f', padding: '10px',
                marginTop: '5px', textAlign: 'center', fontWeight: 'bold', borderRadius: '5px'
            })
            .html(`WYNIK: <span style="color:#000">${idealnaSuma}</span> | PACZEK: <span style="color:green;font-size:16px">${iloscPaczek}</span>`);
            
        o.parent().parent().before(panel);
    };

    // --- 5. PRZYCISK ---
    if (!document.getElementById('gemini-monitor')) {
        $('body').append('<div id="gemini-monitor"></div>');
        
        setInterval(() => {
            const btn = $('button[id*="generate"]');
            if (btn.length && !$('#gemini-set-btn').length) {
                // Czyścimy stare listenery i dajemy nowy
                btn.off('click.gemini').on('click.gemini', () => setTimeout(window.wykonajKorekte, 600));
                
                const setBtn = $('<button id="gemini-set-btn" class="btn"></button>')
                    .text(`USTAW PACZKĘ (${getR()})`)
                    .css({marginLeft: '5px', background: '#444', color: '#fff'})
                    .on('click', (e) => {
                        e.preventDefault();
                        let v = prompt("Wielkość paczki:", getR());
                        if (v) { 
                            localStorage.setItem('gemini_paczka_size', v); 
                            setBtn.text(`USTAW PACZKĘ (${v})`);
                        }
                    });
                btn.after(setBtn);
            }
        }, 1000);
    }
})();
