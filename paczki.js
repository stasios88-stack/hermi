(function() {
    const k = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    window.wykonajKorekte = () => {
        // Szukamy ciała tabeli z wynikami
        const tbody = $('tbody[id$="output"]');
        if (!tbody.length) return;
        
        // Znajdujemy całą tabelę (rodzica)
        const table = tbody.closest('table');
        const rozmiar = getR();
        
        // --- 1. AGRESYWNE MAPOWANIE KOLUMN ---
        // Zamiast szukać konkretnego wiersza, szukamy wszystkich komórek w nagłówku, które mają obrazek jednostki
        const colMap = {};
        
        // Szukamy w thead (nagłówku) komórek th lub td zawierających img z "unit_"
        table.find('thead tr').find('th, td').each(function() {
            const img = $(this).find('img[src*="unit_"]');
            if (img.length) {
                // Pobieramy nazwę jednostki z src
                const match = img.attr('src').match(/unit_(\w+)\.png/);
                if (match) {
                    // Kluczowe: pobieramy indeks tej komórki względem wiersza
                    // To nam powie, że np. 'spear' to kolumna nr 1
                    colMap[match[1]] = $(this).index();
                }
            }
        });

        // ZABEZPIECZENIE: Jeśli mapa jest pusta (dziwny błąd), zakładamy standardowy układ
        if (Object.keys(colMap).length === 0) {
            // Standardowy układ Hermitowskiego (może się różnić, ale to fallback)
            colMap['spear'] = 1; colMap['sword'] = 2; colMap['axe'] = 3; 
            colMap['spy'] = 4; colMap['light'] = 5; colMap['heavy'] = 6; 
            colMap['ram'] = 7; colMap['catapult'] = 8; colMap['snob'] = 9;
        }

        // --- 2. LICZENIE SUMY ---
        let suma = 0;
        const wiersze = tbody.find('tr');
        
        wiersze.each(function() {
            const row = $(this);
            // Iterujemy po wszystkich jednostkach jakie znamy
            for (const [unit, koszt] of Object.entries(k)) {
                // Sprawdzamy, czy w ogóle mamy taką kolumnę w tabeli
                const colIdx = colMap[unit];
                if (colIdx !== undefined) {
                    // Pobieramy komórkę o tym indeksie
                    const cell = row.find('td').eq(colIdx);
                    // Czyścimy tekst ze spacji i innych śmieci, bierzemy liczbę
                    const val = parseInt(cell.text().replace(/\D/g, '')) || 0;
                    suma += val * koszt;
                }
            }
        });

        // --- 3. KOREKTA (ODEJMOWANIE) ---
        let nadmiar = suma % rozmiar;
        
        if (nadmiar > 0) {
            // Idziemy od ostatniego wiersza w górę
            $(wiersze.get().reverse()).each(function() {
                const row = $(this);
                if (nadmiar <= 0) return false; 

                // Idziemy po kolumnach (jednostkach)
                // Odwracamy kolejność jednostek (żeby zacząć np. od ciężkiej kawalerii, jeśli jest po prawej)
                const knownUnits = Object.keys(colMap).reverse();
                
                for (const unit of knownUnits) {
                    if (nadmiar <= 0) break;
                    
                    const koszt = k[unit];
                    if (!koszt) continue;

                    const colIdx = colMap[unit];
                    const cell = row.find('td').eq(colIdx);
                    let val = parseInt(cell.text().replace(/\D/g, '')) || 0;

                    if (val > 0) {
                        // Obliczamy ile sztuk zabrać
                        const doZabrania = Math.min(val, Math.ceil(nadmiar / koszt));
                        
                        // Wykonujemy odejmowanie
                        val -= doZabrania;
                        nadmiar -= (doZabrania * koszt);
                        
                        // Aktualizujemy tabelę
                        cell.text(val).css({
                            'color': 'red', 
                            'font-weight': 'bold', 
                            'background-color': '#ffcccc' // Jasnoczerwone tło dla widoczności
                        });
                    }
                }
            });
        }

        // --- 4. RYSOWANIE PANELU ---
        $('#gemini-info').remove();
        
        // Obliczamy ile powinno być idealnie
        const idealnaSuma = suma - (suma % rozmiar);
        
        const panel = $('<div id="gemini-info"></div>')
            .css({
                background: '#dfcca6',
                border: '2px solid #7d510f',
                padding: '8px',
                marginTop: '5px',
                textAlign: 'center',
                fontWeight: 'bold',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            })
            .html(`
                <div style="font-size:11px;color:#555">SUMA PRZED KOREKTĄ: ${suma}</div>
                <div style="font-size:16px;margin-top:2px;">
                    WYNIK KOŃCOWY: <span style="color:#000">${idealnaSuma}</span> | 
                    PACZEK: <span style="color:green;font-size:18px">${(idealnaSuma / rozmiar).toFixed(0)}</span>
                </div>
            `);
            
        tbody.parent().parent().before(panel);
    };

    // --- 5. INITIALIZER ---
    if (!document.getElementById('gemini-monitor')) {
        $('body').append('<div id="gemini-monitor"></div>');
        
        setInterval(() => {
            const btn = $('button[id*="generate"]');
            
            // Jeśli jest przycisk Generuj, a nie ma naszego przycisku
            if (btn.length && !$('#gemini-set-btn').length) {
                // Podpinamy się pod kliknięcie
                btn.off('click.gemini').on('click.gemini', () => setTimeout(window.wykonajKorekte, 800));
                
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
