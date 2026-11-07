/*
 * nav.js (เวอร์ชันแถบเมนูด้านซ้าย) - เมนูกลางของเว็บหุ้น : ไฟล์เดียว ไม่มี dependency
 *
 * วิธีติดตั้งในหน้าใดก็ได้ : วางบรรทัดเดียวนี้ "ทันทีหลังแท็ก <body>"
 *     <script src="nav.js" data-current="us"></script>
 * data-current = overview | us | set | earn | vol | hold | port | dr   (หน้าไหนก็ใส่ id ของหน้านั้น)
 *
 * ใช้ข้ามโดเมนได้ : หน้าบนโดเมนอื่น (กระดานงบ / กระดานวอลุ่ม) โหลดจาก URL เต็ม
 *     <script src="https://caketiknarak-hash.github.io/momentum-board/nav.js" data-current="earn"></script>
 * ลิงก์ไปหน้าในเว็บ momentum-board (overview.html, index.html, set.html) และไฟล์ meta*.json
 * คำนวณจากตำแหน่งของ <script> นี้เอง (document.currentScript.src) ไม่ใช่ relative กับหน้าเจ้าบ้าน
 * จะให้ meta ดึงจากที่อื่นก็ใส่ data-meta-base="https://.../" ที่แท็ก <script> (ไม่ใส่ = ที่เดียวกับ nav.js)
 *
 * หน้าจอกว้าง >= 900px : แถบซ้ายติดขอบ (position:fixed) ดัน body ด้วย padding-left = --stk-side-w ; --stk-nav-h = 0
 * หน้าจอแคบ  <  900px : แถบบน sticky สูง 48px (ปุ่ม ☰ + ชื่อหน้า) กดแล้วเลื่อนลิ้นชักจากซ้าย ; --stk-nav-h = 48px
 *
 * จุดสถานะบนไอคอน ภาพรวม/US/SET : อ่าน meta*.json ({data_through, built_at_utc}) แล้วเทียบกับวันที่ที่ควรเป็น
 *   เขียว = สด, เหลือง = ค้าง 1 วันทำการ, แดง = ค้างตั้งแต่ 2 วันขึ้นไป ; ดึงไม่ได้/เกิน 8 วินาที = ไม่แสดงจุด
 *   ไม่มีค่าข้อมูลฝังในไฟล์นี้ (ดึงสดทุกครั้งที่เปิดหน้า)
 *
 * สีมาจากตัวแปร CSS ของหน้าเจ้าบ้าน (--surface, --ink, --line, --imp ...) ถ้าไม่มีใช้ค่าสำรองในไฟล์นี้ (มีทั้งสว่าง/มืด)
 * รองรับ dark mode ตามหน้าเจ้าบ้าน (prefers-color-scheme / data-theme)
 */
