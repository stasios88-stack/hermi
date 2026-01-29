(function() {
    // Cennik jednostek (ludność)
    const k = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    
    // Pobieranie rozmiaru paczki z pamięci
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    window.wykonajKorekte = () => {
        // Szukamy tabeli z wynikami (output)
        const o = $('tbody[id$="output"]');
        if (!o.length) return;
        
        const rozmiar = getR();
        let suma = 0;
        
        // --- 1. MAPOWANIE KOLUMN (NAPRAWIONE) ---
        // Szukamy wiersza w nagłówku, który zawiera obrazki jednostek. 
        // Bierzemy pierwszy pasujący, co jest bezpieczniejsze przy Twoim widoku.
        let colMap = {};
        const headerRow = $('thead tr').filter((i, e) => $(e).find('img[src*="unit_"]').length > 0).first();
        
        headerRow.find('th, td').each(function(idx) {
            const img = $(this).find('img[src*="unit_"]');
            if (img.length) {
                // Wyciągamy nazwę jednostki z pliku (np. unit_spear.png -> spear)
                const m = img.attr('src').match(/unit_(\w+)\.png/);
                if (m) colMap[m[1]] = idx;
            }
        });

        // --- 2. LICZENIE SUMY ---
        const wiersze = o.find('tr');
        
        wiersze.each(function() {
            const row = $(this);
            for (const [unit, koszt] of Object.entries(k)) {
                if (colMap[unit] !== undefined) {
                    const cell = row.find('td').eq(colMap[unit]);
                    // replace(/\D/g, '') usuwa wszystko co nie jest cyfrą (np. nawiasy, spacje)
                    // Dzięki temu skrypt widzi liczbę nawet jak jest sformatowana
                    const val = parseInt(cell.text().replace(/\D/g, '')) || 0;
                    suma += val * koszt;
                }
            }
        });

        // --- 3. KOREKTA (ODEJMOWANIE) ---
        let nadmiar = suma % rozmiar;
        
        if (nadmiar > 0) {
            // Idziemy od dołu tabeli
            $(wiersze.get().reverse()).each(function() {
                const row = $(this);
                if (nadmiar <= 0) return false;

                // Sprawdzamy jednostki od prawej do lewej (zazwyczaj od cięższych)
                const unitsInOrder = Object.keys(colMap).reverse();
                
                for (const unit of unitsInOrder) {
                    if (nadmiar <= 0) break;
                    
                    const koszt = k[unit];
                    const colIdx = colMap[unit];
                    const cell = row.find('td').eq(colIdx);
                    let val = parseInt(cell.text().replace(/\D/g, '')) || 0;

                    if (val > 0 && koszt > 0) {
                        // Obliczamy ile zabrać
                        const doZabrania = Math.min(val, Math.ceil(nadmiar / koszt));
                        
                        val -= doZabrania;
                        nadmiar -= (doZabrania * koszt);
                        
                        // Zmieniamy wartość w tabeli i kolorujemy na czerwono
                        cell.text(val).css({'color': 'red', 'font-weight': 'bold', 'background': '#ffcccc'});
                    }
                }
            });
        }

        // --- 4. PANEL WYNIKU ---
        $('#gemini-info').remove();
        // Obliczamy ile zostało po korekcie
        const idealnaSuma = suma - (suma % rozmiar); 
        
        const panel = $('<div id="gemini-info"></div>')
            .css({
                background: '#dfcca6',
                border: '2px solid #7d510f',
                padding: '10px',
                marginTop: '5px',
                textAlign: 'center',
                fontWeight: 'bold',
                borderRadius: '5px'
            })
            .html(`
                WYNIK: <span style="color:#000">${idealnaSuma}</span> | 
                PACZEK: <span style="color:green;font-size:16px">${(idealnaSuma / rozmiar)}</span>
            `);
            
        o.parent().parent().before(panel);
    };

    // --- 5. OBSŁUGA PRZYCISKU ---
    if (!document.getElementById('gemini-monitor')) {
        $('body').append('<div id="gemini-monitor"></div>');
        
        setInterval(() => {
            const btn = $('button[id*="generate"]');
            
            // Dodajemy przycisk tylko jeśli go nie ma
            if (btn.length && !$('#gemini-set-btn').length) {
                
                // Podpinamy naszą funkcję pod przycisk "Generuj"
                // Używamy .off() żeby nie dublować kliknięć
                btn.off('click.gemini').on('click.gemini', () => setTimeout(window.wykonajKorekte, 600));
                
                // Tworzymy przycisk "USTAW PACZKĘ"
                const setBtn = $('<button id="gemini-set-btn" class="btn"></button>')
                    .text(`USTAW PACZKĘ (${getR()})`)
                    .css({marginLeft: '5px'})
                    .on('click', (e) => {
                        e.preventDefault();
                        let v = prompt("Rozmiar paczki (ludność):", getR());
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
