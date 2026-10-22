(function(){
  var KEY = 'igakubu-roadmap-v1';
  var st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e) { st = {}; }
  st.checks = st.checks || {};
  if (st.type && !st.goal) st.goal = 'med'; // 医学部のタイプだけを選んでいた人
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} }

  var now = new Date();
  var M = now.getMonth() + 1;
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  var TODAY = now.getFullYear() + '-' + pad(M) + '-' + pad(now.getDate());
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  var GRADES = [['g1','高1'],['g2','高2'],['g3','高3'],['r','既卒']];
  var GRADE_NAME = {g1:'高1', g2:'高2', g3:'高3', r:'既卒'};
  var TYPE_NAME = {}; TYPES.forEach(function(t){ TYPE_NAME[t[0]] = t[1]; });
  var AREA_NAME = {}; AREAS.forEach(function(a){ AREA_NAME[a[0]] = a[1]; });

  function blockNow(g){
    var list = PLAN[g]; if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].months.indexOf(M) >= 0) return list[i];
    return null;
  }
  // 全体の地図（7つの時期）の列
  function colFor(g){
    if (g === 'g1') return 'c1';
    if (g === 'g2') return (M >= 4 && M <= 8) ? 'c2' : 'c3';
    if (g === 'g3' || g === 'r') {
      if (M >= 4 && M <= 6) return 'c4';
      if (M >= 7 && M <= 8) return 'c5';
      if (M >= 9 && M <= 11) return 'c6';
      return 'c7';
    }
    return null;
  }

  // 志望による出し分け。目指す先を選んでいないときは全部出す
  function showTag(tag){
    if (!st.goal) return true;
    var med = st.goal === 'med';
    if (tag === 'med') return med;
    if (tag === 'nk') return !med;
    if (tag === 'todai' || tag === 'kyodai' || tag === 'teidai') return st.goal === tag;
    if (tag === 'ri') return med || st.bunri !== 'bun';
    if (tag === 'bun') return !med && st.bunri !== 'ri';
    return true;
  }
  function showNote(k){
    if (!st.goal) return true;
    if (TYPE_NAME[k]) return st.goal === 'med' && (!st.type || st.type === k);
    if (st.goal === 'med') return false;
    if (k === 'tk') return st.goal === 'todai' || st.goal === 'kyodai';
    if (k === 'todai' || k === 'kyodai' || k === 'teidai') return st.goal === k;
    if (k === 'bun' || k === 'ri') return showTag(k);
    return true;
  }
  function applyOnly(){
    var els = document.querySelectorAll('[data-only]');
    for (var i = 0; i < els.length; i++) els[i].hidden = !showTag(els[i].getAttribute('data-only'));
  }

  // 学年と志望の選択ボタン。目指す先と文理の行は、医学部のタイプの行の前に足す
  var PICK_LABEL = {goal:'目指す先', bunri:'文理', type:'医学部のタイプ'};
  function renderPickers(){
    var trows = document.querySelectorAll('.pick-row[data-pick=type]');
    for (var t = 0; t < trows.length; t++) {
      if (trows[t].previousElementSibling && trows[t].previousElementSibling.getAttribute('data-pick') === 'bunri') continue;
      ['goal', 'bunri'].forEach(function(kind){
        var d = document.createElement('div');
        d.className = 'pick-row'; d.setAttribute('data-pick', kind);
        d.innerHTML = '<span>' + PICK_LABEL[kind] + '</span>';
        trows[t].parentNode.insertBefore(d, trows[t]);
      });
      trows[t].querySelector('span').textContent = PICK_LABEL.type;
    }
    var rows = document.querySelectorAll('.pick-row');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i], kind = row.getAttribute('data-pick');
      var opts = kind === 'grade' ? GRADES : kind === 'goal' ? GOALS.concat([['', 'まだ決めていない']])
        : kind === 'bunri' ? BUNRI.concat([['', 'まだ決めていない']]) : TYPES.concat([['', 'まだ決めていない']]);
      var cur = st[kind] || '';
      row.hidden = (kind === 'type' && st.goal !== 'med') || (kind === 'bunri' && (!st.goal || st.goal === 'med'));
      var old = row.querySelectorAll('button'); for (var k = 0; k < old.length; k++) old[k].remove();
      opts.forEach(function(o){
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = o[1].replace(/（.*）/, '');
        if (b.textContent !== o[1]) b.title = o[1];
        b.setAttribute('data-' + kind, o[0]);
        b.setAttribute('aria-pressed', cur === o[0] && (o[0] !== '' || kind !== 'grade') ? 'true' : 'false');
        row.appendChild(b);
      });
    }
  }

  // 条件を選び終えたら「高3・旧帝大・理系　変える」の1行にたたむ
  var editing = false;
  function pickLabel(kind){
    var v = st[kind]; if (!v) return '';
    var list = kind === 'grade' ? GRADES : kind === 'goal' ? GOALS : kind === 'bunri' ? BUNRI : TYPES;
    var o = list.filter(function(x){ return x[0] === v; })[0];
    return o ? o[1].replace(/（.*）/, '') : '';
  }
  function renderSummary(){
    var boxes = [];
    var rows = document.querySelectorAll('.pick-row');
    for (var i = 0; i < rows.length; i++) if (boxes.indexOf(rows[i].parentNode) < 0) boxes.push(rows[i].parentNode);
    boxes.forEach(function(box){
      var hasGrade = !!box.querySelector('.pick-row[data-pick=grade]');
      var parts = [];
      if (hasGrade) parts.push(pickLabel('grade'));
      parts.push(pickLabel('goal'));
      if (st.goal && st.goal !== 'med') parts.push(pickLabel('bunri'));
      if (st.goal === 'med') parts.push(pickLabel('type'));
      parts = parts.filter(Boolean);
      var done = hasGrade ? !!st.grade : !!st.goal;
      var sum = box.querySelector('.pick-sum');
      if (!sum) {
        sum = document.createElement('div'); sum.className = 'pick-sum';
        box.insertBefore(sum, box.firstChild);
        var ok = document.createElement('p'); ok.className = 'pick-done';
        ok.innerHTML = '<button type="button" data-pickdone>これで決める</button>';
        var last = box.querySelectorAll('.pick-row'); last = last[last.length - 1];
        last.parentNode.insertBefore(ok, last.nextSibling);
      }
      sum.innerHTML = '<span class="pick-sum-label">表示の条件</span><b>' + esc(parts.join('・') || '未選択') + '</b><button type="button" data-pickedit>変える</button>';
      box.classList.toggle('picked', done && !editing);
      box.querySelector('.pick-done').hidden = !done || !editing;
    });
  }

  function taskList(block){
    var h = '';
    AREAS.forEach(function(a){
      var li = '';
      // 行の頭の @印 は志望で出し分ける。チェックのIDは元の並び順のまま
      (block[a[0]] || []).forEach(function(t, i){
        var m = /^@(\w+) /.exec(t);
        if (m) { if (!showTag(m[1])) return; t = t.slice(m[0].length); }
        li += '<li><label><input type="checkbox" data-id="' + block.id + '-' + a[0] + '-' + i + '"><span>' + esc(t) + '</span></label></li>';
      });
      if (li) h += '<div class="area"><b>' + esc(a[1]) + '</b><ul class="checks">' + li + '</ul></div>';
    });
    return h;
  }
  function typeNotes(t){
    if (!t) return '';
    var h = '';
    Object.keys(NOTE_NAME).forEach(function(k){
      if (!t[k] || !showNote(k)) return;
      h += '<p class="tnote"><b>' + esc(NOTE_NAME[k]) + '</b>' + esc(t[k]) + '</p>';
    });
    return h;
  }

  function fmt(iso){ var p = iso.split('-'); return (+p[1]) + '月' + (+p[2]) + '日'; }
  function daysUntil(iso){ return Math.round((new Date(iso + 'T00:00:00') - new Date(TODAY + 'T00:00:00')) / 86400000); }

  // トップページ：いまの場所
  // 7つの時期それぞれの区切りの日。本番は共通テストの初日
  function colEnd(col){
    if (col === 'c7') { var k = DEADLINES.filter(function(d){ return d.t === '共通テスト' && d.e >= TODAY; })[0]; return k && k.s; }
    var m = {c1:3, c2:8, c3:3, c4:6, c5:8, c6:11}[col]; if (!m) return null;
    var y = now.getFullYear(); if (m < M) y++;
    return y + '-' + pad(m) + '-' + pad(new Date(y, m, 0).getDate());
  }

  // トップページは「いつまでに何を」以外の節を見出しだけにして、押すと開く
  function foldSections(){
    var main = document.querySelector('main[data-fold]'); if (!main) return;
    var hs = main.querySelectorAll('h2[id]:not([data-open])');
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i], body = document.createElement('div'), n = h.nextElementSibling;
      body.className = 'fold-body'; body.hidden = true;
      while (n && n.tagName !== 'H2' && !n.querySelector('h2')) { var nx = n.nextElementSibling; body.appendChild(n); n = nx; }
      h.parentNode.insertBefore(body, h.nextSibling);
      var ds = h.getAttribute('data-desc');
      if (ds) { var t = document.createElement('span'), dsc = document.createElement('span'); dsc.className = 'fold-desc'; dsc.textContent = ds;
        while (h.firstChild) t.appendChild(h.firstChild); t.appendChild(dsc); h.appendChild(t); }
      h.className += ' fold'; h.tabIndex = 0; h.setAttribute('role', 'button'); h.setAttribute('aria-expanded', 'false');
    }
  }
  function setFold(h, open){ h.nextElementSibling.hidden = !open; h.setAttribute('aria-expanded', String(open)); }
  function openTarget(){
    var el = location.hash && document.getElementById(location.hash.slice(1)); if (!el) return;
    var b = el.classList.contains('fold') ? el.nextElementSibling : el.closest('.fold-body');
    if (b) setFold(b.previousElementSibling, true);
    if (el.tagName === 'DETAILS') el.open = true;
    el.scrollIntoView({block:'start'});
  }

  // 同じ時期に大手塾の塾生がやっていること。既卒は高3と同じものを出す
  function jukuNow(g){
    var list = JUKU[g], e = null;
    for (var i = 0; list && i < list.length; i++) if (list[i].m.indexOf(M) >= 0) e = list[i];
    if (!e) return '';
    var li = '';
    e.items.forEach(function(t){
      var m = /^@(\w+) /.exec(t);
      if (m) { if (!showTag(m[1])) return; t = t.slice(m[0].length); }
      li += '<li>' + esc(t) + '</li>';
    });
    return '<div class="juku"><p class="juku-title">同じころ、大手塾の塾生は</p><ul>' + li + '</ul>'
      + '<p class="note">' + esc(g === 'r' ? JUKU_SRC.r : JUKU_SRC.def) + '。追いつけなくても焦らず、上の順番を崩さずに進めてください。</p></div>';
  }

  var openGoals = {};
  function renderNow(){
    var box = document.getElementById('now-body');
    var g = st.grade;
    var col = colFor(g);
    var marks = document.querySelectorAll('.roadmap [data-col], .goal[data-col]');
    for (var j = 0; j < marks.length; j++) marks[j].classList.toggle('now', !!col && marks[j].getAttribute('data-col') === col);
    var goals = document.querySelectorAll('.goal[data-col]'), past = !!col;
    for (var q = 0; q < goals.length; q++) {
      var c = goals[q].getAttribute('data-col');
      if (c === col) past = false;
      goals[q].classList.toggle('past', past);
      goals[q].classList.toggle('shut', c !== col && !openGoals[c]);
    }
    if (!box || !g) return;

    var b = blockNow(g);
    var h = '';
    var goal = document.getElementById('goal-' + col), end = colEnd(col);
    if (goal && end) {
      h += '<p class="countdown"><a href="#goal-' + col + '">「' + esc(goal.querySelector('h3').firstChild.textContent.trim()) + '」</a>まで、あと<b>' + daysUntil(end) + '</b>日</p>';
    }
    if (b) {
      h += '<p class="now-title">いまは「' + esc(b.label) + '」です</p>';
      h += (b.w ? '<p class="lead">' + esc(b.w) + '</p>' : '') + taskList(b) + typeNotes(b.t);
      h += jukuNow(g);
      h += '<p class="note"><a href="plan.html#' + b.id + '">月ごとの計画で前後の月を見る</a>　<a href="units.html">科目の単元ごとの目安を見る</a></p>';
    }
    if (g === 'g3' || g === 'r') {
      var up = DEADLINES.filter(function(d){ return d.e >= TODAY && (!d.o || showTag(d.o)); })
        .sort(function(a, c){ return a.e < c.e ? -1 : a.e > c.e ? 1 : 0; }).slice(0, 8);
      h += '<h4>次の締切と試験</h4>';
      if (up.length) {
        h += '<ul class="deadlines">';
        up.forEach(function(d, i){
          if (i === 3) h += '</ul><details class="more-dl"><summary>その先の日程</summary><ul class="deadlines">';
          var when = d.s === d.e ? fmt(d.e) : (d.s <= TODAY ? fmt(d.e) + 'まで' : fmt(d.s) + '〜' + fmt(d.e));
          h += '<li class="' + (daysUntil(d.e) <= 7 ? 'soon' : '') + '"><span class="d">' + when + '</span><span>' + esc(d.t) + (d.n ? '<br><span class="note">' + esc(d.n) + '</span>' : '') + '</span></li>';
        });
        h += '</ul>' + (up.length > 3 ? '</details>' : '') + '<p class="note">2027年度入試の日程です。必ず公式の要項で確認してください。</p>';
      } else {
        h += '<p class="note">このページに載せている2027年度入試の日程は終わりました。新しい年度の日程は各大学の要項で確認してください。</p>';
      }
    }
    box.innerHTML = h;
  }

  // 月ごとの計画ページ
  function renderPlan(){
    var box = document.getElementById('plan');
    if (!box) return;
    var g = st.grade || 'g3';
    var cur = blockNow(g);
    var h = '';
    if (!st.grade) h += '<p class="note">学年が選ばれていないので、高3の計画を表示しています。</p>';
    if (cur) h += '<p><a href="#' + cur.id + '">いまの時期「' + esc(cur.label) + '」へ移動</a></p>';
    PLAN[g].forEach(function(b){
      h += '<section class="block' + (cur && cur.id === b.id ? ' now' : '') + '" id="' + b.id + '"><h3>' + esc(b.label) +
        (cur && cur.id === b.id ? '<span class="badge">いま</span>' : '') + '<span class="prog" data-prog="' + b.id + '"></span></h3>' +
        (b.w ? '<p class="lead">' + esc(b.w) + '</p>' : '') + taskList(b) + typeNotes(b.t) + '</section>';
    });
    box.innerHTML = h;
    var title = document.getElementById('plan-title');
    if (title) title.textContent = GRADE_NAME[g] + 'の月ごとの計画';
  }

  // 単元ページから受験数学マップ・受験英語 完全攻略ノートの該当箇所へ
  var MATH_MAP = 'https://kaitoinoue0921.github.io/todai-math-map/app.html#unit=';
  var EIGO = 'https://kaitoinoue0921.github.io/eigo-kouryaku/';
  function unitLinks(it){
    var a = [];
    (it.mm || []).forEach(function(u){ a.push('<a href="' + MATH_MAP + encodeURIComponent(u) + '" target="_blank" rel="noopener">数学マップ「' + esc(u) + '」</a>'); });
    (it.ln || []).forEach(function(l){ a.push('<a href="' + EIGO + l[0] + '.html" target="_blank" rel="noopener">' + esc(l[1]) + '</a>'); });
    return a.length ? '<p class="unit-links"><span class="lbl">関連</span>' + a.join('　') + '</p>' : '';
  }

  // 単元ページ
  function renderUnits(){
    var box = document.getElementById('units');
    if (!box) return;
    var key = (location.hash || '').slice(1);
    var list = UNITS.filter(function(u){ return !u.only || showTag(u.only); });
    if (!list.some(function(u){ return u.key === key; })) key = st.subj || 'math';
    if (!list.some(function(u){ return u.key === key; })) key = 'math';
    st.subj = key;
    var tabs = '<div class="tabs" role="tablist">';
    list.forEach(function(u){
      tabs += '<button type="button" role="tab" data-subj="' + u.key + '" aria-selected="' + (u.key === key) + '">' + esc(u.name) + '</button>';
    });
    tabs += '</div>';
    var u = UNITS.filter(function(x){ return x.key === key; })[0];
    var h = tabs + '<p>' + esc(u.intro) + '</p>' + typeNotes(u.notes);
    if (u.links) h += '<p class="note">' + u.links.map(function(l){ return '<a href="' + l.href + '" target="_blank" rel="noopener">' + esc(l.text) + '</a>'; }).join('　') + '</p>';
    var no = 0;
    u.groups.forEach(function(gr, gi){
      if (gr.only && !showTag(gr.only)) return;
      h += '<p class="group-title">' + esc(gr.name) + '</p>';
      gr.items.forEach(function(it, ii){
        if (it.only && !showTag(it.only)) return;
        no++;
        var id = 'u-' + key + '-' + gi + '-' + ii;
        h += '<div class="unit"><div class="unit-head"><span class="no">' + no + '</span><label><input type="checkbox" data-id="' + id + '"><span>' + esc(it.n) + '</span></label><span class="when" style="font-size:.82rem;color:var(--now);font-weight:700">' + esc(it.when) + '</span></div>';
        h += '<p><span class="lbl">終えた基準</span>' + esc(it.goal) + '</p>';
        if (it.tip) h += '<p><span class="lbl">つまずき</span>' + esc(it.tip) + '</p>';
        if (it.med && (!st.goal || st.goal === 'med')) h += '<p class="why"><span class="lbl">医学部では</span>' + esc(it.med) + '</p>';
        h += typeNotes(it.t);
        h += unitLinks(it);
        h += '</div>';
      });
    });
    box.innerHTML = h;
  }

  // 自分のペースのページ。単元ごとの状態と終えた月、科目ごとのメモ、日々の記録を st に持つ
  st.pace = st.pace || {}; st.paceMemo = st.paceMemo || {}; st.log = st.log || [];
  function acad(m){ return m >= 4 ? m - 4 : m + 8; } // 4月を0とした学年内の月
  function curIdx(){
    var g = st.grade; if (!g) return null;
    return (g === 'r' ? 3 : +g.slice(1) - 1) * 12 + acad(M);
  }
  // 単元の目安（when）から、終えるべき月を学年通しの番号で出す。続けて取り組む単元は null
  function dueIdx(w){
    var gs = w.match(/高(\d)/g); if (!gs) return null;
    var last = w.lastIndexOf(gs[gs.length - 1]), g = +gs[gs.length - 1].slice(1), rest = w.slice(last + 2);
    if (/〜\s*$|〜（|毎日/.test(w)) return null;
    if (/秋/.test(rest)) return (g - 1) * 12 + acad(11);
    var ms = rest.match(/(\d+)月/g);
    if (!ms) { var nums = rest.match(/\d+/g); if (!nums) return (g - 1) * 12 + 11; ms = [nums[nums.length - 1] + '月']; }
    return (g - 1) * 12 + acad(parseInt(ms[ms.length - 1], 10));
  }
  function monthsAgo(ym){
    var p = ym.split('-'); return (now.getFullYear() - p[0]) * 12 + (M - p[1]);
  }
  function paceOf(id){
    var r = st.pace[id];
    if (r) return r;
    return st.checks[id] ? {s:'done'} : {s:'todo'};
  }
  function verdict(rec, due, cur){
    if (due === null) return ['', '続けて取り組む単元'];
    if (cur === null) return ['', ''];
    if (rec.s === 'done') {
      if (!rec.d) return ['ok', '終えた月を入れると、目安との差を出します'];
      var diff = due - (cur - monthsAgo(rec.d));
      return diff > 0 ? ['ok', '目安より' + diff + 'か月早く終えた'] : diff === 0 ? ['ok', '目安どおりに終えた'] : ['late', '目安より' + (-diff) + 'か月遅れて終えた'];
    }
    if (cur > due) return ['late', '目安を' + (cur - due) + 'か月過ぎている'];
    if (cur === due) return ['soon', '今月が目安'];
    return ['', '目安まであと' + (due - cur) + 'か月'];
  }
  function paceUnits(u){
    var out = [];
    u.groups.forEach(function(gr, gi){
      if (gr.only && !showTag(gr.only)) return;
      gr.items.forEach(function(it, ii){
        if (it.only && !showTag(it.only)) return;
        out.push({id:'u-' + u.key + '-' + gi + '-' + ii, it:it, group:gr.name});
      });
    });
    return out;
  }
  function renderPace(){
    var box = document.getElementById('pace');
    if (!box) return;
    var cur = curIdx(), g = st.grade;
    var list = UNITS.filter(function(u){ return !u.only || showTag(u.only); });
    var key = st.psubj && list.some(function(u){ return u.key === st.psubj; }) ? st.psubj : list[0].key;
    var h = '';
    if (!g) h += '<p class="note">学年を選ぶと、単元ごとに目安より早いか遅いかを出します。</p>';
    // 科目ごとのまとめ
    h += '<table class="pace-sum"><thead><tr><th>科目</th><th>終えた</th><th>やっている</th><th>目安を過ぎた</th></tr></thead><tbody>';
    list.forEach(function(u){
      var us = paceUnits(u), done = 0, doing = 0, late = 0;
      us.forEach(function(x){
        var r = paceOf(x.id), d = dueIdx(x.it.when);
        if (r.s === 'done') done++; else { if (r.s === 'doing') doing++; if (cur !== null && d !== null && cur > d) late++; }
      });
      h += '<tr><th><button type="button" class="linkish" data-psubj="' + u.key + '">' + esc(u.name.replace(/（.*）/, '')) + '</button></th><td>' + done + ' / ' + us.length + '</td><td>' + doing + '</td><td' + (late ? ' class="late"' : '') + '>' + late + '</td></tr>';
    });
    h += '</tbody></table>';
    if (g) h += jukuNow(g);
    // 科目のタブと単元
    h += '<div class="tabs" role="tablist">';
    list.forEach(function(u){ h += '<button type="button" role="tab" data-psubj="' + u.key + '" aria-selected="' + (u.key === key) + '">' + esc(u.name) + '</button>'; });
    h += '</div>';
    var u = list.filter(function(x){ return x.key === key; })[0];
    h += '<label class="memo"><span>' + esc(u.name) + 'のいまのペース（自由メモ）</span><textarea data-pmemo="' + u.key + '" rows="3" placeholder="例：青チャートの数列を1日3題。学校は数IIの微分まで。">' + esc(st.paceMemo[u.key] || '') + '</textarea></label>';
    var lastGroup = '';
    paceUnits(u).forEach(function(x){
      if (x.group !== lastGroup) { h += '<p class="group-title">' + esc(x.group) + '</p>'; lastGroup = x.group; }
      var r = paceOf(x.id), v = verdict(r, dueIdx(x.it.when), cur);
      h += '<div class="prow' + (r.s === 'done' ? ' is-done' : '') + '"><div class="pname"><span>' + esc(x.it.n) + '</span><span class="when">目安 ' + esc(x.it.when) + '</span></div>'
        + '<div class="pctl"><select data-pace="' + x.id + '" aria-label="' + esc(x.it.n) + 'の状態">'
        + [['todo','まだ'],['doing','やっている'],['done','終えた']].map(function(o){ return '<option value="' + o[0] + '"' + (r.s === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('')
        + '</select>'
        + (r.s === 'done' ? '<input type="month" data-pacem="' + x.id + '" value="' + esc(r.d || '') + '" aria-label="終えた月">' : '')
        + '<span class="verdict ' + v[0] + '">' + esc(v[1]) + '</span></div></div>';
    });
    // 日々の記録
    h += '<h2>勉強の記録</h2><p class="note">その日にやったこと、進んだ量、気づいたことを書いておくと、ペースが落ちた時期と理由が後から見えます。</p>'
      + '<div class="log-form"><input type="date" id="log-date" value="' + TODAY + '"><textarea id="log-text" rows="2" placeholder="例：数III 積分の置換 12題。部分積分の符号でミス2回"></textarea><button type="button" data-logadd>記録する</button></div>';
    if (st.log.length) {
      h += '<ul class="log">';
      st.log.slice().sort(function(a, b){ return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; }).forEach(function(e){
        h += '<li><span class="d">' + esc(e.d) + '</span><span class="t">' + esc(e.t) + '</span><button type="button" class="linkish" data-logdel="' + e.k + '">消す</button></li>';
      });
      h += '</ul>';
    }
    box.innerHTML = h;
  }

  function syncChecks(){
    var boxes = document.querySelectorAll('input[type=checkbox][data-id]');
    for (var i = 0; i < boxes.length; i++) boxes[i].checked = !!st.checks[boxes[i].getAttribute('data-id')];
    var groups = document.querySelectorAll('.goal, .block');
    for (var j = 0; j < groups.length; j++) {
      var all = groups[j].querySelectorAll('input[data-id]'), done = 0;
      for (var k = 0; k < all.length; k++) if (all[k].checked) done++;
      var p = groups[j].querySelector('.prog');
      if (p) p.textContent = all.length ? done + ' / ' + all.length : '';
    }
  }

  function renderAll(){
    renderPickers(); renderSummary(); applyOnly(); renderNow(); renderPlan(); renderUnits(); renderPace(); syncChecks();
  }

  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('button');
    if (!b) return;
    if (b.closest('.pick-row')) editing = true;
    if (b.hasAttribute('data-grade')) { st.grade = b.getAttribute('data-grade'); save(); renderAll(); }
    else if (b.hasAttribute('data-goal')) { st.goal = b.getAttribute('data-goal'); save(); renderAll(); }
    else if (b.hasAttribute('data-bunri')) { st.bunri = b.getAttribute('data-bunri'); save(); renderAll(); }
    else if (b.hasAttribute('data-type')) { st.type = b.getAttribute('data-type'); save(); renderAll(); }
    else if (b.hasAttribute('data-pickedit')) { editing = true; renderSummary(); }
    else if (b.hasAttribute('data-pickdone')) { editing = false; renderSummary(); }
    else if (b.hasAttribute('data-psubj')) { st.psubj = b.getAttribute('data-psubj'); save(); renderPace(); }
    else if (b.hasAttribute('data-logadd')) {
      var tx = document.getElementById('log-text'), dt = document.getElementById('log-date');
      if (tx && tx.value.trim()) { st.log.push({k: String(Date.now()), d: dt.value || TODAY, t: tx.value.trim()}); save(); renderPace(); }
    }
    else if (b.hasAttribute('data-logdel')) {
      if (confirm('この記録を消しますか')) { var k = b.getAttribute('data-logdel'); st.log = st.log.filter(function(e){ return e.k !== k; }); save(); renderPace(); }
    }
    else if (b.hasAttribute('data-subj')) { st.subj = b.getAttribute('data-subj'); history.replaceState(null, '', '#' + st.subj); save(); renderUnits(); syncChecks(); }
  });
  document.addEventListener('change', function(e){
    var t = e.target;
    if (t.matches && t.matches('select[data-pace]')) {
      var id = t.getAttribute('data-pace'), r = st.pace[id] || {};
      r.s = t.value;
      if (r.s !== 'done') delete r.d;
      st.pace[id] = r; st.checks[id] = r.s === 'done'; save(); renderPace(); return;
    }
    if (t.matches && t.matches('input[data-pacem]')) {
      var pid = t.getAttribute('data-pacem'); st.pace[pid] = st.pace[pid] || {s:'done'}; st.pace[pid].d = t.value; save(); renderPace(); return;
    }
    if (t.matches && t.matches('textarea[data-pmemo]')) { st.paceMemo[t.getAttribute('data-pmemo')] = t.value; save(); return; }
    if (!t.matches || !t.matches('input[type=checkbox][data-id]')) return;
    var cid = t.getAttribute('data-id');
    st.checks[cid] = t.checked;
    if (/^u-/.test(cid)) st.pace[cid] = t.checked ? {s:'done', d:(st.pace[cid] || {}).d} : {s:'todo'};
    save(); syncChecks();
  });
  document.addEventListener('click', function(e){
    var h = e.target.closest && e.target.closest('h2.fold');
    if (h) setFold(h, h.getAttribute('aria-expanded') !== 'true');
    var g = e.target.closest && e.target.closest('.goal > h3');
    if (g) {
      var sec = g.parentNode, c = sec.getAttribute('data-col');
      var open = sec.classList.contains('shut');
      openGoals[c] = open; sec.classList.toggle('shut', !open);
    }
  });
  document.addEventListener('keydown', function(e){
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('h2.fold')) { e.preventDefault(); e.target.click(); }
  });
  var here = location.pathname.split('/').pop() || 'index.html';
  var navs = document.querySelectorAll('.nav a');
  for (var n = 0; n < navs.length; n++) if (navs[n].getAttribute('href') === here) navs[n].setAttribute('aria-current', 'page');
  foldSections();
  renderAll();
  openTarget();
  window.addEventListener('hashchange', openTarget);
  // 計画ページでは、いまの時期（またはURLの#で指定した月）へ移動する
  if (document.getElementById('plan')) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('load', function(){
      var id = location.hash ? location.hash.slice(1) : ((blockNow(st.grade || 'g3') || {}).id);
      var el = id && document.getElementById(id);
      if (el) setTimeout(function(){ el.scrollIntoView({block:'start'}); }, 0);
    });
  }
})();
