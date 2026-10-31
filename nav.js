/*
 * nav.js - แถบเมนูกลางของเว็บหุ้น : ไฟล์เดียว ไม่มี dependency
 *
 * วิธีติดตั้งในหน้าใดก็ได้ : วางบรรทัดเดียวนี้ "ทันทีหลังแท็ก <body>"
 *     <script src="nav.js" data-current="us"></script>
 * data-current = hub | us | set | earn | vol | port | dr   (หน้าไหนก็ใส่ id ของหน้านั้น)
 * ลิงก์ในเว็บเดียวกัน (hub.html, index.html, set.html) เป็น relative ; ลิงก์ภายนอกเป็น URL เต็ม
 *
 * ไฟล์นี้อยู่ที่ web/site/nav.js ; publish_board.sh ยกไปไว้ root ของ Pages ทุกครั้งที่เผยแพร่ (พร้อม hub.html)
 *
 * สคริปต์นี้ฉีด <style> + <nav> เองแบบ synchronous (หน้าจึงไม่กระตุกตอนโหลด)
 * สีมาจากตัวแปร CSS ของหน้าเจ้าบ้าน (--surface, --ink, --line ...) ถ้าไม่มีใช้ค่าสำรองในไฟล์นี้ -> ใส่หน้าไหนก็กลืนกับหน้านั้น
 * รองรับ dark mode ตามหน้าเจ้าบ้าน (prefers-color-scheme / data-theme)
 */
