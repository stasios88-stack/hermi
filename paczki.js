(function() {
    // Cennik (wagi) jednostek
    const koszty = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    
    // Pobieranie ustawionej wielkości paczki
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    window.wykonajKorekte = () => {
        // Znajdujemy tabelę wyników
        const tabela = $('tbody[id$="output"]');
        if (!tabela.length) return; // Jeśli nie ma tabeli, kończymy

        const rozmiar = getR();
        let sumaTotal = 0;
        let colMap = {};

        // KROK 1: MAPOWANIE KOLUMN (Metoda "Snajperska")
        // Szukamy w całym nagłówku (thead) komórek, które mają w sobie obrazek jednostki
        tabela.closest('table').find('thead th, thead td').each(function() {
            const img = $(this).find('img[src*="unit_"]');
            if (img.length) {
                // Wyciągamy nazwę jednostki z linku obrazka (np. "spear")
                const match = img.attr('src').match(/unit_(\w+)\.png/);
                if (match) {
                    const unitName = match[1];
                    // Zapamiętujemy numer kolumny (index)
                    colMap[unitName] = $(this).index();
                }
            }
        });

        // KROK 2: LICZENIE WOJSKA
        const wiersze = tabela.find('tr');
        
        wiersze.each(function() {
            const row = $(this);
            for (const [unit, waga] of Object.entries(koszty)) {
                // Jeśli znaleźliśmy kolumnę dla tej jednostki
                if (colMap[unit] !== undefined) {
                    const idx = colMap[unit];
                    // Pobieramy komórkę o tym numerze
                    const cell = row.find('td').eq(idx);
                    // Czyścimy wartość (usuwamy spacje, bierzemy tylko cyfry)
                    let val = parseInt(cell.text().trim()) || 0;
                    
                    sumaTotal += val * waga;
                }
            }
        });

        // KROK 3: KOREKTA (Odejmowanie nadmiaru)
        let nadmiar = sumaTotal % rozmiar;
        
        if (nadmiar > 0) {
            // Idziemy od dołu tabeli
            $(wiersze.get().reverse()).each(function() {
                const row = $(this);
                if (nadmiar <= 0) return false; // Jak już wyrównaliśmy, przerywamy

                // Sprawdzamy jednostki (odwracamy kolejność, żeby zacząć od prawej strony tabeli)
                const unitsReverse = Object.keys(colMap).reverse();
                
                for (const unit of unitsReverse) {
                    if (nadmiar <= 0) break;
                    
                    const waga = koszty[unit];
                    const idx = colMap[unit];
                    const cell = row.find('td').eq(idx);
                    let val = parseInt(cell.text().trim()) || 0;

                    if (val > 0 && waga > 0) {
                        // Obliczamy ile zabrać
                        const doZabrania = Math.min(val, Math.ceil(nadmiar / waga));
                        
                        val -= doZabrania;
                        nadmiar -= (doZabrania * waga);
                        
                        // Zmieniamy liczbę w tabeli na czerwoną
                        cell.text(val).css({'color': 'red', 'fontWeight': 'bold', 'backgroundColor': '#ffcccc'});
                    }
                }
            });
        }

        // KROK 4: PANEL INFORMACYJNY
        $('#gemini-info').remove();
        const wynikKoncowy = sumaTotal - (sumaTotal % rozmiar);
        const iloscPaczek = (wynikKoncowy / rozmiar).toFixed(1); // Pokazujemy z 1 miejscem po przecinku dla pewności

        const panel = $('<div id="gemini-info"></div>')
            .css({
                background: '#dfcca6', border: '2px solid #7d510f', padding: '10px',
                marginTop: '5px', textAlign: 'center', fontWeight: 'bold', borderRadius: '5px', fontSize: '14px'
            })
            .html(`WYNIK: ${wynikKoncowy} | PACZEK: <span style="color:green;font-size:18px">${Math.floor(iloscPaczek)}</span>`);
            
        tabela.parent().parent().before(panel);
    };

    // START SKRYPTU
    if (!document.getElementById('gemini-monitor')) {
        $('body').append('<div id="gemini-monitor"></div>');
        
        setInterval(() => {
            const btn = $('button[id*="generate"]');
            
            // Jeśli jest przycisk Generuj, a nie ma naszego przycisku
            if (btn.length && !$('#gemini-set-btn').length) {
                
                // Podpinamy naszą korektę pod przycisk Generuj
                btn.off('click.gemini').on('click.gemini', () => setTimeout(window.wykonajKorekte, 600));
                
                // Dodajemy przycisk USTAW PACZKĘ
                const setBtn = $('<button id="gemini-set-btn" class="btn">USTAW PACZKĘ (' + getR() + ')</button>')
                    .css({marginLeft: '5px'})
                    .on('click', (e) => {
                        e.preventDefault();
                        let v = prompt("Wielkość paczki:", getR());
                        if (v) { 
                            localStorage.setItem('gemini_paczka_size', v); 
                            setBtn.text('USTAW PACZKĘ (' + v + ')');
                        }
                    });
                btn.after(setBtn);
            }
        }, 1000);
    }
})();