(function () {
  'use strict';
  var me = document.currentScript;
  var CUR = (me && me.getAttribute('data-current')) || '';

  // ---- ตำแหน่งของ nav.js -> base ของเว็บ momentum-board ---------------------------------------
  function dirOf(u) { try { return new URL('./', u).href; } catch (e) { return ''; } }
  var BASE = dirOf((me && me.src) || location.href);
  var META_BASE = (me && me.getAttribute('data-meta-base')) || BASE;
  if (META_BASE && META_BASE.charAt(META_BASE.length - 1) !== '/') META_BASE += '/';
  var META_TIMEOUT_MS = 8000;

  // ---- รายการลิงก์ (แก้ที่เดียวตรงนี้) --------------------------------------------------
  // site = ไฟล์ในเว็บ momentum-board (ต่อท้าย BASE) ; url = เว็บอื่น (URL เต็ม)
  // group main = กลุ่มบน ; local = กลุ่มล่างสุดของแถบ (เปิดได้เฉพาะคอมเครื่องนี้ -> เส้นประ + ไอคอนบ้าน + เปิดแท็บใหม่)
  // label = ชื่อสั้นใต้ไอคอนในแถบ ; full = ชื่อเต็มในลิ้นชักมือถือ/ชื่อหน้าบนแถบบน
  var EARN = 'https://earnings-board.tik-reminder.workers.dev';
  var VOL = 'https://caketiknarak-hash.github.io/volume-board/';
  // หุ้นที่ถือ: Cloudflare Pages ล็อกด้วย Cloudflare Access (ล็อกอินอีเมล OTP) - ไฟล์นี้มีแค่ลิงก์ ไม่มีข้อมูลพอร์ต
  var HOLD = 'https://holdings-board.pages.dev/';
  var LINKS = [
    { id: 'overview', group: 'main', label: 'ภาพรวม', full: 'ภาพรวมตลาด US', title: 'ภาพรวมตลาด US - ไฟสรุป สภาวะตลาด ความแกว่ง', site: 'overview.html', meta: 'meta_overview.json', exp: 'us' },
    { id: 'us',   group: 'main', label: 'US',     full: 'US Momentum',    title: 'US Momentum - sector/ธีมหุ้นสหรัฐ', site: 'index.html', meta: 'meta.json', exp: 'us' },
    { id: 'set',  group: 'main', label: 'SET',    full: 'SET ธีมหุ้นไทย', title: 'SET - ธีมหุ้นไทย', site: 'set.html', meta: 'meta_set.json', exp: 'set' },
    { id: 'earn', group: 'main', label: 'งบ',     full: 'งบ Earnings',    title: 'Earnings - หุ้นสหรัฐที่ประกาศงบ + ราคา pre/post', url: EARN },
    // วอลุ่ม: อยู่ repo แยก volume-board (Pages เดียวกัน ไม่ต้อง login) อัปเดตจากคอมเครื่องนี้ด้วย Task Scheduler
    { id: 'vol',  group: 'main', label: 'วอลุ่ม', full: 'กระดานป้ายวอลุ่ม', title: 'กระดานป้ายวอลุ่ม SET/US - มี 2 แท็บ หุ้นไทย / หุ้น USA', url: VOL },
    { id: 'hold', group: 'main', label: 'ที่ถือ', full: 'หุ้นที่ถือ',     title: 'สรุปหุ้นที่ถือรายตัว - ต้องล็อกอินด้วยอีเมล', url: HOLD },
    { id: 'port', group: 'local', label: 'พอร์ต', full: 'พอร์ต',         title: 'พอร์ต - เปิดได้เฉพาะคอมเครื่องนี้', url: 'http://localhost:8890', local: true },
    { id: 'dr',   group: 'local', label: 'DR',    full: 'DR Converter',   title: 'DR Converter - เปิดได้เฉพาะคอมเครื่องนี้', url: 'http://localhost:8899', local: true }
  ];
  var LOGO_TITLE = 'เว็บหุ้น - ไปหน้าภาพรวม';

  // ---- ไอคอน (เส้น stroke 24x24 เขียนเอง) --------------------------------------------------
  function svg(inner, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"' + (extra || '') + '>' + inner + '</svg>';
  }
  var ICONS = {
    // เกจ/มาตรวัด
    overview: svg('<path d="M4 16.5a8 8 0 0 1 16 0"/><path d="M12 16.5l3.6-4.8"/><circle cx="12" cy="16.5" r="1.3"/><path d="M5.2 20h13.6"/>'),
    // กราฟขึ้น
    us: svg('<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>'),
    // ธง
    set: svg('<path d="M6 21V4"/><path d="M6 5h12l-3 4 3 4H6"/>'),
    // ปฏิทิน
    earn: svg('<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4M8.5 15h2M13.5 15h2"/>'),
    // แท่งวอลุ่ม
    vol: svg('<path d="M6 20v-7M12 20V5M18 20v-10" stroke-width="3"/>'),
    // กระเป๋าเอกสาร (หุ้นที่ถือ)
    hold: svg('<rect x="3.5" y="7" width="17" height="12.5" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17M12 11.5v2"/>'),
    // วงกลมพาย
    port: svg('<circle cx="12" cy="12" r="9"/><path d="M12 12V3M12 12l6.4 6.4"/>'),
    // ลูกศรสลับ
    dr: svg('<path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/>'),
    // โลโก้ : เส้นกราฟขึ้นในกรอบมน
    logo: svg('<path d="M4 16l5-5 3.5 3.5L20 7" stroke-width="2.2"/>'),
    home: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 7.5 8 2.5l6 5M3.5 6.5V13.5h9V6.5"/></svg>',
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>')
  };

  // ---- CSS --------------------------------------------------------------------------------
  // ตัวแปรของแถบ (--stk-*) ดึงจากตัวแปรหน้าเจ้าบ้านก่อน ถ้าไม่มีใช้ค่าสำรอง (ชุดสว่าง ; ชุดมืดเมื่อหน้าอยู่โหมดมืด)
  var FB_LIGHT = '--stk-surface:var(--surface,#fff);--stk-surface2:var(--surface-2,#f0f0ec);--stk-ink:var(--ink,#12120f);--stk-ink2:var(--ink-2,#4f4e49);' +
    '--stk-muted:var(--muted,#6f6d66);--stk-line:var(--line,#e4e3dc);--stk-line2:var(--line-2,#cfcdc4);--stk-bg:var(--bg,#f5f5f2);' +
    '--stk-acc:var(--imp,#2a78d6);--stk-acc-bg:var(--imp-bg,#e6effb);--stk-acc-ink:var(--imp-ink,#1b559f);' +
    '--stk-ok:var(--lead,#1f9d55);--stk-warn:var(--weak,#e3a008);--stk-bad:var(--lag,#d24a43);';
  var FB_DARK = '--stk-surface:var(--surface,#1a1a18);--stk-surface2:var(--surface-2,#242421);--stk-ink:var(--ink,#f3f3ef);--stk-ink2:var(--ink-2,#c3c2b8);' +
    '--stk-muted:var(--muted,#9c9a90);--stk-line:var(--line,#2d2d2a);--stk-line2:var(--line-2,#43433e);--stk-bg:var(--bg,#0e0e0d);' +
    '--stk-acc:var(--imp,#4a90e8);--stk-acc-bg:var(--imp-bg,rgba(74,144,232,.17));--stk-acc-ink:var(--imp-ink,#96c3f6);' +
    '--stk-ok:var(--lead,#36c273);--stk-warn:var(--weak,#e8ae22);--stk-bad:var(--lag,#ec6a63);';

  var css = [
    ':root{' + FB_LIGHT + '--stk-side-w:92px;--stk-nav-h:48px}',
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){' + FB_DARK + '}}',
    ':root[data-theme="dark"]{' + FB_DARK + '}',
    'html{scroll-padding-top:var(--stk-nav-h)}',
    '#stk-side,#stk-top,#stk-drawer,#stk-scrim{box-sizing:border-box;font-family:inherit;line-height:1.25;color:var(--stk-ink2)}',
    '#stk-side *,#stk-top *,#stk-drawer *{box-sizing:border-box}',
    '#stk-side a,#stk-drawer a,#stk-top a{text-decoration:none;color:inherit}',
    '.stk-ic{position:relative;display:inline-block;width:22px;height:22px;flex:none}',
    '.stk-ic svg{display:block;width:22px;height:22px}',
    // จุดสถานะข้อมูล (มุมขวาบนของไอคอน)
    '.stk-dot{position:absolute;top:-3px;right:-5px;width:9px;height:9px;border-radius:50%;background:var(--stk-ok);box-shadow:0 0 0 2px var(--stk-surface)}',
    '.stk-dot.warn{background:var(--stk-warn)}',
    '.stk-dot.bad{background:var(--stk-bad)}',
    '.stk-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}',
    // ---- แถบมือถือ (ค่าเริ่มต้น < 900px) : แถบบน + ลิ้นชัก ----
    '#stk-side{display:none}',
    '#stk-top{position:sticky;top:0;z-index:40;height:48px;display:flex;align-items:center;gap:6px;padding:0 8px;',
    '  background:color-mix(in srgb,var(--stk-surface) 94%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);',
    '  border-bottom:1px solid var(--stk-line);font-size:15px}',
    '#stk-top .stk-burger{flex:none;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:0;border-radius:10px;',
    '  background:transparent;color:var(--stk-ink);cursor:pointer;font:inherit}',
    '#stk-top .stk-burger:hover{background:var(--stk-surface2)}',
    '#stk-top .stk-ttl{flex:1;min-width:0;font-weight:600;color:var(--stk-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.stk-logo{display:inline-flex;align-items:center;justify-content:center;background:var(--stk-acc);color:var(--stk-bg)!important}',
    '.stk-logo svg{width:20px;height:20px}',
    '#stk-scrim{position:fixed;inset:0;z-index:59;background:rgba(10,10,8,.45);opacity:0;visibility:hidden;transition:opacity .2s,visibility 0s .2s}',
    '#stk-drawer{position:fixed;top:0;left:0;bottom:0;z-index:60;width:min(300px,84vw);display:flex;flex-direction:column;overflow-y:auto;',
    '  background:var(--stk-surface);border-right:1px solid var(--stk-line);box-shadow:0 10px 30px rgba(0,0,0,.25);',
    '  transform:translateX(-102%);visibility:hidden;transition:transform .22s ease,visibility 0s .22s;font-size:15px}',
    'html.stk-open #stk-scrim{opacity:1;visibility:visible;transition:opacity .2s}',
    'html.stk-open #stk-drawer{transform:none;visibility:visible;transition:transform .22s ease}',
    'html.stk-open body{overflow:hidden}',
    '#stk-drawer .stk-dh{flex:none;display:flex;align-items:center;gap:10px;height:48px;padding:0 8px 0 14px;border-bottom:1px solid var(--stk-line)}',
    '#stk-drawer .stk-dh b{flex:1;color:var(--stk-ink);font-weight:700}',
    '#stk-drawer .stk-dh .stk-close{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:0;border-radius:10px;background:transparent;color:var(--stk-ink);cursor:pointer}',
    '#stk-drawer .stk-dh .stk-close:hover{background:var(--stk-surface2)}',
    '#stk-drawer .stk-grp{padding:10px 10px 4px}',
    '#stk-drawer .stk-cap{padding:10px 14px 4px;font-size:12px;color:var(--stk-muted)}',
    '#stk-drawer .stk-it{display:flex;align-items:center;gap:14px;min-height:46px;padding:0 14px;margin:2px 0;border-radius:12px;border:1px solid transparent;font-weight:500}',
    '#stk-drawer .stk-it:hover{background:var(--stk-surface2);color:var(--stk-ink)}',
    '#stk-drawer .stk-it .stk-lb{flex:1;min-width:0}',
    '#stk-drawer .stk-it .stk-tag{flex:none;font-size:11.5px;color:var(--stk-muted)}',
    '#stk-drawer .stk-it.stk-local{border:1px dashed var(--stk-line2);color:var(--stk-muted)}',
    '#stk-drawer .stk-it[aria-current="page"]{background:var(--stk-acc-bg);color:var(--stk-acc-ink);font-weight:600;border-color:transparent}',
    '#stk-drawer .stk-it[aria-current="page"] .stk-tag{color:inherit}',
    '#stk-drawer .stk-home{display:none}',
    // ---- เดสก์ท็อป >= 900px : แถบซ้ายติดขอบ ----
    '@media (min-width:900px){',
    '  :root{--stk-nav-h:0px}',
    '  html body{padding-left:var(--stk-side-w)}',
    '  #stk-top,#stk-drawer,#stk-scrim{display:none!important}',
    '  html.stk-open body{overflow:visible}',
    '  #stk-side{position:fixed;left:0;top:0;bottom:0;height:100vh;height:100dvh;width:var(--stk-side-w);z-index:40;display:flex;flex-direction:column;align-items:stretch;',
    '    overflow-y:auto;overflow-x:hidden;scrollbar-width:none;background:var(--stk-surface);border-right:1px solid var(--stk-line);padding:14px 0 12px;font-size:12.5px}',
    '  #stk-side::-webkit-scrollbar{display:none}',
    '  #stk-side .stk-logo{flex:none;align-self:center;width:40px;height:40px;border-radius:12px;margin-bottom:14px}',
    '  #stk-side .stk-logo svg{width:24px;height:24px}',
    '  #stk-side .stk-grp{display:flex;flex-direction:column;gap:2px;padding:0 8px}',
    '  #stk-side .stk-bot{margin-top:auto;padding-top:10px;border-top:1px solid var(--stk-line);margin-left:10px;margin-right:10px;padding-left:0;padding-right:0}',
    '  #stk-side .stk-it{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 2px 8px;border-radius:12px;border:1px solid transparent;',
    '    font-weight:500;text-align:center;white-space:nowrap}',
    '  #stk-side .stk-it:hover{background:var(--stk-surface2);color:var(--stk-ink)}',
    '  #stk-side .stk-it[aria-current="page"]{background:var(--stk-acc-bg);color:var(--stk-acc-ink);font-weight:600}',
    '  #stk-side .stk-it[aria-current="page"]::before{content:"";position:absolute;left:-8px;top:10px;bottom:10px;width:3px;border-radius:0 3px 3px 0;background:var(--stk-acc)}',
    '  #stk-side .stk-bot .stk-it{margin:0 -2px}',
    '  #stk-side .stk-it.stk-local{border:1px dashed var(--stk-line2);color:var(--stk-muted)}',
    '  #stk-side .stk-it.stk-local:hover{color:var(--stk-ink)}',
    '  #stk-side .stk-it.stk-local[aria-current="page"]{border-style:solid;border-color:transparent;color:var(--stk-acc-ink)}',
    '  #stk-side .stk-home{position:absolute;top:4px;right:5px;width:11px;height:11px;opacity:.75;display:block}',
    '  #stk-side .stk-tag{display:none}',
    '  #stk-side .stk-it .stk-dot{box-shadow:0 0 0 2px var(--stk-surface)}',
    '}',
    '#stk-side a:focus-visible,#stk-drawer a:focus-visible,#stk-top a:focus-visible,#stk-top button:focus-visible,#stk-drawer button:focus-visible{',
    '  outline:2px solid var(--stk-acc);outline-offset:2px}',
    '@media (prefers-reduced-motion:reduce){#stk-drawer,#stk-scrim{transition:none!important}}',
    '@media print{#stk-side,#stk-top,#stk-drawer,#stk-scrim{display:none!important}html body{padding-left:0!important}}',
    // ---- ปรับหน้าเจ้าบ้านให้ไม่ชนกับแถบนี้ ----
    // แถบเครื่องมือ sticky ของกระดาน US/SET เดิม top:0 -> เดสก์ท็อป (--stk-nav-h = 0) ยังคง top:0 ; มือถือ/แท็บเล็ตแคบดันลงต่อใต้แถบบน 48px
    // แผนภาพคู่มือ sticky top:64px -> บวกความสูงแถบบน (เดสก์ท็อปบวก 0)
    'body .toolbar{top:var(--stk-nav-h)}',
    'body .guide-fig{top:calc(64px + var(--stk-nav-h))}'
  ].join('\n');

  var st = document.createElement('style');
  st.id = 'stk-nav-css';
  st.textContent = css;
  document.head.appendChild(st);

  // ---- ตัวช่วยวันที่ (เวลาไทย = UTC+7) ; ตรรกะ "สด/ค้าง" ย้ายมาจาก hub.html ---------------------
  var MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  var DAY = 86400000, HOUR = 3600000;
  var now = Date.now();
  function ymdToMs(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function msToYmd(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function thDate(ymd) { var p = ymd.split('-'); return (+p[2]) + ' ' + MON[+p[1] - 1] + ' ' + (+p[0] + 543); }
  function isWeekday(ymd) { var w = new Date(ymdToMs(ymd)).getUTCDay(); return w >= 1 && w <= 5; }
  function prevWeekday(ymd) { var d = ymdToMs(ymd); do { d -= DAY; } while (!isWeekday(msToYmd(d))); return msToYmd(d); }
  function onOrPrevWeekday(ymd) { return isWeekday(ymd) ? ymd : prevWeekday(ymd); }
  function weekdaysBetween(a, b) { // จำนวนวันทำการที่ a ตามหลัง b (a <= b)
    var n = 0, d = ymdToMs(a), end = ymdToMs(b);
    while (d < end) { d += DAY; if (isWeekday(msToYmd(d))) n++; }
    return n;
  }
  // รอบตลาดล่าสุดที่ "ปิดแล้ว" (ประมาณ ไม่รู้วันหยุด) ; จุดตัดเลื่อนไปหลังเวลาที่กระดานสร้างเสร็จ จะได้ไม่ขึ้น "ค้าง" ทั้งที่รอบสร้างยังไม่ถึงเวลา
  // ตลาดสหรัฐ : กระดานสร้างเสร็จราว 08:41 น. ไทย -> นับว่าปิดแล้วหลัง 09:30 น.
  function expectedUS() { return prevWeekday(msToYmd(now + 7 * HOUR - 9.5 * HOUR)); }
  // SET : กระดานสร้างเสร็จราว 18:30 น. -> นับว่าปิดแล้วหลัง 19:00 น.
  function expectedSET() { return onOrPrevWeekday(msToYmd(now + 7 * HOUR - 19 * HOUR)); }
  var EXPECTED = { us: expectedUS, set: expectedSET };
  function status(through, expected) {
    var gap = through >= expected ? 0 : weekdaysBetween(through, expected);
    if (gap === 0) return { cls: '', txt: 'สด' };
    if (gap === 1) return { cls: 'warn', txt: 'ค้าง 1 วัน' };
    return { cls: 'bad', txt: 'ค้าง ' + gap + ' วัน' };
  }

  // ---- สร้างลิงก์ -------------------------------------------------------------------------
  var anchors = {}; // id -> [a, a] (แถบซ้าย + ลิ้นชักมือถือ) ไว้อัปเดตจุดสถานะ
  function hrefOf(l) { return l.site ? BASE + l.site : l.url; }
  function baseTitle(l) { return l.title + (l.local ? ' (ใช้ไม่ได้จากมือถือ)' : ''); }

  function makeItem(l, mode) {
    var a = document.createElement('a');
    a.className = 'stk-it' + (l.local ? ' stk-local' : '');
    a.href = hrefOf(l);
    a.title = baseTitle(l);
    var html = '<span class="stk-ic">' + ICONS[l.id] + '</span>';
    if (mode === 'rail') {
      html += '<span class="stk-lb">' + l.label + '</span>';
    } else {
      html += '<span class="stk-lb">' + l.full + '</span>';
      if (l.local) html += '<span class="stk-tag">เฉพาะเครื่องนี้</span>';
    }
    if (l.local) html += '<span class="stk-home" title="เปิดได้เฉพาะคอมเครื่องนี้">' + ICONS.home + '</span>';
    a.innerHTML = html;
    // เฉพาะของในเครื่อง (พอร์ต/DR) เปิดแท็บใหม่ ; งบ/วอลุ่มเปิดแท็บเดิม เพราะจะมีแถบซ้ายเหมือนกัน
    if (l.local) { a.target = '_blank'; a.rel = 'noopener'; }
    if (l.id === CUR) { a.setAttribute('aria-current', 'page'); a.removeAttribute('target'); }
    (anchors[l.id] = anchors[l.id] || []).push(a);
    return a;
  }
  function makeLogo() {
    var a = document.createElement('a');
    a.className = 'stk-logo';
    a.href = BASE + 'overview.html';
    a.title = LOGO_TITLE;
    a.setAttribute('aria-label', LOGO_TITLE);
    a.innerHTML = ICONS.logo;
    return a;
  }
  function group(cls, mode, items) {
    var g = document.createElement('div');
    g.className = 'stk-grp' + (cls ? ' ' + cls : '');
    items.forEach(function (l) { g.appendChild(makeItem(l, mode)); });
    return g;
  }
  var MAIN = LINKS.filter(function (l) { return l.group === 'main'; });
  var LOCAL = LINKS.filter(function (l) { return l.group === 'local'; });
  var curLink = null;
  LINKS.forEach(function (l) { if (l.id === CUR) curLink = l; });

  // แถบซ้าย (เดสก์ท็อป)
  var side = document.createElement('nav');
  side.id = 'stk-side';
  side.setAttribute('aria-label', 'เมนูหลักของเว็บหุ้น');
  side.appendChild(makeLogo());
  side.appendChild(group('', 'rail', MAIN));
  side.appendChild(group('stk-bot', 'rail', LOCAL));

  // แถบบน (มือถือ)
  var top = document.createElement('div');
  top.id = 'stk-top';
  var burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'stk-burger';
  burger.setAttribute('aria-label', 'เปิดเมนู');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'stk-drawer');
  burger.innerHTML = ICONS.menu;
  var ttl = document.createElement('span');
  ttl.className = 'stk-ttl';
  ttl.textContent = curLink ? curLink.full : 'เว็บหุ้น';
  top.appendChild(burger);
  top.appendChild(ttl);

  // ลิ้นชัก (มือถือ)
  var drawer = document.createElement('nav');
  drawer.id = 'stk-drawer';
  drawer.setAttribute('aria-label', 'เมนูหลักของเว็บหุ้น (มือถือ)');
  var dh = document.createElement('div');
  dh.className = 'stk-dh';
  var dlogo = makeLogo();
  dlogo.style.width = '30px'; dlogo.style.height = '30px'; dlogo.style.borderRadius = '9px';
  var dname = document.createElement('b');
  dname.textContent = 'เว็บหุ้น';
  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'stk-close';
  closeBtn.setAttribute('aria-label', 'ปิดเมนู');
  closeBtn.innerHTML = ICONS.close;
  dh.appendChild(dlogo); dh.appendChild(dname); dh.appendChild(closeBtn);
  drawer.appendChild(dh);
  drawer.appendChild(group('', 'drawer', MAIN));
  var cap = document.createElement('div');
  cap.className = 'stk-cap';
  cap.textContent = 'ในเครื่องนี้ (ใช้ไม่ได้จากมือถือ)';
  drawer.appendChild(cap);
  drawer.appendChild(group('', 'drawer', LOCAL));

  var scrim = document.createElement('div');
  scrim.id = 'stk-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  var frag = document.createDocumentFragment();
  frag.appendChild(top); frag.appendChild(side); frag.appendChild(drawer); frag.appendChild(scrim);
  document.body.insertBefore(frag, document.body.firstChild);

  // ---- ลิ้นชักมือถือ : เปิด/ปิด, Esc, กดฉากหลัง, วนโฟกัสในลิ้นชัก ------------------------------
  var root = document.documentElement;
  var isOpen = false;
  function setOpen(v) {
    if (v === isOpen) return;
    isOpen = v;
    root.classList.toggle('stk-open', v);
    burger.setAttribute('aria-expanded', v ? 'true' : 'false');
    burger.setAttribute('aria-label', v ? 'ปิดเมนู' : 'เปิดเมนู');
    if (v) {
      var first = drawer.querySelector('a[aria-current]') || drawer.querySelector('a');
      setTimeout(function () { if (isOpen && first) first.focus(); }, 30);
    } else {
      burger.focus();
    }
  }
  burger.addEventListener('click', function () { setOpen(!isOpen); });
  closeBtn.addEventListener('click', function () { setOpen(false); });
  scrim.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if (e.key === 'Tab') {
      var f = drawer.querySelectorAll('a[href],button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(min-width:900px)');
    var onMq = function () { if (mq.matches && isOpen) { isOpen = false; root.classList.remove('stk-open'); burger.setAttribute('aria-expanded', 'false'); } };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  // ---- จุดสถานะข้อมูล : ดึง meta*.json ; ไม่สำเร็จ/ช้าเกิน 8 วินาที = ไม่แสดงจุด -----------------
  function paint(l, through) {
    var s = status(through, EXPECTED[l.exp]());
    var tip = baseTitle(l) + ' - ข้อมูลถึง ' + thDate(through) + ' (' + s.txt + ')';
    (anchors[l.id] || []).forEach(function (a) {
      var ic = a.querySelector('.stk-ic');
      var old = a.querySelectorAll('.stk-dot,.stk-sr');
      for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
      var dot = document.createElement('span');
      dot.className = 'stk-dot' + (s.cls ? ' ' + s.cls : '');
      dot.setAttribute('aria-hidden', 'true');
      ic.appendChild(dot);
      var sr = document.createElement('span');
      sr.className = 'stk-sr';
      sr.textContent = 'ข้อมูลถึง ' + thDate(through) + ' ' + s.txt;
      a.appendChild(sr);
      a.title = tip;
    });
  }
  function loadMeta(l) {
    var done = false;
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { done = true; if (ctl) ctl.abort(); }, META_TIMEOUT_MS);
    fetch(META_BASE + l.meta + '?t=' + Math.floor(now / 600000), { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (m) {
        var built = m && Date.parse(m.built_at_utc);
        if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(m.data_through || '') || isNaN(built)) throw new Error('shape');
        clearTimeout(timer);
        if (done) return;
        done = true;
        paint(l, m.data_through);
      })
      .catch(function () { clearTimeout(timer); done = true; /* ดึงไม่ได้ = ไม่แสดงจุด */ });
  }
  LINKS.forEach(function (l) { if (l.meta) loadMeta(l); });
})();
