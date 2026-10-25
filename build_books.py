import json, html, re
from urllib.parse import quote
TAG = "gadgetlog0921-22"
RAKUTEN = "58cc0d02.af3f8ff5.58cc0d03.800ac399"
def rakuten(i13):
    t = quote(f"https://books.rakuten.co.jp/search?sitem={i13}", safe="")
    return f"https://hb.afl.rakuten.co.jp/hgc/{RAKUTEN}/?pc={t}&m={t}"
d = json.load(open('books-data.json', encoding='utf8'))
def isbn10(i13):
    b = i13[3:12]
    s = sum((10 - k) * int(c) for k, c in enumerate(b))
    c = (11 - s % 11) % 11
    return b + ('X' if c == 10 else str(c))
e = html.escape
src = open('units.html', encoding='utf8').read()
head = src[:src.index('<main class="wrap">')]
head = head.replace('単元ごとの目安', '科目別のおすすめ教材').replace('/units.html', '/books.html')
head = re.sub(r'(<meta name="description" content=")[^"]*', r'\1東大・京大・旧帝大と医学部の受験の数学、英語、化学、物理、生物で、段階ごとに1冊選ぶための教材ガイド。誰に向くか、いつ始めるか、よくある失敗を書いています。', head)
head = re.sub(r'(<meta property="og:description" content=")[^"]*', r'\1東大・京大・旧帝大と医学部の受験の教材を、段階ごとに1冊選ぶためのガイド。', head)
subjects = []
for b in d:
    if b['subject'] not in subjects: subjects.append(b['subject'])
out = [head, '<main class="wrap">\n<h1>科目別のおすすめ教材</h1>\n<p class="lead">教材は「全部やる」のではなく、段階ごとに1冊選んで最後までやるのが前提です。各段階に主力を1冊、代わりになる本を1〜2冊だけ挙げました。複数の予備校や合格体験記の推薦が重なる本だけを選び、書誌はISBNで2か所以上で照合しています。リンクはAmazonと楽天ブックスへのアフィリエイトリンクで、購入されると紹介料が入ります（PR）。選ぶ基準は紹介料ではなく、受験生にとって合うかどうかです。</p>\n'
       '<section class="now-panel">\n  <div class="pick-row" data-pick="type"><span>志望校</span></div>\n'
       '  <p class="note" data-only="bun">文系を選んでいるので、数学IIIを含む本と、理科（化学・物理・生物）の本を隠しています。国語と地歴の教材はまだ載せていません。</p>\n</section>\n']
# 文系では理系だけの本と理科の科目を隠す（data-only は assets/app.js が処理する）
SUBJ_ONLY = {'化学': 'ri', '物理': 'ri', '生物': 'ri'}
def only(x): return f' data-only="{x}"' if x else ''
for s in subjects:
    if out[-1].endswith('</div>\n') and len(out) > 2: out.append('</section>\n')
    out.append(f'<section{only(SUBJ_ONLY.get(s))}>\n<h2>{e(s)}</h2>\n')
    stages = []
    for b in d:
        if b['subject'] == s and b['stage'] not in stages: stages.append(b['stage'])
    for st in stages:
        out.append(f'<h3>{e(st)}</h3>\n')
        for b in [x for x in d if x['subject'] == s and x['stage'] == st]:
            url = f"https://www.amazon.co.jp/dp/{isbn10(b['isbn13'])}?tag={TAG}"
            role = '主力' if b['role'] == 'main' else '代わり'
            out.append(f'<div class="card"{only(b.get("only"))}><p><strong>{role}：{e(b["title"])}</strong>　{e(b["publisher"])}／{e(b["author"])}／{e(b["edition"])}</p>\n'
                       f'<p>{e(b["who"])}</p>\n<p>始める時期と目安：{e(b["when"])}</p>\n<p class="fail">{e(b["pitfall"])}</p>\n'
                       f'<p><a href="{url}" target="_blank" rel="noopener sponsored">Amazonで見る</a>　<a href="{rakuten(b['isbn13'])}" target="_blank" rel="noopener sponsored">楽天ブックスで見る</a></p></div>\n')
out.append('</section>\n<footer>\n  <p class="note">【PR】このページのリンクはアフィリエイトリンクです。Amazonのアソシエイトとして、当メディアは適格販売により収入を得ています。楽天ブックスへのリンクからの購入でも紹介料が入ります。教材は版が変わることがあるので、購入前に最新の版か確認してください。</p>\n  <p class="note">出典と作り方は<a href="index.html#method">トップページの最後</a>にあります。</p>\n</footer>\n</main>\n<script src="assets/data.js"></script>\n<script src="assets/app.js"></script>\n</body>\n</html>\n')
open('books.html', 'w', encoding='utf8').write(''.join(out))
print(len(d), 'books')
