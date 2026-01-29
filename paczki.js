(function() {
    const k = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    
    // Funkcja pobierająca rozmiar paczki
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    // Główna funkcja licząca (Korekta)
    window.wykonajKorekte = () => {
        const o = $('tbody[id$="output"]');
        if (!o.length) return;
        
        const rozmiar = getR();
        let suma = 0;
        
        // 1. Mapowanie kolumn (sprawdzamy gdzie są jakie jednostki w nagłówku)
        const colMap = {};
        const headerRow = $('thead tr').filter((i, e) => $(e).find('img[src*="unit_"]').length > 0).last();
        
        headerRow.find('th, td').each(function(idx) {
            const img = $(this).find('img[src*="unit_"]');
            if (img.length) {
                const uMatch = img.attr('src').match(/unit_(\w+)\.png/);
                if (uMatch) colMap[uMatch[1]] = idx;
            }
        });

        // 2. Liczenie sumy wojsk w tabeli
        const wiersze = o.find('tr');
        wiersze.each(function() {
            const row = $(this);
            for (const [unit, koszt] of Object.entries(k)) {
                if (colMap[unit] !== undefined) {
                    const cell = row.find('td').eq(colMap[unit]);
                    const val = parseInt(cell.text()) || 0;
                    suma += val * koszt;
                }
            }
        });

        // 3. Obliczanie nadmiaru i odejmowanie
        let nadmiar = suma % rozmiar;
        
        if (nadmiar > 0) {
            // Idziemy od dołu tabeli
            $(wiersze.get().reverse()).each(function() {
                const row = $(this);
                if (nadmiar <= 0) return false;

                // Sprawdzamy jednostki od końca (żeby nie zabierać pikinierów jeśli są CK)
                const unitsInOrder = Object.keys(colMap).reverse();
                
                for (const unit of unitsInOrder) {
                    if (nadmiar <= 0) break;
                    
                    const koszt = k[unit];
                    const colIdx = colMap[unit];
                    const cell = row.find('td').eq(colIdx);
                    let val = parseInt(cell.text()) || 0;

                    if (val > 0 && koszt > 0) {
                        const doZabrania = Math.min(val, Math.ceil(nadmiar / koszt));
                        
                        val -= doZabrania;
                        nadmiar -= (doZabrania * koszt);
                        
                        cell.text(val).css({'color': 'red', 'font-weight': 'bold', 'background': '#ffcccc'});
                    }
                }
            });
        }

        // 4. Wyświetlanie wyniku (beżowy pasek)
        $('#gemini-info').remove();
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

    // --- PĘTLA SPRAWDZAJĄCA ---
    // To ona odpowiada za pojawienie się przycisku
    if (!document.getElementById('gemini-monitor')) {
        $('body').append('<div id="gemini-monitor"></div>');
        
        setInterval(() => {
            // Szukamy przycisku Generuj
            const btn = $('button[id*="generate"]');
            
            // Jeśli przycisk Generuj jest, a naszego przycisku nie ma -> dodaj go
            if (btn.length && !$('#gemini-set-btn').length) {
                
                // Podpinamy naszą korektę pod kliknięcie "Generuj"
                btn.off('click.gemini').on('click.gemini', () => setTimeout(window.wykonajKorekte, 600));
                
                // Tworzymy przycisk "USTAW PACZKĘ"
                const setBtn = $('<button id="gemini-set-btn" class="btn"></button>')
                    .text(`USTAW PACZKĘ (${getR()})`)
                    .css({marginLeft: '5px', background: '#444', color: '#fff'}) // Dodałem kolor, żeby był widoczny
                    .on('click', (e) => {
                        e.preventDefault();
                        let v = prompt("Podaj wielkość paczki (ludność):", getR());
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
