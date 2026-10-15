#!/usr/bin/env python3
"""地域枠・修学資金くらべの静的ビルド。 python3 chiikiwaku/build.py

入力: chiikiwaku/prefectures.json
出力: chiikiwaku/site/ (index.html, pref/<id>.html, sitemap.xml, robots.txt, assets/style.css)
公開先とブランド名は未定。環境変数 BASE_URL と SITE で切り替える。
"""
import os, json, html, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "site")
BASE_URL = os.environ.get("BASE_URL", "https://kaitoinoue0921.github.io/chiikiwaku").rstrip("/")
SITE = os.environ.get("SITE", "地域枠・修学資金くらべ")
PARENT = ("医学部受験ロードマップ", "https://kaitoinoue0921.github.io/igakubu-roadmap/")
esc = html.escape

DATA = json.load(open(os.path.join(HERE, "prefectures.json"), encoding="utf-8"))
CHECKED = max(p["checked"] for p in DATA)

def badge(p):
    cls = "ok" if p["status"].startswith("確認済み") and not p["unconfirmed"] else "warn"
    return f'<span class="st {cls}">{esc(p["status"])}</span>'

def page(path, title, desc, body, depth):
    up = "../" * depth
    url = f"{BASE_URL}/{path}"
    ld = json.dumps({"@context": "https://schema.org", "@type": "WebPage", "name": title, "url": url,
                     "inLanguage": "ja", "isPartOf": {"@type": "WebSite", "name": SITE, "url": BASE_URL + "/"}},
                    ensure_ascii=False)
    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
<link rel="stylesheet" href="{up}assets/style.css">
<style>.st{{display:inline-block;font-size:.78rem;padding:1px 8px;border-radius:999px}}.st.ok{{background:var(--ok-soft);color:var(--ok)}}.st.warn{{background:var(--gold-soft);color:var(--gold)}}.pl{{display:grid;grid-template-columns:8em 1fr;gap:4px 14px;margin:12px 0}}.pl dt{{font-weight:700;color:var(--ink-soft)}}.pl dd{{margin:0}}.q{{border:1px solid var(--rule);border-radius:10px;padding:12px 16px;margin:14px 0;background:var(--surface)}}.q h3{{margin:0 0 6px;font-size:1.02rem}}.q .todo{{color:var(--ink-soft);font-size:.9rem}}.q .s{{font-size:.76rem;margin-left:6px}}.alert{{border-left:4px solid var(--gold);background:var(--gold-soft);padding:8px 14px;margin:14px 0}}.alert p{{margin:6px 0}}.card span{{display:block;margin-top:3px}}.card span.st{{display:inline-block;margin-top:6px}}@media(max-width:520px){{.pl{{grid-template-columns:1fr}}}}</style>
<script type="application/ld+json">{ld}</script>
</head>
<body>
<header class="site-head"><div class="wrap">
  <a class="brand" href="{up}index.html">{esc(SITE)}</a>
  <nav class="nav"><a href="{up}index.html#pref">県を選ぶ</a><a href="{up}index.html#ten">10問とは</a><a href="{up}choose.html">地域枠か一般か</a><a href="{PARENT[1]}">{esc(PARENT[0])}</a></nav>
</div></header>
<main class="wrap">
{body}
</main>
<footer class="wrap note">
<p>数字は各県・大学の公開資料から拾ったもので、最終確認日は{CHECKED}です。出願の前に、必ず県と大学の最新の要項で確かめてください。</p>
<p><a href="{PARENT[1]}">{esc(PARENT[0])}</a>もあわせてどうぞ。</p>
</footer>
</body>
</html>
"""

def ten_block(p):
    docs = p["source_docs"]
    out = '<div class="alert"><p><strong>いま先に知っておくこと</strong></p>' + "".join(f"<p>{esc(a)}</p>" for a in p["alerts"]) + "</div>"
    out += "<h2>出願前に確かめる10問</h2>"
    for q in p["ten"]:
        cls = "ok" if q["status"] == "確認済み" else "warn"
        src = "、".join(f'<a href="{esc(docs[k]["url"])}" rel="noopener" target="_blank">{esc(docs[k]["title"])}</a>' for k in q["src"])
        todo = f'<p class="todo">確かめること：{esc(q["todo"])}</p>' if q["todo"] else ""
        out += (f'<section class="q"><h3>{q["n"]}. {esc(q["q"])}<span class="st {cls} s">{esc(q["status"])}</span></h3>'
                + "".join(f"<p>{esc(a)}</p>" for a in q["a"]) + todo + f'<p class="note">出典：{src}</p></section>')
    return out

def pref_page(p):
    unconf = ("<ul>" + "".join(f"<li>{esc(u)}</li>" for u in p["unconfirmed"]) + "</ul>") if p["unconfirmed"] \
        else "<p>いまのところ、未確認として残している項目はありません。</p>"
    src = "".join(f'<li><a href="{esc(u)}" rel="noopener" target="_blank">{esc(u)}</a></li>' for u in p["sources"])
    if "ten" not in p:
        unconf += "<p class=\"note\">この県の「出願前に確かめる10問」は準備中です。</p>"
    ten = ten_block(p) if "ten" in p else ""
    head = "出願前に確かめる10問" if ten else "地域枠と修学資金"
    body = f"""<h1>{esc(p["pref"])}の{head}</h1>
