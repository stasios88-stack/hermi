(function() {
    const k = { spear: 1, sword: 1, archer: 1, axe: 1, spy: 2, light: 4, marcher: 4, heavy: 4, ram: 5, catapult: 5, snob: 100 };
    const getR = () => parseInt(localStorage.getItem('gemini_paczka_size')) || 200;

    // --- MODUŁ 1: KOREKTA PACZEK (TABELA WYNIKOWA) ---
    window.wykonajKorekte = () => {
        const o = $('tbody[id$="output"]'), r = getR(); 
        if (!o.length) return;
        
        let s = 0, w = o.find('tr'), n = $('thead img[src*="unit_"]').map((i, e) => e.src.match(/unit_(\w+)\.png/)[1]).get();
        
        w.each((i, row) => {
            n.forEach((u, x) => {
                s += (parseInt($(row).find('td').eq(x + 1).text()) || 0) * (k[u] || 0);
            });
        });

        let d = s % r; 
        if (d > 0) {
            for (let i = w.length - 1; i >= 0 && d > 0; i--) {
                for (let j = n.length - 1; j >= 0 && d > 0; j--) {
                    let c = w.eq(i).find('td').eq(j + 1), v = parseInt(c.text()) || 0, uN = n[j], ko = k[uN] || 0;
                    if (v > 0 && ko > 0) {
                        let z = Math.min(v, Math.ceil(d / ko));
                        v -= z; d -= z * ko;
                        c.text(v).css({'color': 'red', 'font-weight': 'bold'});
                    }
                }
            }
        }
        $('#g-i').remove();
        o.parent().before(`<div id="g-i" style="background:#dfcca6;border:2px solid #7d510f;padding:8px;text-align:center;font-weight:bold;margin-bottom:5px;">WYNIK: ${s - (s % r)} | PACZEK: ${(s - (s % r)) / r}</div>`);
    };

    // --- MODUŁ 2: STAŁKI (ROZPLANOWANIE) ---
    window.otworzStalki = () => {
        const html = `
        <div id="gemini-stalki-modal" style="position:fixed;top:10%;left:50%;transform:translate(-50%,0);width:400px;background:#f4e4bc;border:2px solid #7d510f;padding:15px;z-index:99999;box-shadow:0 0 10px #000;">
            <h3 style="text-align:center;color:#603000;margin-top:0;">ROZPISKA STAŁEK</h3>
            <textarea id="stalki-input" placeholder="Wklej tutaj tabelkę z forum..." style="width:100%;height:100px;margin-bottom:10px;"></textarea>
            <div id="stalki-info" style="font-weight:bold;margin-bottom:10px;text-align:center;">Czekam na dane...</div>
            <div style="display:flex;justify-content:space-between;">
                <button class="btn" onclick="$('#gemini-stalki-modal').remove()">Anuluj</button>
                <button class="btn btn-confirm-yes" id="btn-przelicz-stalki">PRZELICZ I WYPEŁNIJ</button>
            </div>
        </div>`;
        
        $('body').append(html);

        $('#btn-przelicz-stalki').click(() => {
            const txt = $('#stalki-input').val();
            const coords = (txt.match(/\d{3}\|\d{3}/g) || []); // Wyciągamy kordy
            const uniqueCoords = [...new Set(coords)]; // Usuwamy duplikaty
            
            if (uniqueCoords.length === 0) {
                alert("Nie znaleziono żadnych współrzędnych w tekście!");
                return;
            }

            // 1. Zliczamy wojsko w wiosce (czytamy ze strony)
            let totalPop = 0;
            // Szukamy tabeli z wojskiem (zależnie od widoku, zazwyczaj jest w .vis przy obrazkach jednostek)
            // Najbezpieczniej: szukamy obrazków unit_X.png i czytamy liczby obok/pod nimi
            // Dla pewności w Hermitowskim - on sam pokazuje wojsko w nagłówku tabeli, ale zanim wygenerujemy, musimy zgadywać.
            // Spróbujemy zczytać z ogólnego podglądu wioski (prawa strona lub środek)
            
            // Prosta metoda: szukamy wszystkich elementów z ikonami jednostek i sumujemy
            $('img[src*="unit_"]').each(function() {
                const uMatch = this.src.match(/unit_(\w+)\.png/);
                if (uMatch) {
                    const unitName = uMatch[1];
                    if (k[unitName]) {
                        // Szukamy liczby w pobliżu obrazka (zazwyczaj w tym samym TD lub obok)
                        let container = $(this).parent(); 
                        let count = parseInt(container.text().replace(/\D/g, ''));
                        
                        // Czasem liczba jest w osobnym TD (widok klasyczny)
                        if (isNaN(count)) count = parseInt(container.next().text().replace(/\D/g, ''));
                        // Czasem jest to widget po prawej
                        if (isNaN(count)) count = parseInt($(this).closest('tr').find('td:last').text().replace(/\D/g, ''));

                        if (!isNaN(count) && count > 0 && count < 50000) { // Zabezpieczenie przed dziwnymi liczbami
                            totalPop += count * k[unitName];
                        }
                    }
                }
            });

            // Fallback: jeśli skrypt nie widzi wojska (np. niestandardowy widok), zapytaj usera
            if (totalPop < 100) {
                let manualPacks = prompt("Nie widzę wojska w tej wiosce. Ile masz dostępnych paczek?", "0");
                if (manualPacks) totalPop = parseInt(manualPacks) * getR();
            }

            const rozmiar = getR();
            const dostepnePaczki = Math.floor(totalPop / rozmiar);
            const naWioske = Math.floor(dostepnePaczki / uniqueCoords.length);
            const reszta = dostepnePaczki % uniqueCoords.length;

            if (dostepnePaczki === 0) {
                $('#stalki-info').html(`<span style="color:red">Brak pełnych paczek (Ludność: ${totalPop})</span>`);
                return;
            }

            // Wypełnianie Hermitowskiego
            // Szukamy inputów po etykietach (najbezpieczniejsza metoda)
            let celInput = null;
            let iloscInput = null;

            // Szukamy po tekście w labelach lub sąsiednich komórkach
            $('td, th').each(function() {
                if ($(this).text().includes('Cel')) celInput = $(this).parent().find('input[type="text"]').first();
                if ($(this).text().includes('Ilość deffa') || $(this).text().includes('Ilość')) {
                     // Czasem "Ilość deffa" ma input bezpośrednio obok
                     let input = $(this).parent().find('input[type="text"]').first();
                     // Jeśli znaleziony input to ten sam co Cel (rzadki przypadek), szukamy dalej
                     if (input.length && input[0] !== (celInput ? celInput[0] : null)) iloscInput = input;
                }
            });
            
            // Fallback dla specyficznego układu Hermitowskiego (widocznego na screenach)
            if (!celInput || celInput.length === 0) celInput = $('input[name*="target"], input[class*="target"]').first(); 
            // W Hermitowskim input od ilości jest często drugi z kolei w głównym rzędzie
            if (!iloscInput || iloscInput.length === 0) {
                 const allInputs = $('.popup_helper input[type="text"]');
                 if (allInputs.length >= 2) {
                     celInput = allInputs.eq(0);
                     iloscInput = allInputs.eq(1);
                 }
            }

            if (celInput && iloscInput) {
                celInput.val(uniqueCoords.join(' '));
                iloscInput.val(naWioske);
                
                $('#stalki-info').html(`
                    Dostępne paczki: ${dostepnePaczki}<br>
                    Celów: ${uniqueCoords.length}<br>
                    <span style="color:green;font-size:14px;">WYPEŁNIONO: Po ${naWioske} paczek na cel!</span><br>
                    <span style="font-size:10px;color:#555;">(Zostanie ${reszta} paczek luźnych)</span>
                `);
                
                // Mrugnięcie inputami dla efektu
                celInput.css('background', '#lightgreen').animate({backgroundColor: '#fff'}, 1000);
                iloscInput.css('background', '#lightgreen').animate({backgroundColor: '#fff'}, 1000);
            } else {
                alert("Nie mogę znaleźć pól Hermitowskiego! Upewnij się, że panel jest otwarty.");
            }
        });
    };

    // --- INITIALIZER ---
    if (!window.geminiInterval) {
        window.geminiInterval = setInterval(() => {
            // Przycisk KOREKTA (przy Generuj)
            let g = $('button[id*="generate"]');
            if (g.length && !g.data('h')) {
                g.on('click', () => setTimeout(window.wykonajKorekte, 600)).data('h', 1);
                
                // Przycisk STAŁKI (nowy)
                const btnStalki = $('<button class="btn">STAŁKI</button>')
                    .css({marginLeft: '5px', fontWeight: 'bold', background: '#f0c040'})
                    .click((e) => { e.preventDefault(); window.otworzStalki(); });
                
                // Przycisk USTAW PACZKĘ
                const btnUstaw = $('<button class="btn"></button>')
                    .text(`USTAW PACZKĘ (${getR()})`)
                    .css({marginLeft: '5px'})
                    .click((e) => {
                        e.preventDefault();
                        let v = prompt("Rozmiar paczki:", getR());
                        if (v) { localStorage.setItem('gemini_paczka_size', v); btnUstaw.text(`USTAW PACZKĘ (${v})`); }
                    });

                g.after(btnUstaw).after(btnStalki);
            }
        }, 1000);
    }
})();
