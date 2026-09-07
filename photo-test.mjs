/* ⭐ 원장님 실사진 시험대 (v3.61.0~) — 2026-09-07
   고객 사진은 **저장소에 넣지 않습니다**. /home/claude/pb-photos/*.jpg 에만 둡니다(공개 Pages 저장소 금지).
   사용:  PB_CHROME=... node photo-test.mjs            → 전체
          PB_CHROME=... node photo-test.mjs p3         → 한 장
   찍어 주는 것: 열마다의 경계 점수(윗선/아랫선) · 지금 문턱(절대)과 후보 문턱에서의 표시 개수 · 골짜기 유무.
   ⚠️ 컨테이너에서는 MediaPipe 가 막혀 **예비 경로**로 읽습니다 — 실기기(랜드마크 경로)와 자 위치가 다를 수
   있으나, 여기서 보는 것은 「같은 궤적 위의 점수 분포」라 문턱 비교에는 그대로 쓸 수 있습니다. */
import { chromium } from "playwright";
import http from "http"; import fs from "fs"; import path from "path";
const ROOT = "/home/claude/pb-deploy", PHOTOS = "/home/claude/pb-photos";
const MIME = {".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".css":"text/css"};
const server = http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split("?")[0]);const f=path.join(ROOT,u==="/"?"index.html":u);
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{"Content-Type":MIME[path.extname(f)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>server.listen(0,r));
const U=`http://127.0.0.1:${server.address().port}/index.html`;
const SHOT = process.argv.includes("--shot");     /* 점선을 얹은 화면을 /tmp/r-<이름>.png 로 저장 */
const only = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
const files=fs.readdirSync(PHOTOS).filter(f=>/\.(jpg|jpeg|png)$/i.test(f)).filter(f=>!only||f.startsWith(only)).sort();
const br=await chromium.launch({executablePath:process.env.PB_CHROME});
const dump={};
for (const f of files) {
  const c=await br.newContext({viewport:{width:844,height:390},deviceScaleFactor:SHOT?2:1,hasTouch:true,isMobile:true});
  const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto(U,{waitUntil:"domcontentloaded"}); await p.waitForTimeout(400);
  await p.setInputFiles("#fileInput", path.join(PHOTOS,f)); await p.waitForTimeout(3500);
  const r=await p.evaluate(()=>{const S=window.PB.S;
    const auto=window.PB.autoFromDrawing();
    if(!window.PB.runBalanceCurve())return{ok:false,auto};
    const t=S.balCurve[S.refSide].trace;
    const th=t.map(q=>q.bot-q.top).filter(isFinite).sort((a,b)=>a-b);
    return{ok:true,auto,read:S.balCurve.read,n:t.length,ref:S.refSide,
      thick:+th[Math.floor(th.length/2)].toFixed(1),
      rows:t.map(q=>({x:+q.x.toFixed(1),top:+q.top.toFixed(1),bot:q.bot===undefined?null:+q.bot.toFixed(1),
        st:typeof q.scoreTop==="number"?+q.scoreTop.toFixed(3):null,
        sb:typeof q.scoreBot==="number"?+q.scoreBot.toFixed(3):null,
        ct:typeof q.contTop==="number"?+q.contTop.toFixed(1):null,
        cb:typeof q.contBot==="number"?+q.contBot.toFixed(1):null}))};
  });
  if (SHOT && r.ok) {
    await p.evaluate(()=>{const S=window.PB.S; S.balOn=true; S.balAnim=null; S.balOpacity=1; window.PB.render();});
    await p.locator("#stage").screenshot({path:`/tmp/r-${f.replace(/\.[^.]+$/,"")}.png`});
  }
  dump[f]={...r,errs};
  console.log(`${f}  ${r.ok?`열 ${r.n} · 두께 ${r.thick}px · 읽음 ${r.read}% · 기준쪽 ${r.ref}`:"판독 실패(runBalanceCurve false)"}${errs.length?" · 오류 "+errs.length:""}`);
  await c.close();
}
fs.writeFileSync("/tmp/photo-scores.json", JSON.stringify(dump));
await br.close(); server.close();
