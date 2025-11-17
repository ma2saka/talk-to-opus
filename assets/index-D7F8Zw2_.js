(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))g(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const m of n.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&g(m)}).observe(document,{childList:!0,subtree:!0});function f(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerPolicy&&(n.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?n.credentials="include":o.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function g(o){if(o.ep)return;o.ep=!0;const n=f(o);fetch(o.href,n)}})();const y=document.querySelector("#app");if(!y)throw new Error("#app root element is missing");function p(e){const t=document.querySelector(e);if(!t)throw new Error(`${e} を取得できませんでした`);return t}y.innerHTML=`
  <main class="recorder">
    <header>
      <h1>ブラウザ録音 (Opus)</h1>
      <p class="description">
        マイクの音声をブラウザだけで録音し、完了時に Opus 形式でダウンロードします。
      </p>
    </header>
    <section class="status-panel">
      <p id="statusText" aria-live="polite">録音待機中</p>
      <p id="mimeText" class="hint" aria-live="polite"></p>
    </section>
    <section class="controls">
      <button id="recordButton" type="button">録音</button>
      <button id="finishButton" type="button" disabled>完了</button>
    </section>
    <p class="hint">
      初回はマイク使用許可のダイアログが表示されます。録音を完了すると、ブラウザが自動的にファイルをダウンロードします。
    </p>
  </main>
`;const h=p("#statusText"),R=p("#mimeText"),u=p("#recordButton"),l=p("#finishButton"),L=["audio/ogg;codecs=opus","audio/webm;codecs=opus","audio/ogg","audio/webm"];let b=null,i=null,c=[],s,d=null;const T=typeof navigator<"u"&&!!navigator.mediaDevices,O=typeof window<"u"&&"MediaRecorder"in window,v=T&&O;v||(h.textContent="このブラウザは録音に対応していません",u.disabled=!0,l.disabled=!0);function r(e){h.textContent=e}function a(e){e==="idle"?(u.disabled=!1,l.disabled=!0):e==="recording"?(u.disabled=!0,l.disabled=!1):(u.disabled=!0,l.disabled=!0)}function w(){b?.getTracks().forEach(e=>e.stop()),b=null}function M(){if(!(typeof MediaRecorder>"u"))return L.find(e=>MediaRecorder.isTypeSupported(e))}async function E(){if(!(!v||i?.state==="recording"))try{r("マイクを準備しています…"),a("saving");const e=await navigator.mediaDevices.getUserMedia({audio:!0});b=e,s=M(),c=[],i=new MediaRecorder(e,s?{mimeType:s}:void 0),R.textContent=s?`利用中のコーデック: ${s}`:"利用可能な Opus コーデックを確認できませんでした",i.addEventListener("dataavailable",t=>{t.data&&t.data.size>0&&c.push(t.data)}),i.addEventListener("stop",()=>{x()},{once:!0}),i.start(),r("録音中… 完了ボタンで停止します"),a("recording")}catch(e){console.error(e),w(),i=null,c=[],r("録音を開始できませんでした。マイク権限やデバイス設定を確認してください"),a("idle")}}function S(e){d&&URL.revokeObjectURL(d),d=URL.createObjectURL(e);const t=document.createElement("a"),f=new Date().toISOString().replace(/[:.]/g,"-");t.href=d,t.download=`recording-${f}.opus`,t.style.display="none",document.body.appendChild(t),t.click(),document.body.removeChild(t)}function x(){const e=s??"audio/webm;codecs=opus";if(w(),!c.length){r("録音データが取得できませんでした。もう一度お試しください"),a("idle");return}const t=new Blob(c,{type:e});S(t),r("録音データをダウンロードしました"),a("idle"),i=null,c=[]}function B(){if(!i){r("録音が開始されていません");return}if(i.state==="inactive"){r("録音データは既に処理済みです");return}r("録音を停止しています…"),a("saving"),i.stop()}u?.addEventListener("click",()=>{E()});l?.addEventListener("click",()=>{B()});window.addEventListener("beforeunload",()=>{d&&URL.revokeObjectURL(d)});
