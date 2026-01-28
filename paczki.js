(function() {
    const k = {spear:1,sword:1,archer:1,axe:1,spy:2,light:4,marcher:4,heavy:4,ram:5,catapult:5,snob:100};
    const getR = () => parseInt(localStorage.getItem('g_p_s')) || 200;

    window.wyk = () => {
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

    if (!window.geminiInterval) {
        window.geminiInterval = setInterval(() => {
            let g = $('button[id*="generate"]');
            if (g.length && !g.data('h')) {
                g.on('click', () => setTimeout(window.wyk, 600)).data('h', 1);
            }
            if ($('.popup_helper').length && !$('#g-p-r').length) {
                $('.popup_helper table').append(`<tr id="g-p-r"><td>Wielkość paczki:</td><td><input type="number" id="g-v" value="${getR()}" style="width:50px"></td></tr>`);
                $('button:contains("Zapisz")').on('click', () => {
                    localStorage.setItem('g_p_s', $('#g-v').val());
                    alert("Zapisano wielkość paczki!");
                });
            }
        }, 1000);
    }
})();
