(function() {
    const k = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    
    // Pobieranie rozmiaru paczki z pamięci
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    window.wykonajKorekte = () => {
        const o = $('tbody[id$="output"]');
        if (!o.length) return;
        
        const rozmiar = getR();
        
        // 1. Mapowanie kolumn (Inteligentne wykrywanie, gdzie jest jaka jednostka)
        const colMap = {};
        // Szukamy wiersza nagłówka, który zawiera obrazki jednostek
        const headerRow = $('thead tr').filter((i, e) => $(e).find('img[src*="unit_"]').length > 0).last();
        
        headerRow.find('th, td').each(function(idx) {
            const img = $(this).find('img[src*="unit_"]');
            if (img.length) {
                const uName = img.attr('src').match(/unit_(\w+)\.png/)[1];
                colMap[uName] = idx;
            }
        });

        // 2. Liczenie aktualnej sumy
        let suma = 0;
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

        // 3. Korekta nadmiaru (Odejmowanie)
        let nadmiar = suma % rozmiar;
        
        if (nadmiar > 0) {
            // Idziemy od dołu tabeli
            $(wiersze.get().reverse()).each(function() {
                const row = $(this);
                if (nadmiar <= 0) return false; // Przerwij, jeśli już wyrównano

                // Idziemy po jednostkach (od najcięższych/ostatnich w mapie, żeby nie psuć proporcji, albo po prostu po kolei)
                // Tutaj iterujemy po mapie kolumn
                const unitsInOrder = Object.keys(colMap).reverse(); // Od prawej do lewej (zazwyczaj Ciężka jest po prawej)
                
                for (const unit of unitsInOrder) {
                    if (nadmiar <= 0) break;
                    
                    const koszt = k[unit];
                    const colIdx = colMap[unit];
                    const cell = row.find('td').eq(colIdx);
                    let val = parseInt(cell.text()) || 0;

                    if (val > 0 && koszt > 0) {
                        // Ile sztuk tej jednostki musimy zabrać, żeby zbić nadmiar?
                        // Math.ceil, bo np. jak nadmiar to 1, a jednostka to CK (4), musimy zabrać 1 CK (zdejmując 4 pop)
                        const doZabrania = Math.min(val, Math.ceil(nadmiar / koszt));
                        
                        val -= doZabrania;
                        nadmiar -= (doZabrania * koszt); // Nadmiar może zejść poniżej zera (to OK, lepiej wysłać 197 niż 201)
                        
                        cell.text(val).css({'color': 'red', 'font-weight': 'bold', 'background': '#ffcccc'});
                    }
                }
            });
        }

        // 4. Wyświetlanie panelu
        $('#gemini-info').remove();
        
        // Obliczamy ostateczną sumę po korekcie (dla wyświetlenia)
        // Uwaga: Jeśli 'nadmiar' zeszedł na minus (np. -2), to znaczy że odjęliśmy trochę za dużo, 
        // ale to bezpieczniejsze niż wysłanie za dużo.
        // Wyświetlana suma to: (PoczątkowaSuma - (PoczątkowyNadmiar - KońcowyNadmiar))
        // Ale prościej: po prostu policzmy paczki z matematyki, bo tabela jest już poprawiona.
        const idealnaSuma = suma - (suma % rozmiar); 
        // Jeśli nadmiar jest ujemny (np. usunęliśmy 1 CK za dużo), to realna suma w tabeli jest mniejsza niż idealna.
        // Ale zostawmy w panelu "WYNIK" jako cel, w który celowaliśmy.
        
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
                CEL: <span style="color:#000">${idealnaSuma}</span> | 
                PACZEK: <span style="color:green;font-size:16px">${(idealnaSuma / rozmiar)}</span>
            `);
            
        o.parent().parent().before(panel);
    };

    if (!document.getElementById('gemini-monitor')) {
        $('body').append('<div id="gemini-monitor"></div>');
        
        setInterval(() => {
            const btn = $('button[id*="generate"]');
            
            if (btn.length && !$('#gemini-set-btn').length) {
                // Podpięcie korekty (z lekkim opóźnieniem, żeby tabela zdążyła się narysować)
                btn.on('click', () => setTimeout(window.wykonajKorekte, 800));
                
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
