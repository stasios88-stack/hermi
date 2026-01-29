(function() {
    const k = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    
    // Pobieranie rozmiaru paczki z pamięci
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    window.wykonajKorekte = () => {
        const o = $('tbody[id$="output"]');
        if (!o.length) return;
        
        const rozmiar = getR();
        
        // 1. Mapowanie kolumn (Wersja klasyczna)
        const colMap = {};
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
            $(wiersze.get().reverse()).each(function() {
                const row = $(this);
                if (nadmiar <= 0) return false;

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

        // 4. Wyświetlanie panelu
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
