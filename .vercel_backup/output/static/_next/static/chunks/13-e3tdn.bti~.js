(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,17289,e=>{"use strict";function t(e){return(e/100).toFixed(2).replace(".",",").replace(/\B(?=(\d{3})+(?!\d))/g," ")}function a(e){let t=e.replace(/\s+/g,"").toUpperCase();if(!t.startsWith("SK")&&!/^[A-Z]{2}\d{2}/.test(t))return e;let a=[];for(let e=0;e<t.length;e+=4)a.push(t.substring(e,e+4));return a.join(" ")}function i(e){let i,o=Math.round(100*Number(e.amount)),n=Math.round(100*Number(e.balanceBefore)),l=Math.round(100*Number(e.balanceAfter)),r=e=>{let t=String(e.getDate()).padStart(2,"0"),a=String(e.getMonth()+1).padStart(2,"0"),i=e.getFullYear();return`${t}.${a}.${i}`},s=(e=>{if(!e)return new Date;let t=(e.includes(":")?e.substring(0,e.lastIndexOf(" ",e.indexOf(":"))).trim():e.trim()).replace(/\s+/g,"").split(".");if(t.length>=3){let e=parseInt(t[0],10),a=parseInt(t[1],10)-1;return new Date(parseInt(t[2],10),a,e,12,0,0)}return new Date})(e.createdAt),d=new Date(s.getTime()+864e5),c=r(s),p=r(d),m=a(e.fromAccountNumber),x=a(e.recipientAccountOrEmail),f=(i=e.recipientAccountOrEmail.replace(/\s+/g,"").toUpperCase()).startsWith("SK")&&i.length>=8&&({"0900":"GIBASKBX","0200":"SUBASKBX",1100:"TATRSKBX",1111:"UNCRSKBX",5600:"KOISSKBX",7500:"CEKOSKBX",8360:"FIOZSKBA",8330:"FIOZSKBA",6500:"3650SKBX",5200:"OTPVSKBX","0720":"NBSKSRBA"})[i.substring(4,8)]||"",g=e.status||"Štandardný platobný príkaz",b=`${x} ${e.recipientName}`;f&&(b+=` BIC: ${f}`),e.note&&(b+=` | Pozn\xe1mka: ${e.note}`);let h=`- ${t(o)}`;return t(l),t(n),`<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Potvrdenie o platbe</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    /* Z\xe1kladn\xfd reset */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body, html {
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden; /* Zabr\xe1ni scrollu */
      background: #f0f2f5;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1a1919;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* --- A4 WRAPPER (SCREEN OBAL) --- */
    .a4-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    /* --- A4 DOKUMENT (FIXN\xdd ROZMER) --- */
    .a4-document {
      width: 210mm;
      height: 297mm;
      min-width: 210mm;
      min-height: 297mm;
      flex-shrink: 0;
      background: white;
      position: relative;
      box-sizing: border-box;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
      transform-origin: center center;
      transform: scale(var(--scale, 1));
    }

    /* --- OBSAH (SKALOVAN\xdd) --- */
    .a4-content {
      width: 100%;
      height: 100%;
    }

    /* 1. RESPONZ\xcdVNY ZOBRAZOVAC\xcd REŽIM (SCREEN) */
    @media screen {
      .page {
        width: 100% !important;
        height: 100% !important;
        background-color: #ffffff;
        position: relative;
        padding: 66px 70px 44px 78px;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .vertical-text {
        display: none; /* Na obrazovke skryjeme */
      }
      .details-box {
        background-color: #d4e0e2;
        border-radius: 6px;
        padding: 10px 14px 12px 14px;
        display: grid;
        grid-template-columns: 1.08fr 1fr;
        gap: 28px;
        margin-bottom: 30px;
      }
      .transaction-box {
        border: 1px solid #4e4f4f;
        border-radius: 8px;
        flex-grow: 1;
        box-sizing: border-box;
        padding: 12px;
        background-color: #ffffff;
        margin-bottom: 30px;
      }
      .table-wrapper {
        overflow: visible;
        width: 100%;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      .table-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
    }

    /* 2. PR\xcdSNY REŽIM PRE TLAČ / PDF (PRINT) */
    @media print {
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        background-color: #ffffff;
      }
      .a4-wrapper {
        display: block;
        height: auto;
        width: auto;
        overflow: visible;
      }
      .a4-document {
        width: 210mm;
        height: 297mm;
        min-width: 210mm;
        min-height: 297mm;
        transform: none !important;
        margin: 0;
        box-shadow: none;
      }
      .page {
        width: 100% !important;
        height: 100% !important;
        position: relative;
        padding: 66px 70px 44px 78px !important;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .vertical-text {
        display: block !important;
        position: absolute;
        left: 58px;
        bottom: 108px;
        transform: rotate(-90deg);
        transform-origin: left bottom;
        color: #a6b2b9;
        font-size: 8px;
        font-weight: 500;
        letter-spacing: 0.5px;
      }
      .details-box {
        background-color: #d4e0e2 !important;
        border-radius: 6px;
        padding: 10px 14px 12px 14px !important;
        display: grid !important;
        grid-template-columns: 1.08fr 1fr !important;
        grid-column-gap: 28px !important;
        height: 102px !important;
        margin-bottom: 39px !important;
      }
      .table-wrapper {
        overflow: visible !important;
        width: 100% !important;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      .table-container {
        min-width: 0 !important;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      .transaction-box {
        border: 1px solid #4e4f4f !important;
        border-radius: 8px !important;
        flex-grow: 1 !important;
        padding: 12px !important;
        background-color: #ffffff !important;
        margin-bottom: 49px !important;
      }
      .transaction-row {
        page-break-inside: avoid;
      }
      /* Pre spr\xe1vne zobrazenie pozad\xed v tlači Chrome/Edge */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* 3. SPOLOČN\xc9 ŠT\xddLY (PLatia všade) */
    .header-section { margin-bottom: 22px; }
    .logo-row { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .logo-text-col { display: flex; flex-direction: column; line-height: 1; }
    .logo-main-row { display: flex; align-items: flex-end; }
    .logo-title { font-size: 27px; font-weight: 900; color: #1a1919; letter-spacing: -0.5px; }
    .logo-icon-wrapper { margin-left: 10px; display: flex; align-items: center; }
    .erste-symbol { width: 32px; height: 32px; }
    .logo-subtitle { font-size: 21px; font-weight: 500; color: #1a1919; margin-top: -2px; letter-spacing: -0.3px; }
    .bank-details { font-size: 9.5px; color: #1a1919; line-height: 1.4; font-weight: 500; }
    .document-title { font-size: 19px; font-weight: 700; color: #1a1919; margin-bottom: 6px; }
    
    .details-col { display: flex; flex-direction: column; justify-content: space-between; }
    .details-row { display: flex; align-items: center; position: relative; padding-bottom: 2px; border-bottom: 1.5px solid #8a9fac; height: 20px; box-sizing: border-box; }
    .details-row.row-large { height: 24px; padding-bottom: 3px; }
    .marker { width: 10px; height: 10px; background-color: #536f85; border-radius: 50%; margin-right: 6px; flex-shrink: 0; }
    .label { font-size: 11px; font-weight: 700; color: #1a1919; }
    .value { font-size: 11px; font-weight: 700; color: #1a1919; margin-left: auto; word-break: break-word; }
    .value-large { font-size: 16px; font-weight: 700; color: #000000; margin-left: auto; }
    .value-right { margin-left: auto; }
    
    .info-section { margin-bottom: 7px; display: flex; flex-direction: column; }
    .info-title-row { display: flex; align-items: center; border-bottom: 1.5px solid #8a9fac; width: 326px; max-width: 100%; padding-bottom: 2px; margin-bottom: 10px; }
    .info-title { font-size: 11px; font-weight: 700; color: #1a1919; }
    .info-body { font-size: 12.5px; color: #1a1919; line-height: 1.4; font-weight: 500; }
    
    .table-header { background-color: #d4e0e2; border: 1px solid #4e4f4f; border-top-left-radius: 8px; border-top-right-radius: 8px; height: 37px; display: grid; grid-template-columns: 85px 95px 1fr 110px; box-sizing: border-box; align-items: center; padding: 0 12px; margin-bottom: 10px; gap: 8px; }
    .header-cell { font-size: 10px; font-weight: 800; color: #1a1919; line-height: 1.1; }
    .cell-left { text-align: left; }
    .cell-right { text-align: right; padding-right: 20px; }
    .transaction-row { display: grid; grid-template-columns: 85px 95px 1fr 110px; align-items: start; box-sizing: border-box; gap: 8px; }
    .body-cell { font-size: 12px; color: #1a1919; line-height: 1.25; word-break: break-word; }
    
    .popis-cell { display: flex; flex-direction: column; }
    .popis-title { font-weight: 700; margin-bottom: 2px; }
    .popis-subtext { font-size: 11px; color: #1a1919; font-weight: 400; }
    
    .footer { display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; padding: 0 2px; margin-top: auto; flex-wrap: wrap; gap: 10px; }
    .footer-item { font-size: 11px; font-weight: 700; color: #1a1919; }
  </style>
</head>
<body>
  <div class="a4-wrapper">
    <div class="a4-document">
      <div class="a4-content">
        <div class="page">
          <div class="vertical-text">MO10_v203_1000280073</div>
          <div class="header-section">
            <div class="logo-row">
              <div class="logo-text-col">
                <div class="logo-main-row">
                  <span class="logo-title">SLOVENSK\xc1</span>
                </div>
                <span class="logo-subtitle">sporiteľňa</span>
              </div>
            </div>
            <div class="bank-details">
              Slovensk\xe1 sporiteľňa, a.s.<br>
              Tom\xe1šikova 48, 832 37 Bratislava<br>
              IČO 00 151 653, zap\xedsan\xe1 v Obchodnom registri<br>
              Mestsk\xe9ho s\xfadu Bratislava III., oddiel Sa, vložka č. 601/B
            </div>
          </div>

          <div class="document-title">V\xfdpis z \xdačtu:</div>

          <div class="details-box">
            <div class="details-col">
              <div class="details-row row-large">
                <span class="marker"></span>
                <span class="label">N\xe1zov \xdačtu</span>
                <span class="value value-large">Tom\xe1š Hud\xe1k</span>
              </div>
              <div class="details-row">
                <span class="marker"></span>
                <span class="label">Č\xedslo \xdačtu</span>
                <span class="value">${m}</span>
              </div>
              <div class="details-row">
                <span class="marker"></span>
                <span class="label">BIC</span>
                <span class="value value-right">GIBASKBX</span>
              </div>
              <div class="details-row">
                <span class="marker"></span>
                <span class="label">Mena</span>
                <span class="value value-right">${e.currency}</span>
              </div>
            </div>
            <div class="details-col">
              <div class="details-row row-large">
                <span class="marker"></span>
                <span class="label">\xdačtovn\xe9 obdobie</span>
                <span class="value">${(e=>{if(!e)return"";let t=(e.includes(":")?e.substring(0,e.lastIndexOf(" ",e.indexOf(":"))).trim():e.trim()).replace(/\s+/g,"").split(".");if(t.length>=3){let e=t[0].padStart(2,"0"),a=t[1].padStart(2,"0"),i=t[2];return`${e}.${a}.${i}`}return e})(e.createdAt)}</span>
              </div>
              <div class="details-row" style="border-bottom: none; height: 20px;"></div>
              <div class="details-row">
                <span class="marker"></span>
                <span class="label">Vklady spolu</span>
                <span class="value">0,00</span>
              </div>
              <div class="details-row">
                <span class="marker"></span>
                <span class="label">V\xfdbery spolu</span>
                <span class="value">- ${t(o)}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="info-title-row">
              <span class="marker"></span>
              <span class="info-title">Inform\xe1cia pre klienta</span>
            </div>
            <div class="info-body">
              Autorizovan\xe9 dňa ${e.createdAt} cez George kľ\xfač (mToken)
            </div>
          </div>

          <div class="table-container">
            <div class="table-wrapper">
              <div class="table-header">
                <div class="header-cell cell-left">D\xe1tum<br>valuty</div>
                <div class="header-cell cell-left">D\xe1tum<br>z\xfačtovania</div>
                <div class="header-cell cell-left">Popis<br>transakcie</div>
                <div class="header-cell cell-right">Suma<br>transakcie</div>
              </div>

              <div class="transaction-box">
                <div class="transaction-row">
                  <div class="body-cell cell-left">${c}</div>
                  <div class="body-cell cell-left">${p}</div>
                  <div class="body-cell cell-left popis-cell">
                    <span class="popis-title">${g}</span>
                    <span class="popis-subtext">${b}</span>
                  </div>
                  <div class="body-cell cell-right">${h}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-item">info@slsp.sk</div>
            <div class="footer-item">Klientske centrum: 0850 111 888</div>
            <div class="footer-item">www.slsp.sk</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    (function() {
      const documentEl = document.querySelector('.a4-document');

      if (!documentEl) return;

      function calculateScale() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const docWidth = 210; // mm
        const docHeight = 297; // mm

        // Prevod mm na px (96 DPI = 3.7795275591 px/mm)
        const pxWidth = docWidth * 3.7795275591;
        const pxHeight = docHeight * 3.7795275591;

        // Vypocet scale s 10px paddingom z kazdej strany
        const scale = Math.min(
          (vw - 20) / pxWidth,
          (vh - 20) / pxHeight
        );

        // Limitujeme maximalnu mierku na 1, aby sa na desktope nezvacsoval nad standardnu velkost
        documentEl.style.setProperty('--scale', Math.max(0.1, Math.min(scale, 1)));
      }

      window.addEventListener('load', calculateScale);
      window.addEventListener('resize', calculateScale);
      calculateScale();
      setTimeout(calculateScale, 100);
    })();
  </script>
</body>
</html>`}async function o(e){let t,a,o=new Blob([i(e)],{type:"text/html; charset=utf-8"}),n=URL.createObjectURL(o),l=document.createElement("a");l.href=n,t=(e.variableSymbol||"bez-vs").replace(/[^\w-]+/g,""),a=e.createdAt.split(" ")[0]?.replace(/\./g,"-")||"datum",l.download=`potvrdenie-${t}-${a}.html`,l.click(),URL.revokeObjectURL(n)}e.s(["downloadPaymentConfirmationPdf",0,o,"openPaymentConfirmationHtml",0,function(e){let t=new Blob([i(e)],{type:"text/html; charset=utf-8"}),a=URL.createObjectURL(t);window.open(a,"_blank","noopener,noreferrer"),window.setTimeout(()=>URL.revokeObjectURL(a),6e4)}])},23498,e=>{"use strict";var t=e.i(43476),a=e.i(17289);e.s(["default",0,function(){return(0,t.jsxs)("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",flexDirection:"column"},children:[(0,t.jsx)("h1",{style:{marginBottom:"20px",fontSize:"24px"},children:"HTML Export"}),(0,t.jsx)("button",{onClick:()=>{(0,a.downloadPaymentConfirmationPdf)({transactionId:"TXN-2026-000001",createdAt:"25. 6. 2026 03:59:00",status:"Štandardný platobný príkaz",transferType:"external",fromAccountNumber:"SK67 0900 0000 0050 3231 6123",recipientName:"Jozef Mak",recipientAccountOrEmail:"SK99 0900 0000 0000 1234 5678",amount:"100",currency:"EUR",variableSymbol:"1234567890",constantSymbol:"0308",specificSymbol:"",note:"",payerReference:"",dueDate:"26. 6. 2026",repeatDays:"",createTemplate:!1,emailConfirmation:!1,balanceBefore:"1000.00",balanceAfter:"900.00"}).catch(console.error)},style:{padding:"10px 20px",fontSize:"18px",background:"#000",color:"#fff",borderRadius:"8px",cursor:"pointer"},children:"Stiahnuť potvrdenie"})]})}])}]);