(function () {
  'use strict';
  var me = document.currentScript;
  var CUR = (me && me.getAttribute('data-current')) || '';

  // ---- รายการลิงก์ (แก้ที่เดียวตรงนี้) --------------------------------------------------
  // local = เปิดได้เฉพาะคอมเครื่องนี้ (มีเส้นประ + ไอคอนบ้าน) ; ext = เปิดนอกเว็บนี้ (ไอคอนลูกศร, เปิดแท็บใหม่)
  var EARN = 'https://earnings-board.tik-reminder.workers.dev';
  var VOL = 'https://caketiknarak-hash.github.io/volume-board/';
  var LINKS = [
    { id: 'hub',  label: 'ศูนย์รวม', title: 'ศูนย์รวมกระดานหุ้นทั้งหมด', href: 'hub.html' },
    { id: 'us',   label: 'US',       title: 'US Momentum - sector/ธีมหุ้นสหรัฐ', href: 'index.html' },
    { id: 'set',  label: 'SET',      title: 'SET - ธีมหุ้นไทย', href: 'set.html' },
    { id: 'earn', label: 'งบ',       title: 'Earnings - หุ้นสหรัฐที่ประกาศงบ + ราคา pre/post', href: EARN, ext: true },
    // วอลุ่ม: อยู่ repo แยก volume-board (Pages เดียวกัน ไม่ต้อง login) อัปเดตจากคอมเครื่องนี้ด้วย Task Scheduler
    { id: 'vol',  label: 'วอลุ่ม',   title: 'กระดานป้ายวอลุ่ม SET/US - มี 2 แท็บ หุ้นไทย / หุ้น USA', href: VOL, ext: true },
    { id: 'port', label: 'พอร์ต',    title: 'พอร์ต - เปิดได้เฉพาะคอมเครื่องนี้', href: 'http://localhost:8890', local: true, ext: true },
    { id: 'dr',   label: 'DR',       title: 'DR Converter - เปิดได้เฉพาะคอมเครื่องนี้', href: 'http://localhost:8899', local: true, ext: true }
  ];

  // ---- CSS --------------------------------------------------------------------------------
  var css = [
    ':root{--stk-nav-h:44px}',
    'html{scroll-padding-top:var(--stk-nav-h)}',
    '#stk-nav{position:sticky;top:0;z-index:40;height:var(--stk-nav-h);display:block;box-sizing:border-box;',
    '  background:color-mix(in srgb,var(--surface,#fff) 92%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);',
    '  border-bottom:1px solid var(--line,var(--border,#e4e3dc));font-family:inherit;font-size:14px;line-height:1.2;color:var(--ink-2,#4f4e49);}',
    '#stk-nav *{box-sizing:border-box}',
    '#stk-nav .stk-in{max-width:1180px;margin:0 auto;height:100%;position:relative}',
    '#stk-nav .stk-row{display:flex;align-items:center;gap:6px;height:100%;padding:0 16px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;',
    '  scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}',
    '#stk-nav .stk-row::-webkit-scrollbar{display:none}',
    '#stk-nav.stk-more .stk-in::after{content:"";position:absolute;right:0;top:0;bottom:0;width:28px;pointer-events:none;',
    '  background:linear-gradient(to right,transparent,var(--surface,#fff))}',
    '#stk-nav a{flex:none;display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 12px;border-radius:999px;',
    '  color:var(--ink-2,#4f4e49);text-decoration:none;font-weight:500;border:1px solid transparent}',
    '#stk-nav a:hover{background:var(--surface-2,#f0f0ec);color:var(--ink,#12120f)}',
    '#stk-nav a[aria-current="page"]{background:var(--ink,#12120f);color:var(--bg,#f5f5f2);font-weight:600}',
    '#stk-nav a:focus-visible{outline:2px solid var(--imp,#2a78d6);outline-offset:1px}',
    '#stk-nav a.stk-local{border:1px dashed var(--line-2,var(--border-strong,#cfcdc4));color:var(--muted,#6f6d66)}',
    '#stk-nav a.stk-local:hover{color:var(--ink,#12120f)}',
    '#stk-nav a[aria-current="page"].stk-local{border-style:solid;border-color:transparent;color:var(--bg,#f5f5f2)}',
    '#stk-nav svg{width:12px;height:12px;flex:none;opacity:.7}',
    // ---- ปรับหน้าเจ้าบ้านให้ไม่ชนกับแถบนี้ (แถบ sticky สูง --stk-nav-h) ----
    // แถบเครื่องมือ sticky ของกระดาน US/SET เดิม top:0 -> ดันลงมาต่อใต้แถบนี้ ; แผนภาพคู่มือ sticky top:64px -> บวกความสูงแถบ
    'body .toolbar{top:var(--stk-nav-h)}',
    'body .guide-fig{top:calc(64px + var(--stk-nav-h))}'
  ].join('\n');

  var st = document.createElement('style');
  st.id = 'stk-nav-css';
  st.textContent = css;
  document.head.appendChild(st);

  // ---- HTML -------------------------------------------------------------------------------
  var ICON_HOME = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7.5 8 2.5l6 5M3.5 6.5V13.5h9V6.5"/></svg>';
  var ICON_EXT = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h7v7M13 3 5 11"/></svg>';

  var nav = document.createElement('nav');
  nav.id = 'stk-nav';
  nav.setAttribute('aria-label', 'เมนูหลักของเว็บหุ้น');
  var row = document.createElement('div');
  row.className = 'stk-row';
  var inner = document.createElement('div');
  inner.className = 'stk-in';

  LINKS.forEach(function (l) {
    var a = document.createElement('a');
    a.href = l.href;
    var isExt = l.ext === true;
    var t = l.title || '';
    if (l.local) t += ' (ใช้ไม่ได้จากมือถือ)';
    a.title = t;
    a.innerHTML = (l.local ? ICON_HOME : '') + '<span>' + l.label + '</span>' + (isExt ? ICON_EXT : '');
    if (l.local) a.className = 'stk-local';
    if (isExt) { a.target = '_blank'; a.rel = 'noopener'; }
    if (l.id === CUR) { a.setAttribute('aria-current', 'page'); a.removeAttribute('target'); }
    row.appendChild(a);
  });
  inner.appendChild(row);
  nav.appendChild(inner);
  document.body.insertBefore(nav, document.body.firstChild);

  // ---- พฤติกรรมเล็ก ๆ : เลื่อนให้เห็นหน้าปัจจุบัน + เงาขอบขวาเมื่อยังมีเมนูซ่อน ------------------
  function more() {
    var hasMore = row.scrollWidth > row.clientWidth + row.scrollLeft + 4;
    nav.classList.toggle('stk-more', hasMore);
  }
  row.addEventListener('scroll', more, { passive: true });
  window.addEventListener('resize', more);
  var cur = row.querySelector('[aria-current]');
  if (cur) {
    // เลื่อนเฉพาะแถบเมนู (ไม่ใช้ scrollIntoView เพราะจะเลื่อนทั้งหน้า)
    row.scrollLeft = Math.max(0, cur.offsetLeft - (row.clientWidth - cur.offsetWidth) / 2);
  }
  more();
  // เผื่อฟอนต์โหลดเสร็จแล้วความกว้างเปลี่ยน
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(more);
})();