<p class="lead">{esc(p["univ"])}。{badge(p)}</p>
{ten}
<h2>{"数字の早見" if ten else "数字"}</h2>
<dl class="pl">
<dt>定員</dt><dd>{esc(p["capacity"])}</dd>
<dt>貸与額</dt><dd>{esc(p["loan"])}</dd>
<dt>義務年限と勤務先</dt><dd>{esc(p["obligation"])}</dd>
<dt>資料の年度</dt><dd>{esc(p["fiscal_year"])}</dd>
<dt>最終確認日</dt><dd>{esc(p["checked"])}</dd>
</dl>
<h2>まだ確認できていないこと</h2>
{unconf}
<h2>出典</h2>
<ul class="src">{src}</ul>
<p><a href="../index.html#pref">県の一覧にもどる</a></p>"""
    return page(f"pref/{p['id']}.html", f"{p['pref']}の地域枠と修学資金｜{SITE}",
                f"{p['pref']}（{p['univ']}）の地域枠の定員、貸与額、義務年限。出典と確認日つき。", body, 1)

def index_page():
    ready = [p for p in DATA if "ten" in p]
    rest = [p for p in DATA if "ten" not in p]
    cards = "".join(f'<a class="card" href="pref/{p["id"]}.html"><b>{esc(p["pref"])}</b><span>{esc(p["univ"])}</span>'
                    f'<span class="st ok">10問を掲載</span>{"<span>出願前の急ぎの注意あり</span>" if p.get("alerts") else ""}</a>' for p in ready)
    cards += "".join(f'<a class="card" href="pref/{p["id"]}.html"><b>{esc(p["pref"])}</b><span>{esc(p["univ"])}</span>'
                     f'<span class="st warn">10問は準備中</span><span>いまは貸与額・義務年限・定員と出典のみ</span></a>' for p in rest)
    qs = "".join(f"<li>{esc(q['q'])}</li>" for q in ready[0]["ten"]) if ready else ""
    body = f"""<h1>{esc(SITE)}</h1>
<p class="lead">地域枠は、入学時から県が学費や生活費を貸し、卒業後に県が指定する病院で決まった年数働くと返さなくてよくなる仕組みです。出願するかどうかを決める前に、親子で確かめておきたいことを県ごとにまとめています。</p>
<p>地域枠で出すか一般で受けるか、まだ決めていない親子は、先に<a href="choose.html">地域枠か一般か、親子で決めるときに</a>を読んでください。</p>
<h2 id="pref">県を選ぶ</h2>
<p>出願できる地域枠は、多くの場合、出身や住んでいる県で決まります。自分の県のページを開いてください。</p>
<div class="cards">{cards}</div>
<h2 id="ten">出願前に確かめる10問</h2>
<p>どの県のページも、次の10問に同じ順番で答える形にしていきます。要項や条例で確かめられたものと、まだ確かめられていないものは分けて書きます。</p>
<ol>{qs}</ol>
<div class="judge"><p>借りる額の多い少ないより、9年間どこで働くことになるか、途中でやめたらいくら返すことになるかを先に見てください。後から困るのはたいていそこです。</p></div>
<h2>県どうしを月額で比べない理由</h2>
<p>以前は生活費の月額を県ごとに並べた表を置いていました。けれど受験生は県を選んで地域枠に出るわけではないので、月額の高い低いは判断の材料になりません。まだ確かめられていない数字も多く、並べると実際より確かな情報に見えてしまいます。月額や義務年限は、各県のページの数字の欄に出典つきで残しています。</p>"""
    return page("index.html", f"{SITE}｜医学部の地域枠、出願前に確かめる10問",
                "医学部の地域枠と修学資金について、出願資格、9年間の勤務先、離脱したときの返還額など、出願前に親子で確かめたい10問を県ごとにまとめています。出典と確認日つき。", body, 0)

def choose_page():
    import choose
    return page("choose.html", f"地域枠か一般か、親子で決めるときに｜{SITE}", choose.DESC, choose.BODY, 0)


def write(rel, s):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(s)

def main():
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(os.path.join(OUT, "assets"))
    shutil.copy(os.path.join(HERE, "..", "assets", "style.css"), os.path.join(OUT, "assets", "style.css"))
    write("index.html", index_page())
    write("choose.html", choose_page())
    urls = ["", "choose.html"]
    for p in DATA:
        write(f"pref/{p['id']}.html", pref_page(p)); urls.append(f"pref/{p['id']}.html")
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sm += "".join(f"<url><loc>{BASE_URL}/{u}</loc></url>\n" for u in urls) + "</urlset>\n"
    write("sitemap.xml", sm)
    write("robots.txt", f"User-agent: *\nAllow: /\nSitemap: {BASE_URL}/sitemap.xml\n")
    print(f"{len(DATA)}県 → {len(urls)}ページ を {OUT} に出力")

if __name__ == "__main__":
    main()
