// ひらく？とじる？の問題を作る（ブラウザと node の両方で使う）。
// 中身は、文化審議会建議「公用文作成の考え方」（令和4年1月7日）の「Ⅰ-1 漢字の使い方」と、その解説（漢字を仮名にする語・漢字で書く語）に書いてあることだけ（2026-11-17 に読んだ。要点は共有フォルダ games/hiraku-tojiru-research.md）。
// 1問は、公用文の短い文で、空いたところを漢字で書くか仮名で書くかを選ぶ。正解したら2段目「どの決まりで？」を8つから選ぶ。
// 答えは公用文（法令・告示・通知など）の書き方。建議は、広く一般に向けた解説・広報では、漢字で書く語も仮名で書いてよいとしている（画面にも書く）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・文の並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    kb: ["文化審議会建議「公用文作成の考え方」（令和4年1月7日）Ⅰ-1 漢字の使い方・解説", "https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/93651301_01.pdf"],
  };
  const MEDIA = { bun: "公用文" };

  // 2段目「どの決まりで？」
  const GROUPS = {
    hojo: { name: "補助の使い方は仮名", sub: "〜ていく・〜ていただく など", set: "all" },
    keishiki: { name: "形式名詞は仮名", sub: "こと・とき・ところ・もの など", set: "all" },
    jissitsu: { name: "具体的な意味なら漢字", sub: "特定できる対象・本来の動作", set: "all" },
    kanji_go: { name: "漢字で書く接続詞・副詞・連体詞", sub: "決まった語だけ", set: "all" },
    kana_go: { name: "仮名で書く接続詞・副詞・連体詞", sub: "決まった語だけ", set: "all" },
    doushi: { name: "仮名で書く動詞", sub: "ある・いる・できる・なる など", set: "all" },
    ateji: { name: "当て字・表にない字は仮名", sub: "熟字訓・常用漢字表にない字", set: "all" },
    settou: { name: "接頭辞「御」は漢字、「お」は仮名", sub: "ご・お を付ける語", set: "all" },
  };
  const GRP_WHY = {
    hojo: "「〜て行く」「〜て頂く」「〜て下さる」のような補助的な使い方は、「〜ていく」「〜ていただく」「〜てくださる」と仮名で書きます。",
    keishiki: "「事・時・所・物・中・通り・訳」などが形式名詞として使われるときは、「こと・とき・ところ・もの・うち・とおり・わけ」と仮名で書きます。",
    jissitsu: "具体的に特定できる対象がある場合や、本来の動作の意味で使う場合は、漢字で書きます（例：家を建てる所・賞状を頂く・街へ行く）。",
    kanji_go: "接続詞の「及び・又は・並びに・若しくは」、連体詞の「来る・去る・我が」、副詞の「既に・更に」などは、漢字で書くことになっています。",
    kana_go: "接続詞の「しかし・ただし・さらに」、副詞の「かなり・とても」、連体詞の「いわゆる・あらゆる」などは、仮名で書きます。",
    doushi: "「有る・在る・居る・出来る・成る」は、「問題がある」「利用ができる」「1万円になる」のような使い方では仮名で書きます。",
    ateji: "当て字や熟字訓（常用漢字表の付表にない語）、常用漢字表にない字を含む語は、仮名で書きます（例：すばらしい・たばこ・あらかじめ）。",
    settou: "接頭辞の「御（ご）」は漢字で書き（御意見・御挨拶）、「お」は仮名で書きます（お願い・お菓子）。",
  };

  // [id, 難しさ, 答え, もう一つの書き方, 決まり, 文（＿ が空いたところ）, ヒント1]
  const D = [
    ["e_teiku", 0, "ていく", "て行く", "hojo", ["人口が少しずつ増え＿。", "新しい仕事に慣れ＿。", "町の様子が変わっ＿。"], "「行く」の本来の意味（場所を移る）ではありません。"],
    ["e_iku", 0, "行く", "いく", "jissitsu", ["駅前の街へ＿。", "バスで市役所へ＿。", "歩いて図書館へ＿。"], "ここは本当に場所を移る動作です。"],
    ["e_koto", 0, "こと", "事", "keishiki", ["書類を出す＿が必要です。", "次の点に注意する＿。", "期限を守る＿が大切だ。"], "具体的な出来事を指していません。"],
    ["e_toki", 0, "とき", "時", "keishiki", ["困った＿は、窓口に相談する。", "申請する＿は、印鑑を持参する。", "雨の＿は、体育館で行う。"], "「〜の場合」という意味です。"],
    ["e_oyobi", 0, "及び", "および", "kanji_go", ["氏名＿住所を書く。", "国＿地方公共団体", "日時＿場所を知らせる。"], "決まった接続詞です。"],
    ["e_shikashi", 0, "しかし", "然し", "kana_go", ["＿、期限は延ばせない。", "＿、例外もある。", "＿、予算には限りがある。"], "文をつなぐ言葉（接続詞）です。"],
    ["e_dekiru", 0, "できる", "出来る", "doushi", ["窓口で利用が＿。", "郵送でも申請が＿。", "誰でも参加が＿。"], "「出来が良い」の「出来」とはちがう使い方です。"],
    ["e_aru", 0, "ある", "有る", "doushi", ["この書類には問題が＿。", "説明に欠点が＿。", "会場に駐車場が＿。"], "「問題がある」のような使い方です。"],
    ["e_tabako", 0, "たばこ", "煙草", "ateji", ["庁舎内では＿を吸わない。", "＿の吸い殻を道に捨てない。", "歩きながら＿を吸わない。"], "常用漢字表の付表にない熟字訓です。"],
    ["e_onegai", 0, "お願い", "御願い", "settou", ["ご協力の＿。", "書類の提出の＿。", "期限を守るよう＿します。"], "「お」を付けた語です。"],
    ["n_tekudasaru", 1, "てくださる", "て下さる", "hojo", ["係の人が手順を教え＿。", "地域の方が手伝っ＿。", "先生が絵を描い＿。"], "物を渡す動作ではありません。"],
    ["n_kudasaru", 1, "下さる", "くださる", "jissitsu", ["来賓の方が贈物を＿。", "市長が記念品を＿。", "祖母が手紙を＿。"], "本当に物を渡す動作です。"],
    ["n_teitadaku", 1, "ていただく", "て頂く", "hojo", ["書類を送っ＿。", "期限までに返事をし＿。", "会場に早めに来＿。"], "物を受け取る動作ではありません。"],
    ["n_itadaku", 1, "頂く", "いただく", "jissitsu", ["式で賞状を＿。", "お客様からお土産を＿。", "先生から本を＿。"], "本当に物を受け取る動作です。"],
    ["n_tokoro", 1, "所", "ところ", "jissitsu", ["家を建てる＿を探す。", "新しい店を開く＿を決める。", "車を止める＿を探す。"], "具体的に特定できる場所です。"],
    ["n_toki", 1, "時", "とき", "jissitsu", ["法律の定める年齢に達した＿", "満18歳に達した＿から使える。", "この法律が施行された＿"], "特定できる時点を指しています。"],
    ["n_matawa", 1, "又は", "または", "kanji_go", ["郵送＿窓口で出す。", "本人＿代理人が書く。", "電話＿メールで連絡する。"], "決まった接続詞です。"],
    ["n_kanari", 1, "かなり", "可成り", "kana_go", ["申し込みが＿多い。", "手続に＿時間がかかる。", "参加者は＿増えた。"], "程度を表す副詞です。"],
    ["n_iwayuru", 1, "いわゆる", "所謂", "kana_go", ["＿働き方改革", "＿空き家の問題", "＿団塊の世代"], "名詞を修飾する言葉（連体詞）です。"],
    ["n_naru", 1, "なる", "成る", "doushi", ["合計で1万円に＿。", "来月から有料に＿。", "春から担当に＿。"], "「〜に変わる」という使い方です。"],
    ["n_naru_j", 1, "成る", "なる", "jissitsu", ["この規則は本表と付表から＿。", "この法律は三つの章から＿。", "委員会は5人の委員から＿。"], "「組み立てられている」という意味です。"],
    ["n_goiken", 1, "御意見", "ご意見", "settou", ["皆様の＿を伺う。", "寄せられた＿をまとめる。", "＿をお寄せください。"], "「ご」を付けた語です。"],
    ["n_subarashii", 1, "すばらしい", "素晴らしい", "ateji", ["＿成果を上げた。", "＿景色が広がる。", "＿演奏だった。"], "当て字として扱われる語です。"],
    ["n_saranaru", 1, "更なる", "さらなる", "kanji_go", ["＿発展を目指す。", "＿努力を求める。", "＿改善に取り組む。"], "決まった副詞の形です。"],
    ["h_wake", 2, "わけ", "訳", "keishiki", ["そうする＿にはいかない。", "今さら断る＿にもいかない。", "急ぐ＿ではない。"], "理由そのものを指していません。"],
    ["h_wake_j", 2, "訳", "わけ", "jissitsu", ["＿あって欠席する。", "遅れた＿を話す。", "休んだ＿を聞く。"], "具体的な事情を指しています。"],
    ["h_uchi", 2, "うち", "内", "keishiki", ["三つの案の＿一つを選ぶ。", "応募した人の＿半数が学生だった。", "十人の＿三人が欠席した。"], "「〜の中から」という使い方です。"],
    ["h_uchi_j", 2, "内", "うち", "jissitsu", ["思いを＿に秘める。", "門の＿に車を止める。", "怒りを＿に抑える。"], "「内側」という本来の意味です。"],
    ["h_toori", 2, "とおり", "通り", "keishiki", ["通知の＿に進める。", "思った＿の結果になった。", "次の＿決める。"], "道のことではありません。"],
    ["h_moshikuwa", 2, "若しくは", "もしくは", "kanji_go", ["許可＿届出が要る。", "申請書＿届出書を出す。", "写真＿動画を添える。"], "決まった接続詞です。"],
    ["h_narabini", 2, "並びに", "ならびに", "kanji_go", ["委員の氏名＿住所", "委員長＿各委員の意見を聞く。", "規則＿運用の方針を示す。"], "決まった接続詞です。"],
    ["h_kitaru", 2, "来る", "きたる", "kanji_go", ["＿5月1日に説明会を開く。", "＿10日に住民説明会を行う。", "＿20日に締め切る。"], "日付の前に付く言葉（連体詞）です。"],
    ["h_gochisou", 2, "ごちそう", "御馳走", "ateji", ["地元の＿を用意する。", "祭りで＿を振る舞う。", "客に＿を出す。"], "「馳」は常用漢字表にない字です。"],
    ["h_arakajime", 2, "あらかじめ", "予め", "ateji", ["＿申し込む。", "＿日程を知らせる。", "＿資料を読んでおく。"], "常用漢字表にない読み方です。"],
    ["h_sudeni", 2, "既に", "すでに", "kanji_go", ["書類は＿届いている。", "＿受付を終えた。", "工事は＿始まっている。"], "決まった副詞です。"],
    ["h_aru_j", 2, "有る", "ある", "jissitsu", ["財産が＿か無いかを調べる。", "資格が＿者と無い者に分ける。", "貯金が＿か無いかを書く。"], "「有無」の対照を強めています。"],
    ["h_mono_j", 2, "物", "もの", "jissitsu", ["所持する＿を調べる。", "持ち込む＿を確かめる。", "忘れた＿を取りに戻る。"], "具体的に特定できる品物です。"],
    ["h_mono", 2, "もの", "物", "keishiki", ["この規則は、来月から適用する＿とする。", "前項の規定は、次の場合に準用する＿とする。", "申請は、書面で行う＿とする。"], "品物を指していません。"],
  ];

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end

  function lvl(ans, alt, sents) {
    return (R) => {
      const si = ri(R, 0, sents.length - 1), [pre, post] = sents[si].split("＿");
      const q = `${pre}＿＿${post}　漢字？仮名？`;
      return { type: "act", q, opts: shuffle(R, [ans, alt]), ans, rev: false, full: pre + ans + post, v: `${si}` };
    };
  }
  const KINDS = D.map(([id, lv, ans, alt, grp, sents, look]) => ({ id, lv, ans, alt, grp, col: "bun", sents, name: `${ans}（${alt}ではなく）`, look, key: GROUPS[grp].name + "（" + GROUPS[grp].sub + "）", why: `公用文では「${ans}」と書きます。${look}`, src: ["kb"], make: lvl(ans, alt, sents) }));
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);
  const GRP_OF = Object.fromEntries(KINDS.map((k) => [k.id, k.grp]));
  const groupsOf = (g) => Object.keys(GROUPS).filter((x) => GROUPS[x].set === GROUPS[g].set);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: GRP_WHY[k.grp], media: MEDIA[k.col], src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const HRK = { KINDS, BY, GROUPS, GRP_OF, GRP_WHY, LV, SRC, MEDIA, kindsOf, groupsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = HRK; else root.HRK = HRK;
})(typeof self !== "undefined" ? self : this);
