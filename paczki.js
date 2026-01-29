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
        const colMap = {};
        
        // Szukamy w całym nagłówku tabeli, niezależnie od wierszy
        table.find('thead th, thead td').each(function() {
            const img = $(this).find('img[src*="unit_"]');
            if (img.length) {
                // Pobieramy nazwę jednostki z src
                const match = img.attr('src').match(/unit_(\w+)\.png/);
                if (match) {
                    // Kluczowe: pobieramy indeks tej komórki w jej wierszu
                    const idx = $(this).index();
                    colMap[match[1]] = idx;
                }
            }
        });

        // PLAN B: Jeśli nie znaleziono żadnych obrazków (np. dziwny widok), ustawiamy standardowy układ
        if (Object.keys(colMap).length === 0) {
            console.log('Gemini: Nie wykryto nagłówków, używam układu domyślnego.');
            // Standardowe indeksy (0 to checkbox, więc zaczynamy od 1)
            // Dostosuj jeśli Twój Hermitowski ma inną kolejność
            colMap['spear'] = 1; 
            colMap['sword'] = 2; 
            colMap['axe'] = 3; 
            colMap['archer'] = 4; // Jeśli świat bez łuczników, to pominie
            colMap['spy'] = 5; 
            colMap['light'] = 6; 
            colMap['marcher'] = 7; 
            colMap['heavy'] = 8; 
            colMap['ram'] = 9; 
            colMap['catapult'] = 10;
        }

        // --- 2. LICZENIE SUMY ---
        let suma = 0;
        const wiersze = tbody.find('tr');
        
        wiersze.each(function() {
            const row = $(this);
            // Iterujemy po wszystkich jednostkach jakie znamy
            for (const [unit, koszt] of Object.entries(k)) {
                // Sprawdzamy, czy w ogóle mamy taką kolumnę w mapie
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
                // Odwracamy kolejność znanych jednostek (żeby zacząć od cięższych/dalszych kolumn)
                const knownUnits = Object.keys(colMap).reverse();
                
                for (const unit of knownUnits) {
                    if (nadmiar <= 0) break;
                    
                    const koszt = k[unit];
                    // Pomijamy jednostki, których nie ma w cenniku (np. rycerz)
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
                <div style="font-size:1
