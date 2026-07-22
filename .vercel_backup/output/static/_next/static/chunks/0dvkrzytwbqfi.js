(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,56420,e=>{"use strict";var t=e.i(71645);let a=(...e)=>e.filter((e,t,a)=>!!e&&""!==e.trim()&&a.indexOf(e)===t).join(" ").trim(),s=e=>{let t=e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,a)=>a?a.toUpperCase():t.toLowerCase());return t.charAt(0).toUpperCase()+t.slice(1)};var l={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let r=(0,t.createContext)({}),n=(0,t.forwardRef)(({color:e,size:s,strokeWidth:n,absoluteStrokeWidth:i,className:o="",children:d,iconNode:c,...x},p)=>{let{size:m=24,strokeWidth:h=2,absoluteStrokeWidth:u=!1,color:b="currentColor",className:f=""}=(0,t.useContext)(r)??{},g=i??u?24*Number(n??h)/Number(s??m):n??h;return(0,t.createElement)("svg",{ref:p,...l,width:s??m??l.width,height:s??m??l.height,stroke:e??b,strokeWidth:g,className:a("lucide",f,o),...!d&&!(e=>{for(let t in e)if(t.startsWith("aria-")||"role"===t||"title"===t)return!0;return!1})(x)&&{"aria-hidden":"true"},...x},[...c.map(([e,a])=>(0,t.createElement)(e,a)),...Array.isArray(d)?d:[d]])});e.s(["default",0,(e,l)=>{let r=(0,t.forwardRef)(({className:r,...i},o)=>(0,t.createElement)(n,{ref:o,iconNode:l,className:a(`lucide-${s(e).replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}`,`lucide-${e}`,r),...i}));return r.displayName=s(e),r}],56420)},22623,e=>{"use strict";e.i(47167);var t=e.i(43476),a=e.i(71645),s=e.i(18566),l=e.i(72136),r=e.i(56420);let n=(0,r.default)("menu",[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]]),i=(0,r.default)("power",[["path",{d:"M12 2v10",key:"mnfbl"}],["path",{d:"M18.4 6.6a9 9 0 1 1-12.77.04",key:"obofu9"}]]);var o=e.i(31409);e.s(["DashboardHeader",0,function({account:e}){var r;let d=(0,s.useRouter)(),[c,x]=(0,a.useState)(!1),p=(0,o.useTranslation)(),m=e?.displayName??"SPACE účet",h=e?.balance!==void 0?`€ ${null==(r=e.balance)?"0,00":(Number(r)/100).toFixed(2).replace(".",",")}`:null,u=async()=>{await l.authClient.signOut(),d.push("/sign-in"),d.refresh()},b=e=>{x(!1),"history"===e?d.push("/dashboard"):"new-payment"===e?window.dispatchEvent(new CustomEvent("open-transfer-modal")):"payment-orders"===e?d.push("/dashboard/payment-orders"):"assistant"===e?d.push("/dashboard/assistant"):"notifications"===e?f():"statements"===e&&d.push("/dashboard/statements/generator")},f=async()=>{if(!("Notification"in window)||!("serviceWorker"in navigator))return alert("Tento prehliadač nepodporuje notifikácie.");if("granted"===await Notification.requestPermission())try{return await navigator.serviceWorker.ready,void console.error("VAPID public key not found in env")}catch(e){console.error("Error subscribing to push:",e)}},g=[{label:p.dashboard.menu.history,action:"history",active:!0},{label:p.dashboard.menu.newPayment,action:"new-payment"},{label:p.dashboard.menu.assistant,action:"assistant"},{label:p.dashboard.menu.paymentOrders,action:"payment-orders"},{label:p.dashboard.menu.help,action:"help"},{label:p.dashboard.menu.cards,action:"cards"},{label:p.dashboard.menu.statements,action:"statements"},{label:p.dashboard.menu.standingOrders,action:"standing-orders"},{label:p.dashboard.menu.microSavings,action:"micro-savings"},{label:p.dashboard.menu.directDebits,action:"direct-debits"},{label:p.dashboard.menu.notifications,action:"notifications"},{label:p.dashboard.menu.settings,action:"settings"}];return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)("header",{className:"bg-[#5b2d5c] text-white px-4 py-3 sticky top-0 z-50 shadow-md select-none flex items-center justify-between",children:[(0,t.jsxs)("button",{type:"button",onClick:()=>x(!c),className:"flex items-center gap-2 focus:outline-none hover:opacity-95 active:scale-95 transition-all",children:[(0,t.jsx)(n,{className:"w-5 h-5 text-white"}),(0,t.jsx)("span",{className:"text-sm font-semibold tracking-wide",children:"Menu"})]}),(0,t.jsxs)("button",{onClick:u,className:"flex items-center gap-2 focus:outline-none hover:opacity-95 active:scale-95 transition-all",children:[(0,t.jsx)("span",{className:"text-sm font-semibold tracking-wide",children:p.dashboard.nav.logout}),(0,t.jsx)(i,{className:"w-5 h-5 text-white"})]})]}),c&&(0,t.jsx)("div",{className:"fixed inset-0 top-[56px] bg-black/60 z-40 animate-fade-in flex flex-col justify-start",onClick:()=>x(!1),children:(0,t.jsxs)("div",{className:"bg-[#1b1c23] w-full max-w-md mx-auto shadow-2xl flex flex-col overflow-hidden animate-slide-down border-b border-[#2a2b35]",onClick:e=>e.stopPropagation(),children:[(0,t.jsxs)("div",{className:"bg-[#5b2d5c] text-center pt-2.5 pb-3.5 border-t border-white/10 text-white select-none",children:[(0,t.jsx)("div",{className:"text-xs text-white/70 font-semibold tracking-wider",children:h?`${m} | ${h}`:m}),(0,t.jsxs)("button",{type:"button",onClick:()=>b("history"),className:"flex items-center justify-center gap-1.5 mt-1 font-bold text-white text-[15px] hover:opacity-80 mx-auto focus:outline-none tracking-wide",children:["História",(0,t.jsx)("svg",{className:"w-3 h-3 text-white",viewBox:"0 0 24 24",fill:"currentColor",children:(0,t.jsx)("path",{d:"M7 10l5 5 5-5z"})})]})]}),(0,t.jsx)("nav",{className:"flex flex-col divide-y divide-[#2a2b35] bg-[#1b1c23] text-[15px] font-normal",children:g.map((e,a)=>(0,t.jsx)("button",{type:"button",onClick:()=>b(e.action),className:`w-full text-left py-3.5 px-6 transition-colors duration-150 ${e.active?"text-white font-bold bg-[#24252f]":"text-white/80 hover:text-white hover:bg-[#20212a]"}`,children:e.label},a))})]})})]})}],22623)},16327,e=>{"use strict";let t=(0,e.i(56420).default)("chevron-down",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);e.s(["ChevronDown",0,t],16327)},56539,e=>{"use strict";let t=(0,e.i(56420).default)("chevron-up",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);e.s(["ChevronUp",0,t],56539)},17289,e=>{"use strict";function t(e){return(e/100).toFixed(2).replace(".",",").replace(/\B(?=(\d{3})+(?!\d))/g," ")}function a(e){let t=e.replace(/\s+/g,"").toUpperCase();if(!t.startsWith("SK")&&!/^[A-Z]{2}\d{2}/.test(t))return e;let a=[];for(let e=0;e<t.length;e+=4)a.push(t.substring(e,e+4));return a.join(" ")}function s(e){let s,l=Math.round(100*Number(e.amount)),r=Math.round(100*Number(e.balanceBefore)),n=Math.round(100*Number(e.balanceAfter)),i=e=>{let t=String(e.getDate()).padStart(2,"0"),a=String(e.getMonth()+1).padStart(2,"0"),s=e.getFullYear();return`${t}.${a}.${s}`},o=(e=>{if(!e)return new Date;let t=(e.includes(":")?e.substring(0,e.lastIndexOf(" ",e.indexOf(":"))).trim():e.trim()).replace(/\s+/g,"").split(".");if(t.length>=3){let e=parseInt(t[0],10),a=parseInt(t[1],10)-1;return new Date(parseInt(t[2],10),a,e,12,0,0)}return new Date})(e.createdAt),d=new Date(o.getTime()+864e5),c=i(o),x=i(d),p=a(e.fromAccountNumber),m=a(e.recipientAccountOrEmail),h=(s=e.recipientAccountOrEmail.replace(/\s+/g,"").toUpperCase()).startsWith("SK")&&s.length>=8&&({"0900":"GIBASKBX","0200":"SUBASKBX",1100:"TATRSKBX",1111:"UNCRSKBX",5600:"KOISSKBX",7500:"CEKOSKBX",8360:"FIOZSKBA",8330:"FIOZSKBA",6500:"3650SKBX",5200:"OTPVSKBX","0720":"NBSKSRBA"})[s.substring(4,8)]||"",u=e.status||"Štandardný platobný príkaz",b=`${m} ${e.recipientName}`;h&&(b+=` BIC: ${h}`),e.note&&(b+=` | Pozn\xe1mka: ${e.note}`);let f=`- ${t(l)}`;return t(n),t(r),`<!DOCTYPE html>
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
                <span class="value">${p}</span>
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
                <span class="value">${(e=>{if(!e)return"";let t=(e.includes(":")?e.substring(0,e.lastIndexOf(" ",e.indexOf(":"))).trim():e.trim()).replace(/\s+/g,"").split(".");if(t.length>=3){let e=t[0].padStart(2,"0"),a=t[1].padStart(2,"0"),s=t[2];return`${e}.${a}.${s}`}return e})(e.createdAt)}</span>
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
                <span class="value">- ${t(l)}</span>
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
                  <div class="body-cell cell-left">${x}</div>
                  <div class="body-cell cell-left popis-cell">
                    <span class="popis-title">${u}</span>
                    <span class="popis-subtext">${b}</span>
                  </div>
                  <div class="body-cell cell-right">${f}</div>
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
</html>`}async function l(e){let t,a,l=new Blob([s(e)],{type:"text/html; charset=utf-8"}),r=URL.createObjectURL(l),n=document.createElement("a");n.href=r,t=(e.variableSymbol||"bez-vs").replace(/[^\w-]+/g,""),a=e.createdAt.split(" ")[0]?.replace(/\./g,"-")||"datum",n.download=`potvrdenie-${t}-${a}.html`,n.click(),URL.revokeObjectURL(r)}e.s(["downloadPaymentConfirmationPdf",0,l,"openPaymentConfirmationHtml",0,function(e){let t=new Blob([s(e)],{type:"text/html; charset=utf-8"}),a=URL.createObjectURL(t);window.open(a,"_blank","noopener,noreferrer"),window.setTimeout(()=>URL.revokeObjectURL(a),6e4)}])},62368,e=>{"use strict";let t=(0,e.i(56420).default)("download",[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]]);e.s(["Download",0,t],62368)},6555,e=>{"use strict";let t=(0,e.i(56420).default)("arrow-down-left",[["path",{d:"M17 7 7 17",key:"15tmo1"}],["path",{d:"M17 17H7V7",key:"1org7z"}]]);e.s(["ArrowDownLeft",0,t],6555)},75775,e=>{"use strict";let t=(0,e.i(56420).default)("arrow-up-right",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);e.s(["ArrowUpRight",0,t],75775)},33245,e=>{"use strict";let t={it_software:{id:"it_software",name:"IT a softvér",bgClass:"bg-[#0f2a4a]",textClass:"text-[#82b1ff]",borderClass:"border-[#1e3c72]"},fees_taxes:{id:"fees_taxes",name:"Dane a poplatky",bgClass:"bg-[#3b181a]",textClass:"text-[#ff8a80]",borderClass:"border-[#c62828]"},business:{id:"business",name:"Podnikanie",bgClass:"bg-[#1b3d22]",textClass:"text-[#a5d6a7]",borderClass:"border-[#2e7d32]"},travel_transport:{id:"travel_transport",name:"Cestovanie a doprava",bgClass:"bg-[#3e2723]",textClass:"text-[#d7ccc8]",borderClass:"border-[#4e342e]"},savings_investment:{id:"savings_investment",name:"Sporenie a investície",bgClass:"bg-[#311b92]",textClass:"text-[#d1c4e9]",borderClass:"border-[#4527a0]"},shopping:{id:"shopping",name:"Potraviny a nákupy",bgClass:"bg-[#4a270f]",textClass:"text-[#ffcc80]",borderClass:"border-[#ef6c00]"},personal:{id:"personal",name:"Osobné transfery",bgClass:"bg-[#004d40]",textClass:"text-[#80cbc4]",borderClass:"border-[#00695c]"},other_expenses:{id:"other_expenses",name:"Nezaradené výdavky",bgClass:"bg-[#1a1b2e]",textClass:"text-[#8fa0c4]",borderClass:"border-[#2b2d4f]"},other_income:{id:"other_income",name:"Ostatné nepravidelné príjmy",bgClass:"bg-[#1b2a47]",textClass:"text-[#82b1ff]",borderClass:"border-[#1e3c72]"}};e.s(["CATEGORIES",0,t,"categorizeTransaction",0,function(e,a="",s="withdrawal"){let l=`${e} ${a}`.toLowerCase();return"deposit"===s?l.includes("dopravoprojekt")||l.includes("099 s.r.o.")||l.includes("099 s. r. o.")||l.includes("faktúra")||l.includes("príjem")||l.includes("consulting")?t.business.name:l.includes("denis")||l.includes("migaľ")||l.includes("michal")||l.includes("judita")||l.includes("amir")?t.personal.name:t.other_income.name:l.includes("paddle")||l.includes("google")||l.includes("chatbot")||l.includes("hosting")||l.includes("server")?t.it_software.name:l.includes("daň")||l.includes("poplatok")||l.includes("ekolky")||l.includes("tax")||l.includes("daňov")?t.fees_taxes.name:l.includes("idoklad")||l.includes("kros")||l.includes("faktura")||l.includes("biznis")||l.includes("dalman")?t.business.name:l.includes("vintrica")||l.includes("shell")||l.includes("doprava")||l.includes("nafta")||l.includes("benzin")||l.includes("slovnaft")||l.includes("vignette")?t.travel_transport.name:l.includes("space")||l.includes("sporenie")||l.includes("invest")||l.includes("fondy")?t.savings_investment.name:l.includes("tesco")||l.includes("lidl")||l.includes("alza")||l.includes("nakup")||l.includes("billa")||l.includes("obchod")?t.shopping.name:t.other_expenses.name},"getCategoryConfigByName",0,function(e){return Object.values(t).find(t=>t.name===e)||t.other_expenses}])},62706,e=>{"use strict";let t="Europe/Bratislava";e.s(["formatTransactionDateLong",0,function(e){return new Intl.DateTimeFormat("sk-SK",{day:"numeric",month:"long",timeZone:t}).format(new Date(e)).replace(".","")},"formatTransactionDateMedium",0,function(e){return new Intl.DateTimeFormat("sk-SK",{dateStyle:"medium",timeStyle:"short",timeZone:t}).format(new Date(e))},"formatTransactionDateTime",0,function(e){return new Intl.DateTimeFormat("sk-SK",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:t}).format(new Date(e))}])},32781,e=>{"use strict";let t=(0,e.i(56420).default)("loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);e.s(["Loader2",0,t],32781)},71567,30274,e=>{"use strict";var t=e.i(56420);let a=(0,t.default)("bot",[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]);e.s(["Bot",0,a],71567);let s=(0,t.default)("send",[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]);e.s(["Send",0,s],30274)},66595,e=>{"use strict";let t=(0,e.i(56420).default)("search",[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]]);e.s(["Search",0,t],66595)},63566,e=>{"use strict";let t=(0,e.i(56420).default)("wallet-cards",[["path",{d:"M3 11h3.75a2 2 0 0 1 1.6.8l.45.6a4 4 0 0 0 6.4 0l.45-.6a2 2 0 0 1 1.6-.8H21",key:"1vwh6y"}],["path",{d:"M3 7h18",key:"1uiuf2"}],["rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",key:"h1oib"}]]);e.s(["WalletCards",0,t],63566)},63676,e=>{"use strict";let t=(0,e.i(56420).default)("x",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);e.s(["X",0,t],63676)},95187,(e,t,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0});var s={callServer:function(){return r.callServer},createServerReference:function(){return i.createServerReference},findSourceMapURL:function(){return n.findSourceMapURL}};for(var l in s)Object.defineProperty(a,l,{enumerable:!0,get:s[l]});let r=e.r(32120),n=e.r(92245),i=e.r(35326)},77071,e=>{"use strict";let t=(0,e.i(56420).default)("plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);e.s(["Plus",0,t],77071)},69120,76339,e=>{"use strict";var t=e.i(43476),a=e.i(71645),s=e.i(18566),l=e.i(77071),r=e.i(63676),n=e.i(63566),i=e.i(95187);let o=(0,i.createServerReference)("708b9a2fd64c646181a342d64f5b1b89e5e0d3f832",i.callServer,void 0,i.findSourceMapURL,"depositFunds"),d=["0,10","1,00","10,00","100,00"];e.s(["AddMoneyFooter",0,function({accountId:e,accountNumber:i,balance:c,currency:x="EUR"}){let p=(0,s.useRouter)(),[m,h]=(0,a.useState)(!1),[u,b]=(0,a.useState)(""),[f,g]=(0,a.useState)(!1),[v,w]=(0,a.useState)(null),[j,y]=(0,a.useState)(null),k=async()=>{y(null),w(null);let t=Number(u.trim().replace(/\s/g,"").replace(",","."));if(!e)return void y("Účet ešte nie je pripravený.");if(!Number.isFinite(t)||t<=0)return void y("Zadajte sumu väčšiu ako 0,00.");g(!0);try{await o(e,t.toFixed(2),"Pridanie peňazí|Dobitie cez spodné menu|Ostatné nepravidelné príjmy"),b(""),w(`Pridan\xe9 ${t.toFixed(2).replace(".",",")} ${x}`),p.refresh()}catch(e){y(e instanceof Error?e.message:"Peniaze sa nepodarilo pridať.")}finally{g(!1)}};return(0,t.jsx)("div",{className:"w-full",children:(0,t.jsxs)("div",{className:"w-full",children:[m&&(0,t.jsxs)("div",{className:"mb-3 rounded-[18px] border border-[#2b3347] bg-[#151922]/95 p-4 shadow-2xl backdrop-blur-md",children:[(0,t.jsxs)("div",{className:"mb-3 flex items-start justify-between gap-3",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"text-[11px] font-bold uppercase tracking-[0.16em] text-[#8e9bb5]",children:"Pridať peniaze"}),(0,t.jsxs)("p",{className:"mt-1 text-sm font-bold text-white",children:["SPACE účet | ",void 0===c?"0,00":(Number(c)/100).toFixed(2).replace(".",",")," ",x]}),i&&(0,t.jsx)("p",{className:"mt-0.5 text-[11px] text-[#8e9bb5]",children:i})]}),(0,t.jsx)("button",{type:"button",onClick:()=>h(!1),className:"rounded-full p-1 text-[#8e9bb5] transition-colors hover:bg-white/10 hover:text-white","aria-label":"Zavrieť pridanie peňazí",children:(0,t.jsx)(r.X,{className:"h-4 w-4"})})]}),(0,t.jsxs)("div",{className:"flex gap-2",children:[(0,t.jsx)("input",{value:u,onChange:e=>{let t,a;b(((a=(t=e.target.value.replace(/[^\d,.]/g,"").replace(",",".")).split(".")).length>2?`${a[0]}.${a.slice(1).join("")}`:t).replace(".",","))},inputMode:"decimal",placeholder:"0,00",className:"h-11 min-w-0 flex-1 rounded-[14px] border border-[#2b3347] bg-[#0f121a] px-4 text-[17px] font-bold text-white placeholder-[#4f5a70] outline-none transition-colors focus:border-[#1d63ed]"}),(0,t.jsx)("div",{className:"flex h-11 items-center rounded-[14px] border border-[#2b3347] bg-[#0f121a] px-3 text-sm font-bold text-white",children:x})]}),(0,t.jsx)("div",{className:"mt-3 grid grid-cols-4 gap-2",children:d.map(e=>(0,t.jsxs)("button",{type:"button",onClick:()=>b(e),className:"h-9 rounded-full border border-[#2b3347] bg-[#1b2130] text-xs font-bold text-[#d7deeb] transition-colors hover:border-[#1d63ed] hover:text-white",children:["+",e]},e))}),j&&(0,t.jsx)("p",{className:"mt-3 text-center text-xs font-semibold text-red-400",children:j}),v&&(0,t.jsx)("p",{className:"mt-3 text-center text-xs font-semibold text-[#22c55e]",children:v}),(0,t.jsxs)("button",{type:"button",disabled:f,onClick:k,className:"mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1d63ed] text-sm font-black text-white transition-colors hover:bg-[#154fc2] disabled:cursor-not-allowed disabled:bg-[#263042] disabled:text-[#6f7a90]",children:[(0,t.jsx)(l.Plus,{className:"h-4 w-4"}),f?"Pridávam...":"Pridať na účet"]})]}),(0,t.jsxs)("button",{type:"button",onClick:()=>{h(e=>!e),y(null)},className:"ml-auto flex h-12 items-center gap-3 rounded-full border border-[#2b3347] bg-[#1d63ed] px-4 text-sm font-black text-white shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.98]","aria-expanded":m,children:[(0,t.jsx)("span",{className:"flex h-7 w-7 items-center justify-center rounded-full bg-white/15",children:(0,t.jsx)(n.WalletCards,{className:"h-4 w-4"})}),"+ Peniaze"]})]})})}],69120);var c=e.i(71567),x=e.i(32781),p=e.i(30274);let m=(0,e.i(56420).default)("sparkles",[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]]);e.s(["AssistantWidget",0,function(){let[e,s]=(0,a.useState)(!1),[l,n]=(0,a.useState)(!1),[i,o]=(0,a.useState)(!1),[d,h]=(0,a.useState)(null),[u,b]=(0,a.useState)(""),[f,g]=(0,a.useState)(null),[v,w]=(0,a.useState)([]),[j,y]=(0,a.useState)(null),k=(0,a.useRef)(null);(0,a.useEffect)(()=>{e&&(o(!0),fetch("/api/assistant/chat").then(async e=>{if(!e.ok)throw Error("Asistenta sa nepodarilo načítať.");return e.json()}).then(e=>{g(e.conversation??null),w(e.messages??[]),y(e.config??null)}).catch(e=>h(e instanceof Error?e.message:"Asistent sa nenačítal.")).finally(()=>o(!1)))},[e]),(0,a.useEffect)(()=>{k.current?.scrollIntoView({behavior:"smooth"})},[v,l]);let N=async()=>{let e=u.trim();if(!e||l)return;b(""),h(null),n(!0);let t={id:`local-${Date.now()}`,role:"user",content:e,sources:[],createdAt:new Date().toISOString()};w(e=>[...e,t]);try{let a=await fetch("/api/assistant/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:e,conversationId:f?.id})}),s=await a.json();if(!a.ok)throw Error(s.error??"Asistent teraz nevie odpovedať.");g(s.conversation??f),y(s.config??j),w(e=>[...e.filter(e=>e.id!==t.id),...s.messages??[]])}catch(e){h(e instanceof Error?e.message:"Správu sa nepodarilo odoslať."),w(e=>e.filter(e=>e.id!==t.id))}finally{n(!1)}};return(0,t.jsxs)("div",{className:"w-full flex flex-col items-end mt-4",children:[e&&(0,t.jsxs)("div",{className:"mb-3 flex h-[min(560px,calc(100dvh-120px))] w-full flex-col overflow-hidden rounded-[20px] border border-[#2b3347] bg-[#111620]/95 text-white shadow-2xl backdrop-blur-md",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between border-b border-[#242b3a] bg-[#171c28] px-4 py-3",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("div",{className:"flex h-9 w-9 items-center justify-center rounded-full bg-[#1d63ed]",children:(0,t.jsx)(c.Bot,{className:"h-5 w-5"})}),(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"text-sm font-black",children:"George asistent"}),(0,t.jsx)("p",{className:"text-[11px] font-semibold text-[#8e9bb5]",children:j?.mistralConfigured?j.model:"Demo režim"})]})]}),(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)("span",{className:"rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#22c55e]",children:"Pripravený"}),(0,t.jsx)("button",{type:"button",onClick:()=>s(!1),className:"rounded-full p-1.5 text-[#8e9bb5] transition-colors hover:bg-white/10 hover:text-white","aria-label":"Zavrieť asistenta",children:(0,t.jsx)(r.X,{className:"h-4 w-4"})})]})]}),(0,t.jsx)("div",{className:"flex-1 overflow-y-auto px-4 py-3",children:i?(0,t.jsxs)("div",{className:"flex h-full items-center justify-center text-sm font-semibold text-[#8e9bb5]",children:[(0,t.jsx)(x.Loader2,{className:"mr-2 h-4 w-4 animate-spin"}),"Načítavam asistenta..."]}):0===v.length?(0,t.jsxs)("div",{className:"flex h-full flex-col items-center justify-center text-center",children:[(0,t.jsx)("div",{className:"flex h-12 w-12 items-center justify-center rounded-full border border-[#2b3347] bg-[#171c28]",children:(0,t.jsx)(m,{className:"h-5 w-5 text-[#1d63ed]"})}),(0,t.jsx)("p",{className:"mt-3 text-sm font-black",children:"Ako môžem pomôcť?"}),(0,t.jsx)("p",{className:"mt-1 max-w-[260px] text-xs leading-relaxed text-[#8e9bb5]",children:"Viem čítať tvoje demo účty a posledné transakcie. Platby za teba nepotvrdzujem."})]}):(0,t.jsxs)("div",{className:"space-y-3",children:[v.map(e=>(0,t.jsx)("div",{className:`flex ${"user"===e.role?"justify-end":"justify-start"}`,children:(0,t.jsxs)("div",{className:`max-w-[82%] rounded-[16px] px-3 py-2 text-sm leading-relaxed ${"user"===e.role?"bg-[#1d63ed] text-white":"border border-[#2b3347] bg-[#171c28] text-[#eef3ff]"}`,children:[(0,t.jsx)("p",{children:e.content}),e.sources.length>0&&(0,t.jsxs)("div",{className:"mt-2 border-t border-white/10 pt-2",children:[(0,t.jsx)("p",{className:"text-[10px] font-black uppercase tracking-wide text-[#8e9bb5]",children:"Zdroje"}),e.sources.map(a=>(0,t.jsx)("p",{className:"mt-1 text-[11px] text-[#c5cde0]",children:a.title},`${e.id}-${a.title}`))]})]})},e.id)),l&&(0,t.jsx)("div",{className:"flex justify-start",children:(0,t.jsxs)("div",{className:"rounded-[16px] border border-[#2b3347] bg-[#171c28] px-3 py-2 text-sm text-[#8e9bb5]",children:[(0,t.jsx)(x.Loader2,{className:"mr-2 inline h-4 w-4 animate-spin"}),"Premýšľam..."]})}),(0,t.jsx)("div",{ref:k})]})}),d&&(0,t.jsx)("p",{className:"border-t border-red-500/20 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-300",children:d}),(0,t.jsxs)("form",{className:"flex gap-2 border-t border-[#242b3a] bg-[#171c28] p-3",onSubmit:e=>{e.preventDefault(),N()},children:[(0,t.jsx)("input",{value:u,onChange:e=>b(e.target.value.slice(0,1200)),placeholder:"Opýtaj sa na účet, platby alebo históriu...",className:"h-11 min-w-0 flex-1 rounded-[14px] border border-[#2b3347] bg-[#0f121a] px-3 text-sm font-semibold text-white outline-none transition-colors placeholder:text-[#5f6a80] focus:border-[#1d63ed]"}),(0,t.jsx)("button",{type:"submit",disabled:l||!u.trim(),className:"flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1d63ed] text-white transition-colors hover:bg-[#154fc2] disabled:bg-[#263042] disabled:text-[#6f7a90]","aria-label":"Odoslať správu",children:(0,t.jsx)(p.Send,{className:"h-4 w-4"})})]})]}),(0,t.jsxs)("button",{type:"button",onClick:()=>s(e=>!e),className:"flex h-12 items-center gap-3 rounded-full border border-[#2b3347] bg-[#151922] px-4 text-sm font-black text-white shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-transform hover:border-[#1d63ed] active:scale-[0.98]","aria-expanded":e,children:[(0,t.jsx)("span",{className:"flex h-7 w-7 items-center justify-center rounded-full bg-[#1d63ed]",children:(0,t.jsx)(c.Bot,{className:"h-4 w-4"})}),"Asistent"]})]})}],76339)},308,e=>{"use strict";var t=e.i(43476),a=e.i(71645),s=e.i(18566),l=e.i(6555),r=e.i(75775),n=e.i(56539),i=e.i(16327),o=e.i(62368),d=e.i(66595),c=e.i(63566),x=e.i(63676),p=e.i(95187);let m=(0,p.createServerReference)("7cae57b185204e6e77841a2b333f74bf8744c53dc6",p.callServer,void 0,p.findSourceMapURL,"createTransaction"),h=(0,p.createServerReference)("78632de33a41d906f87119cc9a9eac0edc605bf3c6",p.callServer,void 0,p.findSourceMapURL,"internalTransferByEmail");var u=e.i(56420);let b=(0,u.default)("circle-alert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]),f=(0,u.default)("calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);var g=e.i(17289),v=e.i(33245);function w({accountId:e,accounts:l,onClose:r}){let n=(0,s.useRouter)(),[i,d]=(0,a.useState)(""),[c,p]=(0,a.useState)(""),[u,j]=(0,a.useState)(""),[y,k]=(0,a.useState)(""),[N,S]=(0,a.useState)(""),[C,z]=(0,a.useState)(""),[A,O]=(0,a.useState)(""),[P,M]=(0,a.useState)(""),[E,$]=(0,a.useState)("21.06.2026"),[L,R]=(0,a.useState)("0"),[B,D]=(0,a.useState)(!1),[I,T]=(0,a.useState)(!1),[V,_]=(0,a.useState)(v.CATEGORIES.other_expenses.name),[K,U]=(0,a.useState)(!1),[F,Z]=(0,a.useState)(!1),[W,H]=(0,a.useState)(null),[X,q]=(0,a.useState)(null),[G,Y]=(0,a.useState)(!1),[J,Q]=(0,a.useState)(null);(0,a.useEffect)(()=>{K||_((0,v.categorizeTransaction)(i,A,"withdrawal"))},[i,A,K]);let ee=l.find(t=>t.id===e),et=ee?ee.balance:0,ea=e=>(Number(e)/100).toFixed(2).replace(".",","),es=Math.round(100*(parseFloat(u)||0)),el=et-es,er=async(e=J)=>{if(e){q(null);try{await (0,g.downloadPaymentConfirmationPdf)(e)}catch{q("PDF sa nepodarilo pripraviť. Skúste to znova.")}}},en=async t=>{if(t.preventDefault(),H(null),q(null),Y(!1),Z(!0),es<=0){H("Suma musí byť väčšia ako nula."),Z(!1);return}if(es>et){H("Nedostatok finančných prostriedkov na účte."),Z(!1);return}try{let t,s,l,r=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.trim()),o="external";if(r)o="email",t=await h(e,c.trim(),u,A);else{var a;t=await m(e,null,u,"withdrawal",[(a={recipientName:i||"Prevod",note:A||"Platba",category:V,recipientAccountOrEmail:c.trim(),variableSymbol:y,constantSymbol:N,specificSymbol:C,payerReference:P}).recipientName,a.note,a.category,a.recipientAccountOrEmail??"",a.variableSymbol??"",a.constantSymbol??"",a.specificSymbol??"",a.payerReference??""].join("|"))}let d=(s=t.id,l=o,{transactionId:s,createdAt:new Date().toLocaleString("sk-SK"),status:"Štandardný platobný príkaz",transferType:l,fromAccountNumber:ee?.accountNumber??"",recipientName:i,recipientAccountOrEmail:c.trim(),amount:u,currency:ee?.currency??"EUR",variableSymbol:y,constantSymbol:N,specificSymbol:C,note:A,payerReference:P,dueDate:E,repeatDays:L,createTemplate:B,emailConfirmation:I,balanceBefore:(et/100).toFixed(2),balanceAfter:(el/100).toFixed(2)});Q(d),Y(!0),er(d),n.refresh()}catch(e){H(e instanceof Error?e.message:"Niekde nastala chyba pri odosielaní platby.")}finally{Z(!1)}},ei="w-full h-11 px-4 bg-[#1b1c24] border border-[#3a3d52] rounded-[14px] text-[14px] text-white placeholder-[#474959] focus:outline-none focus:border-[#1d63ed] transition-colors";return G?(0,t.jsxs)("div",{className:"flex-1 bg-[#0b0c10] text-white flex flex-col font-sans select-none h-full absolute inset-0 z-[100] animate-fade-in",children:[(0,t.jsxs)("header",{className:"bg-transparent text-white px-4 pt-4 pb-4 sticky top-0 z-50 flex items-center justify-between",children:[(0,t.jsx)("div",{className:"flex-1"}),(0,t.jsx)("div",{className:"text-center flex-[3]",children:(0,t.jsx)("h1",{className:"font-bold text-[17px] text-white tracking-wide",children:"Podpisovanie"})}),(0,t.jsx)("div",{className:"flex-1 flex justify-end",children:r&&(0,t.jsx)("button",{onClick:r,type:"button",className:"text-[#555770] hover:text-white focus:outline-none p-1","aria-label":"Zatvoriť",children:(0,t.jsx)(x.X,{className:"w-5 h-5 stroke-[2]"})})})]}),(0,t.jsx)("div",{className:"flex-1 p-4 flex flex-col items-center justify-center",children:(0,t.jsxs)("div",{className:"w-full max-w-md bg-[#15161c] rounded-[24px] flex flex-col items-center shadow-xl border border-[#202129] overflow-hidden",children:[(0,t.jsxs)("div",{className:"pt-12 pb-8 px-6 flex flex-col items-center",children:[(0,t.jsx)("div",{className:"w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#5cf07c] via-[#35cc59] to-[#1c9c38] flex items-center justify-center mb-8 shadow-[inset_-4px_-8px_16px_rgba(0,0,0,0.2),inset_4px_8px_16px_rgba(255,255,255,0.4),0_8px_24px_rgba(53,204,89,0.3)] animate-scale-in",children:(0,t.jsx)("svg",{className:"w-12 h-12 text-white drop-shadow-md",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"4",strokeLinecap:"round",strokeLinejoin:"round",children:(0,t.jsx)("path",{d:"M20 6 9 17l-5-5"})})}),(0,t.jsx)("h2",{className:"text-[20px] font-bold text-white text-center mb-2 leading-tight tracking-wide",children:"Ďakujem, bolo to úspešné a naozaj rýchle."}),(0,t.jsx)("p",{className:"text-[14px] text-[#e0e4f0] text-center px-4 leading-relaxed",children:"Stav príkazu si môžete skontrolovať v zozname platieb."}),(0,t.jsx)("p",{className:"text-[12px] text-[#8e9bb5] text-center px-4 leading-relaxed mt-3",children:"Potvrdenie o platbe je pripravené na stiahnutie."})]}),(0,t.jsxs)("div",{className:"w-full border-t border-[#202129] px-5 py-6 flex flex-col gap-3",children:[(0,t.jsx)("button",{type:"button",onClick:()=>J&&(0,g.openPaymentConfirmationHtml)(J),className:"w-full h-[44px] bg-[#1b1c24] hover:bg-[#252733] text-white font-bold rounded-full transition-colors active:scale-[0.98] flex items-center justify-center gap-2 text-[14px] border border-[#3a3d52]",children:"Zobraziť doklad"}),(0,t.jsxs)("button",{type:"button",onClick:()=>void er(),className:"w-full h-[44px] bg-[#1d63ed] hover:bg-[#154fc2] text-white font-bold rounded-full transition-colors active:scale-[0.98] flex items-center justify-center gap-2 text-[14px]",children:[(0,t.jsx)(o.Download,{className:"w-4 h-4"}),"Stiahnuť doklad (HTML)"]}),X&&(0,t.jsx)("p",{className:"text-[12px] text-red-400 text-center font-medium",children:X}),(0,t.jsx)("button",{type:"button",onClick:()=>{Y(!1),r&&r()},className:"w-full h-[44px] bg-[#1d63ed] hover:bg-[#1a55cc] text-white font-bold rounded-full transition-colors active:scale-[0.98] flex items-center justify-center text-[14px]",children:"Hotovo"}),(0,t.jsx)("button",{type:"button",onClick:()=>{Y(!1),r&&r(),n.push(`/dashboard/accounts/${e}`)},className:"w-full h-[44px] bg-transparent border-[1.5px] border-[#313342] text-[#1d63ed] hover:bg-[#313342]/40 font-bold rounded-full transition-colors active:scale-[0.98] flex items-center justify-center text-[14px]",children:"Zobraziť zoznam platieb"})]})]})})]}):(0,t.jsxs)("div",{className:"flex-1 bg-[#12131a] text-white flex flex-col font-sans select-none pb-8 relative",children:[(0,t.jsxs)("header",{className:"bg-[#5b2d5c] text-white px-4 pt-4 pb-4 sticky top-0 z-50 flex items-center justify-between",children:[(0,t.jsx)("div",{className:"flex-1",children:(0,t.jsx)("button",{type:"button",onClick:()=>{d("Odoslana platba"),p("SK99 0900 0000 0000 1234 5678"),j("120.50"),k("20260601"),S("0308"),z("123"),O("Uhrada faktury"),M("FAK-2026-06")},className:"text-[16px] bg-[#7a3b7c] hover:bg-[#8f4591] w-8 h-8 rounded-full transition-colors flex items-center justify-center focus:outline-none shadow-sm",title:"Vyplniť testovacie dáta",children:"🪄"})}),(0,t.jsxs)("div",{className:"text-center flex-[3]",children:[(0,t.jsxs)("p",{className:"text-[11px] text-[#c5cde0] font-semibold tracking-wider",children:["SPACE účet | € ",ea(et)]}),(0,t.jsx)("h1",{className:"font-bold text-[18px] text-white tracking-wide mt-0.5",children:"Nová platba"})]}),(0,t.jsx)("div",{className:"flex-1 flex justify-end",children:r&&(0,t.jsx)("button",{onClick:r,type:"button",className:"text-[#c5cde0] hover:text-white focus:outline-none p-1","aria-label":"Zatvoriť",children:(0,t.jsx)(x.X,{className:"w-5 h-5 stroke-[2]"})})})]}),(0,t.jsxs)("form",{onSubmit:en,className:"px-5 py-4 flex-1 flex flex-col gap-4 overflow-y-auto",children:[(0,t.jsxs)("button",{type:"button",className:"mx-auto px-5 py-2 mb-2 bg-transparent border border-[#3a3d52] rounded-full text-[13px] text-[#1d63ed] font-bold flex items-center justify-center gap-2 hover:bg-[#1d63ed]/5 transition-colors focus:outline-none",children:[(0,t.jsxs)("svg",{className:"w-4 h-4",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[(0,t.jsx)("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1"}),(0,t.jsx)("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1"}),(0,t.jsx)("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1"}),(0,t.jsx)("path",{d:"M14 14h2v2h-2zm4 0h3v3h-3zm-4 4h3v3h-3zm4 0h3v3h-3z"})]}),"QR kód"]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1",children:[(0,t.jsx)("label",{htmlFor:"recipient",className:"text-[14px] font-bold text-white tracking-wide",children:"Príjemca"}),(0,t.jsxs)("div",{className:"relative flex items-center",children:[(0,t.jsx)("input",{id:"recipient",type:"text",value:i,onChange:e=>d(e.target.value),placeholder:"Zadajte názov príjemcu",required:!0,className:ei+" pr-12"}),(0,t.jsx)("button",{type:"button",className:"absolute right-4 text-[#1d63ed] focus:outline-none",children:(0,t.jsxs)("svg",{className:"w-5 h-5",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,t.jsx)("rect",{x:"4",y:"2",width:"16",height:"20",rx:"2"}),(0,t.jsx)("circle",{cx:"12",cy:"10",r:"3"}),(0,t.jsx)("path",{d:"M7 20v-1a5 5 0 0 1 10 0v1"}),(0,t.jsx)("line",{x1:"1",y1:"8",x2:"4",y2:"8"}),(0,t.jsx)("line",{x1:"1",y1:"14",x2:"4",y2:"14"})]})})]}),(0,t.jsx)("p",{className:"text-[11px] text-[#676a7c] mt-0.5",children:"Prosím, zadajte názov alebo vyberte jeden zo svojich kontaktov."})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsx)("label",{htmlFor:"iban",className:"text-[14px] font-bold text-white tracking-wide",children:"IBAN alebo číslo účtu"}),(0,t.jsx)("input",{id:"iban",type:"text",value:c,onChange:e=>p(e.target.value),placeholder:"SK00 0000 0000 0000 0000 0000",required:!0,className:ei+" uppercase tracking-wider"}),(0,t.jsx)("p",{className:"text-[11px] text-[#676a7c] mt-0.5",children:"Prosím, zadajte číslo účtu alebo IBAN."})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsx)("label",{htmlFor:"amount",className:"text-[14px] font-bold text-white tracking-wide",children:"Suma"}),(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)("input",{id:"amount",type:"number",step:"0.01",min:"0.01",value:u,onChange:e=>j(e.target.value),placeholder:"0,00",required:!0,className:"flex-1 h-11 px-4 bg-[#1b1c24] border border-[#3a3d52] rounded-[14px] text-[14px] text-white placeholder-[#474959] focus:outline-none focus:border-[#1d63ed] transition-colors"}),(0,t.jsxs)("div",{className:"h-11 px-3 bg-[#1b1c24] border border-[#1d63ed] rounded-[14px] flex items-center gap-1.5 text-[14px] font-bold text-[#1d63ed] shrink-0 cursor-pointer",children:[(0,t.jsx)("span",{className:"w-5 h-5 rounded-full bg-[#1d63ed] flex items-center justify-center text-white text-[14px] leading-none",children:"+"}),"EUR ",(0,t.jsx)("span",{className:"text-[10px] text-[#1d63ed] ml-0.5",children:"▼"})]})]}),(0,t.jsxs)("p",{className:"text-[11px] mt-0.5 text-[#22c55e] font-bold",children:["Nový disponibilný zostatok € ",ea(el)]})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsxs)("label",{htmlFor:"vs",className:"text-[14px] font-bold text-white tracking-wide",children:["Variabilný symbol ",(0,t.jsx)("span",{className:"text-[11px] text-[#676a7c] font-normal ml-1",children:"Voliteľné"})]}),(0,t.jsx)("input",{id:"vs",type:"text",maxLength:10,value:y,onChange:e=>k(e.target.value.replace(/\D/g,"")),className:ei})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between",children:[(0,t.jsxs)("label",{htmlFor:"ks",className:"text-[14px] font-bold text-white tracking-wide",children:["Konštantný symbol ",(0,t.jsx)("span",{className:"text-[11px] text-[#676a7c] font-normal ml-1",children:"Voliteľné"})]}),(0,t.jsx)("button",{type:"button",className:"text-[#1d63ed] text-[12px] font-bold hover:underline focus:outline-none",children:"Zoznam symbolov"})]}),(0,t.jsx)("input",{id:"ks",type:"text",maxLength:4,value:N,onChange:e=>S(e.target.value.replace(/\D/g,"")),className:ei})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsxs)("label",{htmlFor:"ss",className:"text-[14px] font-bold text-white tracking-wide",children:["Špecifický symbol ",(0,t.jsx)("span",{className:"text-[11px] text-[#676a7c] font-normal ml-1",children:"Voliteľné"})]}),(0,t.jsx)("input",{id:"ss",type:"text",maxLength:10,value:C,onChange:e=>z(e.target.value.replace(/\D/g,"")),className:ei})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsxs)("label",{htmlFor:"note",className:"text-[14px] font-bold text-white tracking-wide",children:["Poznámka pre príjemcu ",(0,t.jsx)("span",{className:"text-[11px] text-[#676a7c] font-normal ml-1",children:"Voliteľné"})]}),(0,t.jsx)("input",{id:"note",type:"text",maxLength:140,value:A,onChange:e=>O(e.target.value),className:ei})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsxs)("label",{htmlFor:"reference",className:"text-[14px] font-bold text-white tracking-wide",children:["Referencia platiteľa ",(0,t.jsx)("span",{className:"text-[11px] text-[#676a7c] font-normal ml-1",children:"Voliteľné"})]}),(0,t.jsx)("input",{id:"reference",type:"text",maxLength:35,value:P,onChange:e=>M(e.target.value),className:ei})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsx)("label",{htmlFor:"category",className:"text-[14px] font-bold text-white tracking-wide",children:"Kategória platby"}),(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)("select",{id:"category",value:V,onChange:e=>{_(e.target.value),U(!0)},className:ei+" appearance-none cursor-pointer pr-10",children:Object.values(v.CATEGORIES).map(e=>(0,t.jsx)("option",{value:e.name,children:e.name},e.id))}),(0,t.jsx)("svg",{className:"w-4 h-4 text-[#474959] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:(0,t.jsx)("path",{d:"m6 9 6 6 6-6"})})]})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsx)("label",{htmlFor:"dueDate",className:"text-[14px] font-bold text-white tracking-wide",children:"Dátum splatnosti"}),(0,t.jsxs)("div",{className:"relative flex items-center",children:[(0,t.jsx)("input",{id:"dueDate",type:"text",value:E,onChange:e=>$(e.target.value),required:!0,className:ei+" pr-12"}),(0,t.jsx)("div",{className:"absolute right-4 text-[#1d63ed] pointer-events-none",children:(0,t.jsx)(f,{className:"w-5 h-5"})})]})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-1 mt-1",children:[(0,t.jsxs)("label",{htmlFor:"repeatDays",className:"text-[14px] font-bold text-white tracking-wide",children:["Počet dní opakovania ",(0,t.jsx)("span",{className:"text-[11px] text-[#676a7c] font-normal ml-1",children:"Voliteľné"})]}),(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsxs)("select",{id:"repeatDays",value:L,onChange:e=>R(e.target.value),className:ei+" appearance-none cursor-pointer pr-10",children:[(0,t.jsx)("option",{value:"0",children:"0"}),(0,t.jsx)("option",{value:"7",children:"7"}),(0,t.jsx)("option",{value:"14",children:"14"}),(0,t.jsx)("option",{value:"30",children:"30"}),(0,t.jsx)("option",{value:"60",children:"60"}),(0,t.jsx)("option",{value:"90",children:"90"})]}),(0,t.jsx)("svg",{className:"w-4 h-4 text-[#474959] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:(0,t.jsx)("path",{d:"m6 9 6 6 6-6"})})]})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-2 mt-1",children:[(0,t.jsxs)("label",{className:"text-[14px] font-bold text-white tracking-wide",children:["Šablóna ",(0,t.jsx)("span",{className:"text-[11px] text-[#676a7c] font-normal ml-1",children:"Voliteľné"})]}),(0,t.jsxs)("label",{className:"flex items-center gap-3 cursor-pointer group",children:[(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)("input",{type:"checkbox",checked:B,onChange:e=>D(e.target.checked),className:"sr-only peer"}),(0,t.jsx)("div",{className:"w-5 h-5 rounded border-2 border-[#3a3d50] bg-[#1b1c24] peer-checked:bg-[#1d63ed] peer-checked:border-[#1d63ed] flex items-center justify-center transition-colors",children:B&&(0,t.jsx)("svg",{className:"w-3 h-3 text-white",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round",children:(0,t.jsx)("path",{d:"M20 6 9 17l-5-5"})})})]}),(0,t.jsx)("span",{className:"text-[14px] text-[#c5cde0] group-hover:text-white transition-colors",children:"Vytvoriť šablónu"})]})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-2 mt-1",children:[(0,t.jsxs)("label",{className:"text-[14px] font-bold text-white tracking-wide",children:["Potvrdenie o vykonaní platby (na e-mail) ",(0,t.jsx)("span",{className:"text-[11px] text-[#676a7c] font-normal ml-1",children:"Voliteľné"})]}),(0,t.jsxs)("label",{className:"flex items-start gap-3 cursor-pointer group",children:[(0,t.jsxs)("div",{className:"relative mt-0.5",children:[(0,t.jsx)("input",{type:"checkbox",checked:I,onChange:e=>T(e.target.checked),className:"sr-only peer"}),(0,t.jsx)("div",{className:"w-5 h-5 rounded border-2 border-[#3a3d50] bg-[#1b1c24] peer-checked:bg-[#1d63ed] peer-checked:border-[#1d63ed] flex items-center justify-center transition-colors",children:I&&(0,t.jsx)("svg",{className:"w-3 h-3 text-white",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round",children:(0,t.jsx)("path",{d:"M20 6 9 17l-5-5"})})})]}),(0,t.jsxs)("div",{className:"flex flex-col",children:[(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsxs)("svg",{className:"w-4 h-4 text-[#676a7c]",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,t.jsx)("rect",{width:"20",height:"16",x:"2",y:"4",rx:"2"}),(0,t.jsx)("path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"})]}),(0,t.jsx)("span",{className:"text-[14px] font-bold text-[#c5cde0] group-hover:text-white transition-colors",children:"E-mailové potvrdenie"})]}),(0,t.jsxs)("p",{className:"text-[11px] text-[#676a7c] mt-1 leading-relaxed",children:["Zaslanie potvrdenia o vykonaní platby e-mailom je spoplatnené v zmysle platného ",(0,t.jsx)("span",{className:"text-[#1d63ed] font-medium",children:"Sadzobníka"}),"."]})]})]})]}),W&&(0,t.jsxs)("div",{className:"flex gap-2 p-3 bg-red-950/20 border border-red-500/20 rounded-[14px] mt-1",children:[(0,t.jsx)(b,{className:"w-4 h-4 text-red-500 shrink-0 mt-0.5"}),(0,t.jsx)("p",{className:"text-[12px] text-red-400 font-medium",children:W})]}),(0,t.jsxs)("div",{className:"flex flex-col gap-3 mt-4",children:[(0,t.jsxs)("button",{type:"button",onClick:()=>{d("Odoslana platba"),p("SK99 0900 0000 0000 1234 5678"),j("120.50"),k("20260601"),S("0308"),z("123"),O("Uhrada faktury"),M("FAK-2026-06")},className:"w-full h-11 bg-transparent border-2 border-dashed border-[#7a3b7c] hover:bg-[#7a3b7c]/20 text-[#c5cde0] hover:text-white font-bold rounded-[14px] transition-colors active:scale-[0.98] flex items-center justify-center gap-2 text-[14px]",children:[(0,t.jsx)("span",{className:"text-[18px]",children:"🪄"}),"Vyplniť testovacie údaje"]}),(0,t.jsx)("button",{type:"submit",disabled:F||!u||!c,className:"w-full h-11 bg-[#1d63ed] hover:bg-[#154fc2] disabled:bg-[#1a1b24] disabled:text-[#474959] text-white font-bold rounded-full transition-colors active:scale-[0.98] flex items-center justify-center text-[14px]",children:F?"Spracováva sa...":"Podpísať platbu"}),(0,t.jsx)("button",{type:"button",className:"w-full h-11 bg-transparent border border-[#1d63ed] text-[#1d63ed] font-bold rounded-full hover:bg-[#1d63ed]/10 transition-colors active:scale-[0.98] flex items-center justify-center text-[14px]",children:"Uložiť na neskôr"})]})]}),(0,t.jsx)("div",{className:"fixed bottom-6 left-5 z-[70] w-10 h-10 rounded-full bg-[#1b1c24] border border-[#3a3d52] flex items-center justify-center shadow-lg",children:(0,t.jsx)("span",{className:"text-white font-black text-[14px] leading-none",children:"N"})})]})}var j=e.i(69120),y=e.i(76339),k=e.i(62706);e.s(["DashboardClient",0,function({accounts:e,transactions:p}){let m=(0,s.useRouter)(),[h,u]=(0,a.useState)(!0),[b,f]=(0,a.useState)(!1),[g,N]=(0,a.useState)("all"),[S,C]=(0,a.useState)(null);(0,a.useEffect)(()=>{let e=()=>f(!0);return window.addEventListener("open-transfer-modal",e),()=>window.removeEventListener("open-transfer-modal",e)},[]);let z=e[0],A=z?.id||"",O=e=>null==e?"0,00":(Number(e)/100).toFixed(2).replace(".",","),P=(e,t=z?.currency??"EUR")=>null==e?`0,00 ${t}`:`${(Number(e)/100).toFixed(2).replace(".",",")} ${t}`,M=e=>{let[t="",a="",s=""]=(e.description??"").split("|"),l="withdrawal"===e.type,r="deposit"===e.type&&!!e.toAccountId,n="deposit"===e.type&&!e.toAccountId;return{name:t.trim()||(l?"Odoslaná platba":r?"Prijatá platba":"Dobitie účtu"),note:a.trim()||(l?"Interný prevod":r?"Prijatá platba":"Pridanie peňazí"),category:s.trim()||(l?"Nezaradené výdavky":"Ostatné nepravidelné príjmy"),direction:l?"outgoing":r?"incoming":n?"deposit":"incoming",label:l?"Odoslané":r?"Prijaté":"Dobitie",signedAmount:l?`- ${P(e.amount)}`:`+ ${P(e.amount)}`,amountClass:l?"text-[#ef4444]":"text-[#22c55e]"}},E=p.filter(e=>"all"===g||M(e).direction===g);return(0,t.jsxs)("div",{className:"flex-1 bg-[#12131a] text-white flex flex-col font-sans min-h-[100dvh] select-none",children:[(0,t.jsx)("div",{className:"w-full bg-[#181921] border-b border-[#24262f] px-6 py-3.5 text-[15px] font-semibold text-white tracking-wide",children:"Domov"}),(0,t.jsxs)("div",{className:"max-w-md mx-auto w-full flex-1 flex flex-col px-4 pt-4 pb-28",children:[(0,t.jsxs)("div",{className:"w-full bg-[#181921] border border-[#2b2d35] rounded-xl overflow-hidden mb-5 shadow-md",children:[(0,t.jsxs)("button",{type:"button",onClick:()=>u(!h),className:"w-full p-4 flex items-center justify-between hover:bg-[#20212a] transition-colors focus:outline-none",children:[(0,t.jsx)("span",{className:"text-base font-semibold text-white tracking-wide",children:"Vaše produkty"}),(0,t.jsx)("div",{className:"w-7 h-7 rounded-full bg-[#1e2535] border border-[#2a3142] flex items-center justify-center text-[#1d63ed]",children:h?(0,t.jsx)(n.ChevronUp,{className:"w-4 h-4"}):(0,t.jsx)(i.ChevronDown,{className:"w-4 h-4"})})]}),h&&(0,t.jsxs)("div",{className:"px-4 pb-6 pt-2 border-t border-[#24262f]/60 bg-[#12131a]",children:[(0,t.jsxs)("div",{className:"flex justify-between items-center mb-4 mt-2",children:[(0,t.jsx)("span",{className:"text-xs font-bold text-[#8e9bb5] uppercase tracking-wider",children:"Bežné účty"}),(0,t.jsx)("button",{type:"button",className:"text-xs font-bold text-[#1d63ed] hover:underline",children:"Usporiadať"})]}),(0,t.jsxs)("div",{onClick:()=>{A&&m.push(`/dashboard/accounts/${A}`)},className:"flex items-center gap-4 py-3 hover:bg-[#181921]/60 rounded-xl px-2 -mx-2 cursor-pointer transition-colors",children:[(0,t.jsx)("div",{className:"w-12 h-12 rounded-full border border-[#3c342f] overflow-hidden shrink-0 ring-1 ring-orange-500/30",children:(0,t.jsx)("img",{src:"https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",alt:"Account Avatar",className:"w-full h-full object-cover"})}),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsx)("p",{className:"text-xs text-[#8e9bb5] font-medium",children:"Tomáš"}),(0,t.jsx)("h4",{className:"font-bold text-sm text-white mt-0.5",children:"SPACE účet"}),(0,t.jsx)("p",{className:"text-[11px] text-[#8e9bb5] font-medium tracking-wide mt-0.5",children:z?.accountNumber??"SK67 0900 0000 0050 4463 0752"}),(0,t.jsxs)("p",{className:"text-sm font-bold text-[#22c55e] mt-1",children:["€ ",O(z?.balance??85)]})]})]}),(0,t.jsx)("div",{className:"mb-4 mt-6",children:(0,t.jsx)("span",{className:"text-xs font-bold text-[#8e9bb5] uppercase tracking-wider",children:"Karty"})}),(0,t.jsx)("div",{className:"flex flex-col divide-y divide-[#20212a]/50",children:[{name:"VISA elektronická",owner:"TOMÁŠ",status:"BLOKOVANÁ",type:"visa-electron"},{name:"VISA elektronická Vlastná karta",owner:"TOMÁŠ",status:"BLOKOVANÁ",type:"visa-electron"},{name:"VISA elektronická",owner:"TOMÁŠ",number:"4544 12** **** 1234",type:"visa-electron"},{name:"VISA elektronická Vlastná karta",owner:"TOMÁŠ",number:"4544 12** **** 4321",type:"visa-electron"},{name:"VISA Platinum",owner:"TOMÁŠ",number:"4544 12** **** 4444",type:"visa-platinum"},{name:"VISA elektronická Vlastná karta",owner:"TOMÁŠ",status:"BLOKOVANÁ",type:"visa-electron"}].map((e,a)=>(0,t.jsxs)("div",{className:"flex items-center gap-4 py-3.5 px-1 select-none",children:["visa-platinum"===e.type?(0,t.jsx)("div",{className:"w-11 h-11 rounded-full border border-[#2b2e3c] overflow-hidden shrink-0 bg-gradient-to-br from-[#d4af37] via-[#a37c1a] to-[#5c4008]",children:(0,t.jsx)("img",{src:"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&q=80",alt:"Platinum Card",className:"w-full h-full object-cover saturate-50 contrast-125"})}):(0,t.jsx)("div",{className:"w-11 h-11 rounded-full bg-[#1a1d26] border border-[#242630] flex flex-col items-center justify-center shrink-0 text-white font-black text-[9px] tracking-wider",children:"VISA"}),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsx)("p",{className:"text-[10px] text-[#8e9bb5] font-semibold tracking-wide uppercase",children:e.owner}),(0,t.jsx)("h4",{className:"font-bold text-[13px] text-white mt-0.5 truncate",children:e.name}),e.number&&(0,t.jsx)("p",{className:"text-[11px] text-[#8e9bb5] font-medium mt-0.5 tracking-wider",children:e.number}),"BLOKOVANÁ"===e.status&&(0,t.jsx)("span",{className:"bg-[#ef4444]/10 text-[#ef4444] text-[8px] font-black px-2 py-0.5 rounded border border-[#ef4444]/20 mt-1 inline-block uppercase tracking-widest",children:"BLOKOVANÁ"})]})]},a))})]})]}),(0,t.jsxs)("section",{className:"w-full bg-[#181921] border border-[#2b2d35] rounded-xl overflow-hidden mb-5 shadow-md",children:[(0,t.jsxs)("div",{className:"p-4 border-b border-[#24262f]/80",children:[(0,t.jsxs)("div",{className:"flex items-start justify-between gap-3",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"text-xs font-bold text-[#8e9bb5] uppercase tracking-wider",children:"História"}),(0,t.jsx)("h2",{className:"text-base font-bold text-white mt-1",children:"Prehľad prevodov"})]}),(0,t.jsxs)("div",{className:"text-right",children:[(0,t.jsx)("p",{className:"text-[11px] text-[#8e9bb5] font-semibold",children:"Aktuálny zostatok"}),(0,t.jsxs)("p",{className:"text-sm font-black text-[#22c55e] mt-0.5",children:["€ ",O(z?.balance??0)]})]})]}),(0,t.jsx)("div",{className:"mt-4 flex gap-2 overflow-x-auto pb-1",children:[{value:"all",label:"Všetko"},{value:"incoming",label:"Prijaté"},{value:"outgoing",label:"Odoslané"},{value:"deposit",label:"Dobitie"}].map(e=>(0,t.jsx)("button",{type:"button",onClick:()=>N(e.value),className:`h-9 shrink-0 rounded-full border px-3 text-xs font-bold transition-colors ${g===e.value?"border-[#1d63ed] bg-[#1d63ed] text-white":"border-[#2b3347] bg-[#141821] text-[#c5cde0] hover:border-[#1d63ed]/70"}`,children:e.label},e.value))})]}),E.length>0?(0,t.jsx)("div",{className:"divide-y divide-[#24262f]/70",children:E.slice(0,12).map(e=>{let a=M(e),s="outgoing"===a.direction?r.ArrowUpRight:"deposit"===a.direction?c.WalletCards:l.ArrowDownLeft;return(0,t.jsx)("button",{type:"button",onClick:()=>C(e),className:"w-full px-4 py-3.5 text-left transition-colors hover:bg-[#20212a]",children:(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("div",{className:"flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2b3347] bg-[#121620]",children:(0,t.jsx)(s,{className:`h-4 w-4 ${a.amountClass}`})}),(0,t.jsxs)("div",{className:"min-w-0 flex-1",children:[(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)("p",{className:"truncate text-sm font-bold text-white",children:a.name}),(0,t.jsx)("span",{className:"shrink-0 rounded-full bg-[#222a3a] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#8e9bb5]",children:a.label})]}),(0,t.jsxs)("p",{className:"mt-0.5 truncate text-[11px] font-medium text-[#8e9bb5]",children:[(0,k.formatTransactionDateTime)(e.createdAt)," | ",a.note]}),(0,t.jsxs)("p",{className:"mt-1 text-[11px] font-semibold text-[#6f7a90]",children:["Zostatok po: ",e.balanceAfter?`€ ${O(e.balanceAfter)}`:"nezaznamenané"]}),a.category&&(0,t.jsx)("span",{className:`inline-block ${(0,v.getCategoryConfigByName)(a.category).bgClass} ${(0,v.getCategoryConfigByName)(a.category).textClass} text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 border ${(0,v.getCategoryConfigByName)(a.category).borderClass} w-fit`,children:a.category})]}),(0,t.jsx)("p",{className:`shrink-0 text-sm font-black ${a.amountClass}`,children:a.signedAmount.replace("EUR","€")})]})},e.id)})}):(0,t.jsxs)("div",{className:"px-4 py-8 text-center",children:[(0,t.jsx)("div",{className:"mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#2b3347] bg-[#121620]",children:(0,t.jsx)(d.Search,{className:"h-4 w-4 text-[#8e9bb5]"})}),(0,t.jsx)("p",{className:"mt-3 text-sm font-bold text-white",children:"Žiadne transakcie v tomto filtri"}),(0,t.jsx)("p",{className:"mt-1 text-xs text-[#8e9bb5]",children:"Po ďalšom prevode sa objavia priamo tu."})]})]}),(0,t.jsx)(j.AddMoneyFooter,{accountId:A,accountNumber:z?.accountNumber,balance:z?.balance,currency:z?.currency??"EUR"}),(0,t.jsx)(y.AssistantWidget,{})]}),S&&(0,t.jsx)("div",{className:"fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 pb-4 pt-20 backdrop-blur-sm",children:(0,t.jsxs)("div",{className:"w-full max-w-md rounded-[18px] border border-[#2b3347] bg-[#151922] shadow-2xl",children:[(0,t.jsxs)("div",{className:"flex items-start justify-between gap-3 border-b border-[#242b3a] p-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"text-xs font-bold uppercase tracking-wider text-[#8e9bb5]",children:"Detail transakcie"}),(0,t.jsx)("h3",{className:"mt-1 text-lg font-black text-white",children:M(S).name})]}),(0,t.jsx)("button",{type:"button",onClick:()=>C(null),className:"rounded-full p-1.5 text-[#8e9bb5] transition-colors hover:bg-white/10 hover:text-white","aria-label":"Zavrieť detail transakcie",children:(0,t.jsx)(x.X,{className:"h-4 w-4"})})]}),(0,t.jsx)("div",{className:"space-y-3 p-4 text-sm",children:[["Suma",M(S).signedAmount.replace("EUR","€")],["Typ",M(S).label],["Stav",S.status],["Dátum",(0,k.formatTransactionDateMedium)(S.createdAt)],["Poznámka",M(S).note],["Kategória",M(S).category],["Zostatok pred",S.balanceBefore?`€ ${O(S.balanceBefore)}`:"nezaznamenané"],["Zostatok po",S.balanceAfter?`€ ${O(S.balanceAfter)}`:"nezaznamenané"],["ID transakcie",S.id]].map(([e,a])=>{let s="Kategória"===e,l=s?(0,v.getCategoryConfigByName)(a):null;return(0,t.jsxs)("div",{className:"flex items-start justify-between gap-4 rounded-[12px] bg-[#10141d] px-3 py-2.5",children:[(0,t.jsx)("span",{className:"shrink-0 text-xs font-bold uppercase tracking-wide text-[#8e9bb5]",children:e}),s&&l?(0,t.jsx)("span",{className:`inline-block ${l.bgClass} ${l.textClass} text-[10px] font-bold px-2 py-0.5 rounded-full border ${l.borderClass}`,children:a}):(0,t.jsx)("span",{className:"break-all text-right text-xs font-semibold text-white",children:a})]},e)})}),("withdrawal"===S.type||"transfer"===S.type)&&(0,t.jsxs)("div",{className:"border-t border-[#242b3a] p-4 flex flex-col gap-2",children:[(0,t.jsx)("a",{href:`/api/export/payment-confirmation?transactionId=${encodeURIComponent(S.id)}`,target:"_blank",rel:"noopener noreferrer",className:"w-full h-11 rounded-full bg-[#1d63ed] hover:bg-[#154fc2] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors",children:"Zobraziť doklad"}),(0,t.jsxs)("a",{href:`/api/export/payment-confirmation?transactionId=${encodeURIComponent(S.id)}`,download:!0,className:"w-full h-11 rounded-full bg-[#10141d] hover:bg-[#181d29] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-[#2b3347]",children:[(0,t.jsx)(o.Download,{className:"h-4 w-4"}),"Stiahnuť doklad"]})]})]})}),b&&(0,t.jsx)("div",{className:"fixed inset-0 z-[60] bg-[#12131a] animate-fade-in flex flex-col overflow-y-auto",children:(0,t.jsx)(w,{accountId:A,accounts:e,onClose:()=>f(!1)})})]})}],308)}]);