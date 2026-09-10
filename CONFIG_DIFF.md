# Konfiguraatioerot: inderes.fi-verkkoalusta vs Inderes-konfiguraatio (ECharts 5)

Verkkoalustan arvot poimittu Mandatumin laajan raportin sivulta 10.9.2026 (React-propsien `option`). Molemmat ajavat Apache ECharts 5:tä SVG-renderöijällä.

| Ominaisuus | Verkkoalusta nyt | Inderes-konfiguraatio |
|---|---|---|
| Moottori | Apache ECharts 5 + echarts-for-react, renderer svg | Sama: Apache ECharts 5, renderer svg (ei React-riippuvuutta) |
| Sarjavärit | #3F3EFF, #BAC8FF, #C39CFF, #9d9d9d (+ #91a77f viivalle) | Talon järjestys: #3f3eff, #c49cff, #91a77f, #000000, #d4fcb3, #bac8ff, #fccebe; 4. väri #5F7A4F kun sarjoja >= 4 |
| Fontti | Inderes Sans vain CSS:n kautta; optio ei aseta fontFamilya | textStyle.fontFamily = GT America, Inderes Sans, Calibri, Arial; koko 12 |
| Tekstin väri | #666666 akselit, #333333 selite, #1d1f2b otsikko | Kaikki teksti #000000; alaotsikko #555555 |
| Otsikko | 16 px, fontWeight 600, yksikkö otsikossa | 16 px lihavoitu musta + alaotsikko 13 px (#555555) kantaa yksikön ja jakson |
| Selitteen ikoni | oletus roundRect 25 x 14, pyöristetyt kulmat | icon 'rect' 14 x 10, terävät kulmat; itemGap 18 |
| Desimaalierotin | Pilkku pylväissä, piste ympyräkaavion labelissa ja tooltipissa (39.7%) | Yksi formatteri (fiNum/fiPct) kaikkialla: 39,7 % |
| Prosenttimerkki | Kiinni luvussa: 39.7% | Välilyönti: 39,7 % |
| Negatiivinen luku | Unicode-miinus (U+2212) | Tavallinen yhdysmerkki: -3,8 (talon konventio) |
| Ruudukko | splitLine #eeeeee, y-akselin viiva piilossa | splitLine #d9d9d9, vasen akseliviiva #d9d9d9 näkyvissä, ei tick-viivoja vasemmalla |
| Oikea akseli | splitLine transparent, muuten sama kuin vasen | Ei ruudukkoa, tick 3 px #d9d9d9, yksikkö akselin nimenä |
| X-akseli | axisLine #cccccc, tickit oletuksena | axisLine #d9d9d9, ei tickejä, tekstit mustat |
| Pylväät | Oletusleveys, stack 'total', labelit sisällä 10 px | Leveys per arkkityyppi (60 % / 62 % / 26 % / 36 %), labelit 12 px mustat pylvään päällä tai lihavoituina pinon sisällä |
| Viivat | Leveys 3, ei symbolia | Leveys 2,25, timanttisymboli 8 px valkoisella reunalla, ei pehmennystä |
| Nollaviiva | Ei | markLine y=0, #9d9d9d 1 px, kun data ylittää nollan |
| Tooltip (pylväät/viivat) | trigger axis, axisPointer shadow, pyöreät 10 px markerit, arvo ilman yksikköä | Sama trigger ja varjo; neliömarkerit, sarjakohtainen desimaalimäärä ja yksikkö (52,5 MEUR / 20,3 %), reunus #e1dcdc, borderRadius 0 |
| Tooltip (ympyrä) | trigger item, 'Nimi: 40% (39.7%)' | trigger item, 'Nimi: 46 %' fiNum-formatterilla |
| Ympyrän korostus | emphasis: label 14 px bold + shadowBlur 10 rgba(0,0,0,0.5) | Sama korostus + scale 6 px; siivujen reunus valkoinen 2 px |
| Animaatio | animation false | animation false (sama) |
| Ennustevuodet | Ei erottelua | e-pääte kategoriassa (2026e), sama väri kuin toteumalla |
| Lähdeviite | Ei | Kuvaajan alla 'Lähde: LapWall, Inderes' |

Toteutus: `inderes_echarts.js` (palette, fiNum/fiPct, base(), arkkityypit comboColLine / stacked100Col / floatingCol / doughnut).
