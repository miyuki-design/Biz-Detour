import { useState, useEffect, useRef } from 'react'

type Screen = 'input' | 'results' | 'favorites'
type Tab = 'spots' | 'restaurants' | 'lunch'

interface Spot {
  id: string
  name: string
  category: string
  walk: string
  description: string
  rating: number
  tag: string
  emoji: string
  area: string
  tab: Tab
}

interface BusinessArea {
  area: string
  spots: Spot[]
  restaurants: Spot[]
  lunch: Spot[]
}

// Geo bounding boxes for area detection (lat_min, lat_max, lng_min, lng_max)
const AREA_BOUNDS: Record<string, [number, number, number, number]> = {
  '新宿':   [35.685, 35.700, 139.690, 139.715],
  '渋谷':   [35.655, 35.670, 139.695, 139.715],
  '品川':   [35.620, 35.640, 139.730, 139.750],
  '丸の内': [35.675, 35.690, 139.760, 139.780],
  '梅田':   [34.695, 34.710, 135.490, 135.510],
  '難波':   [34.660, 34.675, 135.495, 135.515],
  '名古屋': [35.165, 35.180, 136.880, 136.910],
  '博多':   [33.585, 33.600, 130.415, 130.435],
  '札幌':   [43.055, 43.070, 141.345, 141.365],
  '仙台':   [38.255, 38.270, 140.870, 140.895],
  '京都':   [34.985, 35.005, 135.755, 135.780],
  '横浜':   [35.440, 35.460, 139.625, 139.650],
}

function detectAreaFromCoords(lat: number, lng: number): string | null {
  for (const [area, [latMin, latMax, lngMin, lngMax]] of Object.entries(AREA_BOUNDS)) {
    if (lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax) return area
  }
  // Closest by center distance
  let closest = '新宿', minDist = Infinity
  for (const [area, [latMin, latMax, lngMin, lngMax]] of Object.entries(AREA_BOUNDS)) {
    const cLat = (latMin + latMax) / 2
    const cLng = (lngMin + lngMax) / 2
    const d = Math.hypot(lat - cLat, lng - cLng)
    if (d < minDist) { minDist = d; closest = area }
  }
  return closest
}

const makeSpots = (area: string, tab: Tab, list: Omit<Spot, 'id' | 'area' | 'tab'>[]): Spot[] =>
  list.map((s, i) => ({ ...s, id: `${area}-${tab}-${i}`, area, tab }))

const DATA: Record<string, BusinessArea> = {
  '梅田': {
    area: '梅田',
    spots: makeSpots('梅田', 'spots', [
      { name: '大阪市立科学館', category: '科学館', walk: '徒歩8分', description: 'プラネタリウムが人気。理系な気分転換に。', rating: 4.4, tag: '知的', emoji: '🔭' },
      { name: '中之島公園', category: '公園', walk: '徒歩12分', description: '堂島川と土佐堀川に挟まれた都心の緑地。水辺の散歩が気持ちいい。', rating: 4.5, tag: '水辺', emoji: '🌊' },
      { name: '大阪天満宮', category: '神社', walk: '徒歩15分', description: '学問の神様・菅原道真を祀る歴史ある神社。', rating: 4.4, tag: 'お参り', emoji: '⛩️' },
    ]),
    restaurants: makeSpots('梅田', 'restaurants', [
      { name: '鶴橋風月 梅田', category: 'お好み焼き', walk: '徒歩5分', description: '大阪名物お好み焼きの名店。ふっくら生地が絶品。', rating: 4.5, tag: '大阪名物', emoji: '🥞' },
      { name: 'づぼらや', category: 'ふぐ料理', walk: '徒歩8分', description: 'てっちりからてっさまで本格ふぐ料理を堪能。', rating: 4.6, tag: '高級', emoji: '🐡' },
      { name: 'BEER BELLY 梅田', category: 'クラフトビール', walk: '徒歩4分', description: '大阪発クラフトビール。仕事後の一杯に最適。', rating: 4.4, tag: '地ビール', emoji: '🍻' },
    ]),
    lunch: makeSpots('梅田', 'lunch', [
      { name: 'いか焼き屋台', category: 'いか焼き', walk: '徒歩3分', description: '大阪名物いか焼き¥200。阪急百貨店B2の定番。', rating: 4.3, tag: '激安', emoji: '🦑' },
      { name: '自由軒 梅田店', category: '洋食', walk: '徒歩6分', description: '名物カレーは生卵のせ。1910年創業の老舗。¥900〜', rating: 4.5, tag: '老舗', emoji: '🍛' },
      { name: '天丼てんや', category: '天丼', walk: '徒歩2分', description: 'サクサク天丼¥690〜。サクッと済ませたい時に。', rating: 4.1, tag: 'スピード', emoji: '🍤' },
    ]),
  },
  '難波': {
    area: '難波',
    spots: makeSpots('難波', 'spots', [
      { name: '道頓堀', category: '観光', walk: '徒歩3分', description: 'グリコ看板と川沿いの賑わい。大阪のシンボル。', rating: 4.6, tag: '定番', emoji: '🎭' },
      { name: '住吉大社', category: '神社', walk: '徒歩20分', description: '全国約2,300社の住吉神社の総本社。厳かな空間。', rating: 4.7, tag: '格式', emoji: '⛩️' },
      { name: '黒門市場', category: '市場', walk: '徒歩8分', description: '大阪の台所。鮮魚・青果が並ぶ活気ある市場。', rating: 4.4, tag: '活気', emoji: '🐟' },
    ]),
    restaurants: makeSpots('難波', 'restaurants', [
      { name: 'かに道楽 道頓堀', category: 'かに料理', walk: '徒歩5分', description: '動くかに看板が目印。本格かに会席が楽しめる。', rating: 4.6, tag: '名物', emoji: '🦀' },
      { name: '千とせ', category: 'うどん', walk: '徒歩10分', description: '芸人も通う肉吸い発祥の店。深夜まで営業。', rating: 4.5, tag: '名物', emoji: '🍜' },
      { name: 'ロケット 難波', category: '串カツ', walk: '徒歩6分', description: '大阪名物串カツ食べ放題。二度漬け禁止！', rating: 4.3, tag: '大阪名物', emoji: '🍡' },
    ]),
    lunch: makeSpots('難波', 'lunch', [
      { name: 'たこ梅 本店', category: 'おでん', walk: '徒歩7分', description: '1844年創業。関東煮（おでん）の老舗。¥1,000〜', rating: 4.6, tag: '老舗', emoji: '🍢' },
      { name: 'スパイスカレー大陸', category: 'スパイスカレー', walk: '徒歩8分', description: '大阪スパイスカレーの名店。スパイス香るランチ¥1,300。', rating: 4.7, tag: '人気', emoji: '🍛' },
      { name: 'コナモン博物館カフェ', category: '粉もん', walk: '徒歩4分', description: 'たこ焼き体験もできるカフェ。大阪らしい体験を。¥800〜', rating: 4.2, tag: '体験', emoji: '🐙' },
    ]),
  },
  '名古屋': {
    area: '名古屋',
    spots: makeSpots('名古屋', 'spots', [
      { name: '名古屋城', category: '城', walk: '徒歩18分', description: '金のシャチホコで有名な天下の名城。本丸御殿が見事。', rating: 4.7, tag: '定番', emoji: '🏯' },
      { name: '四間道・円頓寺', category: '街並み', walk: '徒歩15分', description: '江戸時代の町割りが残る風情ある街並み。カフェも充実。', rating: 4.5, tag: '歴史', emoji: '🏘️' },
      { name: '白川公園', category: '公園', walk: '徒歩10分', description: '美術館・科学館に隣接する緑豊かな公園。噴水が爽快。', rating: 4.3, tag: 'のんびり', emoji: '⛲' },
    ]),
    restaurants: makeSpots('名古屋', 'restaurants', [
      { name: '矢場とん', category: '味噌カツ', walk: '徒歩8分', description: '名古屋名物味噌カツの総本山。甘辛味噌がご飯に合う。', rating: 4.6, tag: '名古屋メシ', emoji: '🥩' },
      { name: '鳥開 総本店', category: '名古屋コーチン', walk: '徒歩6分', description: 'ブランド鶏・名古屋コーチンの焼き鳥。接待にも。', rating: 4.7, tag: 'ブランド鶏', emoji: '🍗' },
      { name: 'ひつまぶし 備長', category: 'うなぎ', walk: '徒歩12分', description: '名古屋名物ひつまぶし。3通りの食べ方を楽しむ。', rating: 4.8, tag: '贅沢', emoji: '🐟' },
    ]),
    lunch: makeSpots('名古屋', 'lunch', [
      { name: 'コメダ珈琲 本店エリア', category: '喫茶モーニング', walk: '徒歩5分', description: 'ドリンク代でトースト付き。名古屋の喫茶文化を体験。¥600〜', rating: 4.5, tag: '文化体験', emoji: '☕' },
      { name: '山本屋本店', category: '味噌煮込みうどん', walk: '徒歩7分', description: '硬めの麺に赤味噌が絡む名古屋名物。¥1,400〜', rating: 4.6, tag: '名古屋メシ', emoji: '🍜' },
      { name: 'あんかけスパ チャオ', category: 'あんかけスパ', walk: '徒歩9分', description: '名古屋独自のあんかけスパゲッティ。スパイシーで癖になる。¥900〜', rating: 4.4, tag: '独自文化', emoji: '🍝' },
    ]),
  },
  '博多': {
    area: '博多',
    spots: makeSpots('博多', 'spots', [
      { name: '住吉神社', category: '神社', walk: '徒歩8分', description: '博多の鎮守。全国最古の住吉神社として知られる。', rating: 4.5, tag: '最古', emoji: '⛩️' },
      { name: '博多港', category: '港', walk: '徒歩15分', description: 'キャナルシティ経由で博多港へ。夕暮れの海が美しい。', rating: 4.3, tag: '夕景', emoji: '⛵' },
      { name: '博多旧市街', category: '街歩き', walk: '徒歩10分', description: '承天寺・東長寺など歴史的な寺院が点在する路地裏歩き。', rating: 4.4, tag: '歴史', emoji: '🏯' },
    ]),
    restaurants: makeSpots('博多', 'restaurants', [
      { name: '一蘭 本社総本店', category: 'ラーメン', walk: '徒歩5分', description: '博多ラーメンの聖地。秘伝のタレが生きる一杯。', rating: 4.5, tag: '本場', emoji: '🍥' },
      { name: '川端ぜんざい広場', category: '和スイーツ', walk: '徒歩12分', description: '博多名物ぜんざい。出張後のほっこりした一息に。', rating: 4.3, tag: '甘味', emoji: '🍡' },
      { name: '博多もつ鍋 おおやま', category: 'もつ鍋', walk: '徒歩7分', description: '博多名物もつ鍋の名店。コラーゲンたっぷり。', rating: 4.7, tag: '博多名物', emoji: '🍲' },
    ]),
    lunch: makeSpots('博多', 'lunch', [
      { name: '元祖博多めんたい重', category: '明太子', walk: '徒歩6分', description: 'たっぷり明太子のごはん¥1,200。博多土産にも。', rating: 4.5, tag: '名物', emoji: '🐟' },
      { name: 'ごぼう天うどん 牧のうどん', category: 'うどん', walk: '徒歩10分', description: '博多うどんはやわふわが正義。汁を吸い続ける麺が名物。¥700〜', rating: 4.4, tag: '博多流', emoji: '🍜' },
      { name: 'ひよこ本舗 吉野堂カフェ', category: 'カフェ', walk: '徒歩4分', description: '博多土産の老舗が手がけるカフェ。スイーツランチも充実。¥1,000〜', rating: 4.2, tag: '老舗系', emoji: '☕' },
    ]),
  },
  '札幌': {
    area: '札幌',
    spots: makeSpots('札幌', 'spots', [
      { name: '大通公園', category: '公園', walk: '徒歩5分', description: '札幌の中心を貫く1.5kmの緑地。テレビ塔を望む開放感。', rating: 4.6, tag: '開放感', emoji: '🌳' },
      { name: '北海道庁旧本庁舎', category: '歴史建築', walk: '徒歩8分', description: '赤レンガが美しいネオバロック建築。庭園の散策も気持ちいい。', rating: 4.5, tag: '赤レンガ', emoji: '🏛️' },
      { name: '円山動物園', category: '動物園', walk: '徒歩30分', description: '市内から近い本格動物園。雪の中のシロクマが有名。', rating: 4.4, tag: '癒し', emoji: '🐻‍❄️' },
    ]),
    restaurants: makeSpots('札幌', 'restaurants', [
      { name: 'すすきの 海鮮居酒屋', category: '海鮮', walk: '徒歩10分', description: '北海道の新鮮な海の幸を贅沢に。ウニ・いくらが名物。', rating: 4.6, tag: '海鮮', emoji: '🦀' },
      { name: 'サッポロビール園', category: 'ジンギスカン', walk: '徒歩20分', description: '北海道といえばジンギスカン食べ放題。歴史ある煉瓦建築で。', rating: 4.5, tag: 'ジンギスカン', emoji: '🐑' },
      { name: '味の三平', category: '味噌ラーメン', walk: '徒歩6分', description: '札幌味噌ラーメン発祥の老舗。バターコーンも追加で。', rating: 4.7, tag: '発祥', emoji: '🍥' },
    ]),
    lunch: makeSpots('札幌', 'lunch', [
      { name: '二条市場 海鮮丼', category: '海鮮丼', walk: '徒歩12分', description: '朝市で仕入れた新鮮ネタの海鮮丼¥1,800〜。贅沢ランチに。', rating: 4.6, tag: '新鮮', emoji: '🐟' },
      { name: 'スープカレー lavi', category: 'スープカレー', walk: '徒歩8分', description: '北海道野菜たっぷりスープカレー¥1,200〜。体が温まる。', rating: 4.5, tag: '北海道発', emoji: '🍛' },
      { name: 'パン屋 ど真ん中', category: 'ベーカリー', walk: '徒歩5分', description: '道産小麦のパンが揃うベーカリーランチ。¥800〜', rating: 4.3, tag: '道産', emoji: '🥐' },
    ]),
  },
  '京都': {
    area: '京都',
    spots: makeSpots('京都', 'spots', [
      { name: '錦市場', category: '市場', walk: '徒歩8分', description: '京の台所。漬物・湯葉・和菓子が並ぶ400m のアーケード。', rating: 4.6, tag: '食文化', emoji: '🥬' },
      { name: '二条城', category: '城', walk: '徒歩15分', description: '世界遺産。鴬張りの廊下と豪壮な二の丸御殿。', rating: 4.8, tag: '世界遺産', emoji: '🏯' },
      { name: '先斗町', category: '街歩き', walk: '徒歩5分', description: '鴨川沿いの石畳。夕暮れ時の風情は格別。', rating: 4.5, tag: '風情', emoji: '🏮' },
    ]),
    restaurants: makeSpots('京都', 'restaurants', [
      { name: '瓢亭 別館', category: '京料理', walk: '徒歩18分', description: '創業450年超の京料理の名門。朝粥が世界的に有名。', rating: 4.9, tag: '名門', emoji: '🍱' },
      { name: 'ソワレ', category: '喫茶', walk: '徒歩6分', description: '青い光に包まれた幻想的な昭和喫茶。ゼリーポンチが名物。', rating: 4.6, tag: '昭和喫茶', emoji: '💙' },
      { name: '京都ビアラボ', category: 'クラフトビール', walk: '徒歩10分', description: '京都産ホップのクラフトビール。和テイストの一杯。', rating: 4.4, tag: '地ビール', emoji: '🍺' },
    ]),
    lunch: makeSpots('京都', 'lunch', [
      { name: '晦庵 河道屋', category: '蕎麦', walk: '徒歩7分', description: '明治創業の京蕎麦。芳醇なだしと細麺が繊細。¥1,200〜', rating: 4.7, tag: '京風', emoji: '🍜' },
      { name: 'おばんざい 六盛', category: 'おばんざい', walk: '徒歩10分', description: '京のおばんざいビュッフェ¥1,500。惣菜の種類が豊富。', rating: 4.5, tag: '京野菜', emoji: '🥗' },
      { name: 'イノダコーヒ本店', category: '喫茶', walk: '徒歩8分', description: '1940年創業の名喫茶。サンドイッチとコーヒーのランチ¥1,100。', rating: 4.6, tag: '老舗', emoji: '☕' },
    ]),
  },
  '横浜': {
    area: '横浜',
    spots: makeSpots('横浜', 'spots', [
      { name: '山下公園', category: '公園', walk: '徒歩12分', description: '港を望む開放的な海岸公園。氷川丸の姿が印象的。', rating: 4.6, tag: '港町', emoji: '⚓' },
      { name: '中華街', category: '観光', walk: '徒歩10分', description: '日本最大の中華街。豚まん食べ歩きが定番コース。', rating: 4.5, tag: '異国情緒', emoji: '🏮' },
      { name: '横浜赤レンガ倉庫', category: '歴史建築', walk: '徒歩15分', description: '明治・大正期の赤煉瓦建築。ショップやカフェも充実。', rating: 4.6, tag: '歴史', emoji: '🧱' },
    ]),
    restaurants: makeSpots('横浜', 'restaurants', [
      { name: '重慶飯店 本館', category: '中華', walk: '徒歩12分', description: '中華街の老舗。本格四川料理と飲茶でもてなし。', rating: 4.6, tag: '老舗', emoji: '🥟' },
      { name: 'ブリマー ブルーイング', category: 'クラフトビール', walk: '徒歩8分', description: '横浜発のクラフトビール醸造所直営バー。港の雰囲気で一杯。', rating: 4.4, tag: '地ビール', emoji: '🍺' },
      { name: '霧笛楼', category: 'フレンチ', walk: '徒歩18分', description: '山手の洋館を改装した本格フレンチ。接待に最適。', rating: 4.7, tag: '接待', emoji: '🍷' },
    ]),
    lunch: makeSpots('横浜', 'lunch', [
      { name: '崎陽軒 本店', category: 'シウマイ', walk: '徒歩5分', description: '横浜名物シウマイ弁当の本店。シウマイランチ¥900〜', rating: 4.5, tag: '横浜名物', emoji: '🥟' },
      { name: 'ナポリタン キャラウェイ', category: '洋食', walk: '徒歩10分', description: '横浜発祥ナポリタンの名店。昔懐かしい鉄板スパゲッティ。¥1,100〜', rating: 4.4, tag: '発祥', emoji: '🍝' },
      { name: '横浜中華街 点心', category: '飲茶', walk: '徒歩12分', description: '本格飲茶のランチコース¥1,500〜。週末は行列必至。', rating: 4.5, tag: '本格', emoji: '🥠' },
    ]),
  },
  '仙台': {
    area: '仙台',
    spots: makeSpots('仙台', 'spots', [
      { name: '瑞鳳殿', category: '霊廟', walk: '徒歩25分', description: '伊達政宗の霊廟。豪華絢爛な桃山建築が見事。', rating: 4.6, tag: '歴史', emoji: '🏯' },
      { name: '仙台城跡（青葉城）', category: '城跡', walk: '徒歩20分', description: '政宗公像から市街地を一望。夜景スポットとしても人気。', rating: 4.5, tag: '夜景', emoji: '🌃' },
      { name: '定禅寺通', category: '並木道', walk: '徒歩8分', description: 'ケヤキ並木が美しい杜の都のシンボル。光のページェントが有名。', rating: 4.6, tag: '並木', emoji: '🌳' },
    ]),
    restaurants: makeSpots('仙台', 'restaurants', [
      { name: '牛タン 利久 西口本店', category: '牛タン', walk: '徒歩6分', description: '仙台名物牛タン。分厚くジューシーな炭火焼きが絶品。', rating: 4.7, tag: '仙台名物', emoji: '🥩' },
      { name: 'すし哲', category: '寿司', walk: '徒歩10分', description: '三陸の新鮮な地魚にぎり。地元客に愛される名店。', rating: 4.6, tag: '地魚', emoji: '🍣' },
      { name: '一番町 ずんだ茶寮', category: '和スイーツ', walk: '徒歩5分', description: 'ずんだシェイクで有名な和スイーツの店。甘さ控えめで上品。', rating: 4.4, tag: '仙台名物', emoji: '🫛' },
    ]),
    lunch: makeSpots('仙台', 'lunch', [
      { name: '牛タン定食 太助', category: '牛タン', walk: '徒歩7分', description: '仙台牛タン発祥店。麦飯・テールスープ付き定食¥1,700〜', rating: 4.7, tag: '発祥', emoji: '🥩' },
      { name: 'ずんだ餅 老舗', category: '和食', walk: '徒歩9分', description: 'ずんだ餅の老舗。昼の甘味としても◎。¥800〜', rating: 4.3, tag: '郷土', emoji: '🍡' },
      { name: '仙台朝市 食堂', category: '定食', walk: '徒歩10分', description: '朝市に隣接する食堂。新鮮な海鮮丼¥1,200〜', rating: 4.4, tag: '新鮮', emoji: '🐟' },
    ]),
  },
  '新宿': {
    area: '新宿',
    spots: makeSpots('新宿', 'spots', [
      { name: '新宿御苑', category: '公園', walk: '徒歩12分', description: '広大な庭園。打ち合わせ後の気分転換に最適。', rating: 4.7, tag: 'リフレッシュ', emoji: '🌿' },
      { name: '東京都庁展望台', category: '展望', walk: '徒歩8分', description: '無料で東京の夜景が楽しめる穴場スポット。', rating: 4.5, tag: '無料', emoji: '🏙️' },
      { name: '花園神社', category: '神社', walk: '徒歩5分', description: '都心に佇む歴史ある神社。静かに一息つける。', rating: 4.3, tag: 'お参り', emoji: '⛩️' },
    ]),
    restaurants: makeSpots('新宿', 'restaurants', [
      { name: 'BERG', category: 'ドイツ料理', walk: '徒歩3分', description: '新宿駅改札前。ソーセージとビールが本格派。', rating: 4.4, tag: '定番', emoji: '🍺' },
      { name: 'つな八 総本店', category: '天ぷら', walk: '徒歩7分', description: '老舗天ぷら屋。夜の接待にも使えるカジュアル高級感。', rating: 4.6, tag: '老舗', emoji: '🦐' },
      { name: 'LUMINE EST', category: 'フードホール', walk: '徒歩2分', description: '多様なジャンルが揃うフードホール。一人でも入りやすい。', rating: 4.2, tag: '選択肢多', emoji: '🍽️' },
    ]),
    lunch: makeSpots('新宿', 'lunch', [
      { name: '淀川 新宿店', category: 'うどん', walk: '徒歩4分', description: '讃岐うどん専門店。コシのある麺が絶品。¥800〜', rating: 4.5, tag: 'CP◎', emoji: '🍜' },
      { name: 'タイ屋台999', category: 'タイ料理', walk: '徒歩6分', description: 'ランチセット¥1,100。ガパオライスが人気No.1。', rating: 4.4, tag: '異国気分', emoji: '🌶️' },
      { name: 'マクロビキッチン', category: 'ヘルシー', walk: '徒歩9分', description: '野菜中心のランチプレート。体に優しい一食。¥950〜', rating: 4.3, tag: 'ヘルシー', emoji: '🥗' },
    ]),
  },
  '渋谷': {
    area: '渋谷',
    spots: makeSpots('渋谷', 'spots', [
      { name: '代官山蔦屋書店', category: '書店', walk: '徒歩15分', description: 'ライフスタイル提案型書店。ゆっくり時間を過ごせる。', rating: 4.8, tag: 'トレンド', emoji: '📚' },
      { name: '渋谷ストリーム屋上', category: '展望', walk: '徒歩3分', description: '渋川沿いのテラスでリフレッシュ。夕暮れが美しい。', rating: 4.4, tag: '穴場', emoji: '🌅' },
      { name: '鍋島松濤公園', category: '公園', walk: '徒歩10分', description: '落ち着いた高級住宅街の中の小さな公園。', rating: 4.2, tag: '静か', emoji: '🌳' },
    ]),
    restaurants: makeSpots('渋谷', 'restaurants', [
      { name: 'SMOKEHOUSE', category: 'BBQ', walk: '徒歩12分', description: 'ナカメエリアのスモークBBQ。肉塊が圧巻。', rating: 4.6, tag: '肉', emoji: '🥩' },
      { name: '鳥しき 系列店', category: '焼き鳥', walk: '徒歩8分', description: '予約困難な名店の系列。カウンター席で串を堪能。', rating: 4.7, tag: '名店', emoji: '🍢' },
      { name: 'GONPACHI 渋谷', category: '和食', walk: '徒歩5分', description: '外国のお客様との接待にも映える和の空間。', rating: 4.5, tag: '接待向', emoji: '🎌' },
    ]),
    lunch: makeSpots('渋谷', 'lunch', [
      { name: 'IVY PLACE', category: 'カフェ&ブランチ', walk: '徒歩14分', description: 'アボカドトーストが名物。テラス席でゆったりランチ。¥1,500〜', rating: 4.6, tag: 'おしゃれ', emoji: '🥑' },
      { name: '福しん', category: 'ラーメン', walk: '徒歩4分', description: '醤油ラーメン¥600。素朴で飽きない味。サクッと食べられる。', rating: 4.1, tag: 'スピード', emoji: '🍥' },
      { name: 'Piatto Suzuki', category: 'イタリアン', walk: '徒歩7分', description: 'パスタランチ¥1,200。シェフ一人の小さな名店。', rating: 4.7, tag: '予約推奨', emoji: '🍝' },
    ]),
  },
  '品川': {
    area: '品川',
    spots: makeSpots('品川', 'spots', [
      { name: '品川水族館', category: '水族館', walk: '徒歩20分', description: 'イルカショーが有名。時間があれば立ち寄り価値あり。', rating: 4.3, tag: '癒し', emoji: '🐬' },
      { name: '御殿山庭園', category: '庭園', walk: '徒歩10分', description: '季節の花が咲く落ち着いた庭園。ビジネスマン憩いの場。', rating: 4.2, tag: '四季折々', emoji: '🌸' },
      { name: 'エキュート品川', category: 'ショッピング', walk: '徒歩2分', description: '駅直結の商業施設。お土産探しにも便利。', rating: 4.4, tag: '便利', emoji: '🛍️' },
    ]),
    restaurants: makeSpots('品川', 'restaurants', [
      { name: 'the 3rd Burger', category: 'バーガー', walk: '徒歩5分', description: '国産食材100%。本格グルメバーガーの先駆け。', rating: 4.3, tag: '国産', emoji: '🍔' },
      { name: '吉左右', category: '天ぷら割烹', walk: '徒歩8分', description: '夜の接待に使える高級天ぷら。コースが充実。', rating: 4.7, tag: '接待', emoji: '🍱' },
      { name: 'バルバッコア', category: 'シュラスコ', walk: '徒歩6分', description: 'ブラジル式食べ放題。肉好きのビジネス仲間と。', rating: 4.5, tag: '食べ放題', emoji: '🥩' },
    ]),
    lunch: makeSpots('品川', 'lunch', [
      { name: '海鮮丼 魚河岸', category: '海鮮', walk: '徒歩3分', description: '新鮮な海鮮丼¥1,200〜。駅直結で時短ランチ可能。', rating: 4.5, tag: '新鮮', emoji: '🐟' },
      { name: '香港甜蜜蜜', category: '飲茶', walk: '徒歩7分', description: '本格飲茶ランチ¥1,400。週替わりメニューが楽しい。', rating: 4.4, tag: '本格派', emoji: '🥟' },
      { name: 'DEAN & DELUCA カフェ', category: 'カフェ', walk: '徒歩4分', description: 'サラダボウルが人気。PCワーク可能な席あり。¥1,100〜', rating: 4.3, tag: '仕事可', emoji: '💻' },
    ]),
  },
  '丸の内': {
    area: '丸の内',
    spots: makeSpots('丸の内', 'spots', [
      { name: '皇居東御苑', category: '庭園', walk: '徒歩12分', description: '無料開放の皇居庭園。都心の緑に心が洗われる。', rating: 4.7, tag: '無料', emoji: '🌿' },
      { name: '三菱一号館美術館', category: '美術館', walk: '徒歩5分', description: '赤煉瓦の美しい建築。19世紀ヨーロッパ美術が中心。', rating: 4.6, tag: '文化', emoji: '🎨' },
      { name: 'KITTE 屋上庭園', category: '展望', walk: '徒歩3分', description: '東京駅を一望できる無料テラス。撮影スポットとして人気。', rating: 4.5, tag: '無料', emoji: '📷' },
    ]),
    restaurants: makeSpots('丸の内', 'restaurants', [
      { name: 'PACIFIC SEAFOOD', category: 'シーフード', walk: '徒歩6分', description: '新鮮な魚介料理。接待から一人飲みまで幅広く。', rating: 4.5, tag: '魚介', emoji: '🦞' },
      { name: '蕎麦 きりん', category: '蕎麦', walk: '徒歩8分', description: '打ちたての手打ち蕎麦。夜は日本酒と蕎麦前を楽しめる。', rating: 4.6, tag: '本格', emoji: '🍜' },
      { name: 'CRAFTBEER MARKET', category: 'クラフトビール', walk: '徒歩4分', description: '常時30種以上のクラフトビール。仕事終わりの一杯に。', rating: 4.4, tag: '飲み', emoji: '🍻' },
    ]),
    lunch: makeSpots('丸の内', 'lunch', [
      { name: '福臨門 丸の内店', category: '中華', walk: '徒歩5分', description: '香港式高級中華のランチコース。接待ランチにも最適。¥2,200〜', rating: 4.6, tag: '上品', emoji: '🥢' },
      { name: '大名古屋ビルヂング', category: 'フードホール', walk: '徒歩7分', description: '多彩なジャンルのランチが集結。1000〜1500円台が中心。', rating: 4.3, tag: '選択肢◎', emoji: '🏢' },
      { name: 'ONODERA ランチ', category: 'フレンチ', walk: '徒歩9分', description: 'ミシュラン店のランチコース¥2,500。コスパ最高。', rating: 4.8, tag: '贅沢', emoji: '⭐' },
    ]),
  },
}

const AREAS = Object.keys(DATA)

function getAvailableTime(returnTime: string, currentTime: string): number {
  const [rh, rm] = returnTime.split(':').map(Number)
  const [ch, cm] = currentTime.split(':').map(Number)
  return Math.max(0, (rh * 60 + rm) - (ch * 60 + cm) - 30)
}

function filterByTime(spots: Spot[], minutes: number): Spot[] {
  return spots.filter(s => parseInt(s.walk) * 2 + 20 <= minutes)
}

function useFavorites() {
  const [favIds, setFavIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('biz-detour-favorites')
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch { return new Set() }
  })

  const toggle = (id: string) => {
    setFavIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem('biz-detour-favorites', JSON.stringify([...next]))
      return next
    })
  }

  const allFavoriteSpots: Spot[] = []
  for (const area of Object.values(DATA)) {
    for (const list of [area.spots, area.restaurants, area.lunch]) {
      for (const spot of list) {
        if (favIds.has(spot.id)) allFavoriteSpots.push(spot)
      }
    }
  }

  return { favIds, toggle, allFavoriteSpots }
}

// ── Top-level App ──────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('input')
  const [prevScreen, setPrevScreen] = useState<Screen>('input')
  const [tab, setTab] = useState<Tab>('spots')
  const [destination, setDestination] = useState('')
  const [returnTime, setReturnTime] = useState('18:30')
  const [returnStation, setReturnStation] = useState('')
  const [currentTime, setCurrentTime] = useState('17:00')
  const [areaData, setAreaData] = useState<BusinessArea | null>(null)
  const [availableMin, setAvailableMin] = useState(0)
  const { favIds, toggle, allFavoriteSpots } = useFavorites()

  const navigateTo = (next: Screen) => {
    setPrevScreen(screen)
    setScreen(next)
  }

  const handleSearch = () => {
    const key = AREAS.find(a => destination.includes(a)) ?? AREAS[0]
    setAreaData(DATA[key])
    setAvailableMin(getAvailableTime(returnTime, currentTime))
    navigateTo('results')
    setTab('spots')
  }

  const filtered = areaData ? {
    spots: filterByTime(areaData.spots, availableMin),
    restaurants: filterByTime(areaData.restaurants, availableMin),
    lunch: filterByTime(areaData.lunch, availableMin),
  } : null

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'spots', label: '寄り道', emoji: '📍' },
    { key: 'restaurants', label: '飲食店', emoji: '🍽️' },
    { key: 'lunch', label: 'ランチ', emoji: '☀️' },
  ]

  // Determine animation class based on navigation direction
  const animClass =
    screen === 'input' ? 'animate-slide-in-left' :
    screen === 'favorites' && prevScreen !== 'favorites' ? 'animate-slide-in-right' :
    'animate-slide-in-right'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-background)' }}>
      <div
        className="w-full max-w-[390px] relative overflow-hidden"
        style={{
          minHeight: 844,
          background: 'var(--color-background)',
          borderRadius: 40,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-4 pb-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>9:41</span>
          <div className="flex gap-1 items-center">
            <div className="w-4 h-2 rounded-sm border" style={{ borderColor: 'var(--color-foreground)', opacity: 0.7 }}>
              <div className="h-full rounded-sm" style={{ width: '75%', background: 'var(--color-foreground)' }} />
            </div>
          </div>
        </div>

        <div key={screen} className={animClass}>
          {screen === 'input' && (
            <InputScreen
              destination={destination}
              setDestination={setDestination}
              returnTime={returnTime}
              setReturnTime={setReturnTime}
              returnStation={returnStation}
              setReturnStation={setReturnStation}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              onSearch={handleSearch}
              favCount={allFavoriteSpots.length}
              onOpenFavorites={() => navigateTo('favorites')}
            />
          )}
          {screen === 'results' && areaData && filtered && (
            <ResultsScreen
              returnStation={returnStation}
              data={areaData}
              filtered={filtered}
              availableMin={availableMin}
              tab={tab}
              tabs={tabs}
              setTab={setTab}
              onBack={() => navigateTo('input')}
              favIds={favIds}
              onToggleFav={toggle}
              onOpenFavorites={() => navigateTo('favorites')}
              favCount={allFavoriteSpots.length}
            />
          )}
          {screen === 'favorites' && (
            <FavoritesScreen
              spots={allFavoriteSpots}
              favIds={favIds}
              onToggleFav={toggle}
              onBack={() => navigateTo(prevScreen === 'favorites' ? 'input' : prevScreen)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Input Screen ───────────────────────────────────────────────────────────────
function InputScreen({
  destination, setDestination,
  returnTime, setReturnTime,
  returnStation, setReturnStation,
  currentTime, setCurrentTime,
  onSearch, favCount, onOpenFavorites,
}: {
  destination: string
  setDestination: (v: string) => void
  returnTime: string
  setReturnTime: (v: string) => void
  returnStation: string
  setReturnStation: (v: string) => void
  currentTime: string
  setCurrentTime: (v: string) => void
  onSearch: () => void
  favCount: number
  onOpenFavorites: () => void
}) {
  const [gpsState, setGpsState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleGps = () => {
    if (!navigator.geolocation) { setGpsState('error'); return }
    setGpsState('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const area = detectAreaFromCoords(pos.coords.latitude, pos.coords.longitude)
        if (area) setDestination(area)
        setGpsState('done')
        setTimeout(() => setGpsState('idle'), 2000)
      },
      () => {
        // Fallback for demo: simulate nearest area
        setDestination('新宿')
        setGpsState('done')
        setTimeout(() => setGpsState('idle'), 2000)
      },
      { timeout: 8000 }
    )
  }

  return (
    <div className="flex flex-col px-6 pb-8" style={{ minHeight: 780 }}>
      {/* Header row */}
      <div className="mt-6 mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🗺️</span>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--color-primary)' }}>Biz Detour</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight break-keep" style={{ color: 'var(--color-foreground)' }}>
            出張の合間に、<span style={{ color: 'var(--color-primary)' }}>いい場所</span>を見つけよう。
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted-foreground)' }}>
            出張先と時間を入れるだけで徒歩圏内のおすすめを提案します。
          </p>
        </div>
        {/* Favorites badge */}
        <button onClick={onOpenFavorites} className="relative flex-shrink-0 mt-1 ml-2 w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <span className="text-lg">❤️</span>
          {favCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'var(--color-primary)', color: '#fff' }}>
              {favCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Destination field with GPS */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-muted-foreground)' }}>出張先エリア</span>
            </div>
            <button
              onClick={handleGps}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-90 relative overflow-hidden"
              style={{
                background: gpsState === 'done' ? 'rgba(255,107,53,0.15)' : 'var(--color-secondary)',
                color: gpsState === 'done' ? 'var(--color-primary)' : 'var(--color-secondary-foreground)',
                border: '1px solid',
                borderColor: gpsState === 'done' ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              {gpsState === 'loading' ? (
                <span className="inline-block animate-spin-once text-xs">⟳</span>
              ) : gpsState === 'done' ? (
                <span>✓ 取得済み</span>
              ) : (
                <>
                  <span>📡</span>
                  <span>現在地から取得</span>
                </>
              )}
              {/* Pulse ring on loading */}
              {gpsState === 'loading' && (
                <span className="absolute inset-0 rounded-full border border-orange-400 opacity-0"
                  style={{ animation: 'pulse-ring 1s ease-out infinite' }} />
              )}
            </button>
          </div>
          <input
            className="w-full bg-transparent outline-none text-sm font-medium placeholder-opacity-40"
            style={{ color: 'var(--color-foreground)' }}
            placeholder="例：新宿、渋谷、品川、丸の内"
            value={destination}
            onChange={e => setDestination(e.target.value)}
          />
        </div>

        <Field label="空き時間の開始" icon="🕐">
          <input type="time" className="w-full bg-transparent outline-none text-sm font-medium"
            style={{ color: 'var(--color-foreground)', colorScheme: 'dark' }}
            value={currentTime} onChange={e => setCurrentTime(e.target.value)} />
        </Field>

        <Field label="帰りの電車" icon="🚃">
          <input
            className="w-full bg-transparent outline-none text-sm font-medium placeholder-opacity-40 mb-2"
            style={{ color: 'var(--color-foreground)' }}
            placeholder="乗車駅（例：東京、新宿）"
            value={returnStation}
            onChange={e => setReturnStation(e.target.value)}
          />
          <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: 8 }} />
          <input type="time" className="w-full bg-transparent outline-none text-sm font-medium"
            style={{ color: 'var(--color-foreground)', colorScheme: 'dark' }}
            value={returnTime} onChange={e => setReturnTime(e.target.value)} />
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>乗車30分前を余裕として計算します</p>
        </Field>

        <div className="mt-1">
          <p className="text-xs mb-2 font-medium" style={{ color: 'var(--color-muted-foreground)' }}>人気エリアから選ぶ</p>
          {[
            { label: '関東', areas: ['新宿', '渋谷', '品川', '丸の内', '横浜'] },
            { label: '関西', areas: ['梅田', '難波', '京都'] },
            { label: 'その他', areas: ['名古屋', '博多', '札幌', '仙台'] },
          ].map(group => (
            <div key={group.label} className="mb-2">
              <p className="text-[10px] mb-1.5 font-semibold tracking-wider" style={{ color: 'var(--color-muted-foreground)', opacity: 0.6 }}>{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.areas.map(area => (
                  <button key={area} onClick={() => setDestination(area)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full transition-all active:scale-95"
                    style={{
                      background: destination === area ? 'var(--color-primary)' : 'var(--color-secondary)',
                      color: destination === area ? '#fff' : 'var(--color-secondary-foreground)',
                      border: '1px solid',
                      borderColor: destination === area ? 'var(--color-primary)' : 'var(--color-border)',
                      boxShadow: destination === area ? '0 4px 12px rgba(255,107,53,0.35)' : 'none',
                    }}>
                    {area}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onSearch} disabled={!destination}
        className="mt-8 w-full py-4 text-base font-bold rounded-2xl transition-all active:scale-95"
        style={{
          background: destination ? 'var(--color-primary)' : 'var(--color-muted)',
          color: destination ? '#fff' : 'var(--color-muted-foreground)',
          boxShadow: destination ? '0 8px 24px rgba(255,107,53,0.4)' : 'none',
        }}>
        おすすめスポットを探す →
      </button>
      <p className="text-center text-xs mt-3" style={{ color: 'var(--color-muted-foreground)' }}>
        現在地からの徒歩圏内で提案します
      </p>
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-muted-foreground)' }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

// ── Results Screen ─────────────────────────────────────────────────────────────
function ResultsScreen({
  data, filtered, availableMin, tab, tabs, setTab, onBack,
  favIds, onToggleFav, onOpenFavorites, favCount, returnStation,
}: {
  data: BusinessArea
  filtered: { spots: Spot[]; restaurants: Spot[]; lunch: Spot[] }
  availableMin: number
  tab: Tab
  tabs: { key: Tab; label: string; emoji: string }[]
  setTab: (t: Tab) => void
  onBack: () => void
  favIds: Set<string>
  onToggleFav: (id: string) => void
  onOpenFavorites: () => void
  favCount: number
  returnStation: string
}) {
  const items = filtered[tab]
  const allItems = data[tab]

  return (
    <div className="flex flex-col" style={{ minHeight: 780 }}>
      <div className="px-5 mt-2 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-muted-foreground)' }}>
            ← 条件を変更
          </button>
          <button onClick={onOpenFavorites} className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <span className="text-base">❤️</span>
            {favCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ background: 'var(--color-primary)', color: '#fff' }}>
                {favCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <span className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{data.area}</span>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: availableMin > 60 ? 'rgba(255,107,53,0.15)' : 'rgba(255,179,71,0.15)',
              color: availableMin > 60 ? 'var(--color-primary)' : 'var(--color-accent)',
            }}>
            残り {availableMin}分
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {returnStation && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              <span>🚃</span>
              <span className="font-medium" style={{ color: 'var(--color-secondary-foreground)' }}>{returnStation}駅</span>
              <span>から乗車</span>
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {items.length > 0
              ? `${items.length}件が徒歩圏内`
              : '徒歩圏内のスポットなし'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--color-card)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all"
              style={{
                background: tab === t.key ? 'var(--color-primary)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--color-muted-foreground)',
                boxShadow: tab === t.key ? '0 4px 12px rgba(255,107,53,0.35)' : 'none',
              }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-3">
        {items.length === 0 ? (
          <EmptyState availableMin={availableMin} allItems={allItems} />
        ) : (
          items.map((spot, i) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              rank={i + 1}
              isFav={favIds.has(spot.id)}
              onToggleFav={() => onToggleFav(spot.id)}
              delay={i * 60}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Favorites Screen ───────────────────────────────────────────────────────────
function FavoritesScreen({
  spots, favIds, onToggleFav, onBack,
}: {
  spots: Spot[]
  favIds: Set<string>
  onToggleFav: (id: string) => void
  onBack: () => void
}) {
  const TAB_LABELS: Record<Tab, string> = { spots: '寄り道', restaurants: '飲食店', lunch: 'ランチ' }

  return (
    <div className="flex flex-col" style={{ minHeight: 780 }}>
      <div className="px-5 mt-2 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold mb-5 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-muted-foreground)' }}>
          ← 戻る
        </button>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">❤️</span>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>お気に入り</h2>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          {spots.length > 0 ? `${spots.length}件のスポットを保存済み` : 'まだお気に入りがありません'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-3">
        {spots.length === 0 ? (
          <div className="rounded-2xl p-8 text-center animate-fade-in"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <div className="text-5xl mb-3 opacity-30">❤️</div>
            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-foreground)' }}>まだ保存がありません</p>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              スポットカードのハートをタップして<br />お気に入りに追加しましょう
            </p>
          </div>
        ) : (
          spots.map((spot, i) => (
            <div key={spot.id} className="animate-fade-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}>
                  {spot.area}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  {TAB_LABELS[spot.tab]}
                </span>
              </div>
              <SpotCard spot={spot} rank={0} isFav={favIds.has(spot.id)} onToggleFav={() => onToggleFav(spot.id)} delay={0} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Spot Card ──────────────────────────────────────────────────────────────────
function SpotCard({ spot, rank, isFav, onToggleFav, delay }: {
  spot: Spot
  rank: number
  isFav: boolean
  onToggleFav: () => void
  delay: number
}) {
  const [heartAnim, setHeartAnim] = useState(false)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHeartAnim(true)
    onToggleFav()
    setTimeout(() => setHeartAnim(false), 400)
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(spot.rating) ? '★' : '☆').join('')

  return (
    <div
      ref={ref}
      className="rounded-2xl p-4 transition-all cursor-pointer"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        boxShadow: rank === 1 ? '0 4px 20px rgba(255,107,53,0.15)' : 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.35s ease ${delay}ms, transform 0.35s cubic-bezier(.22,.68,0,1.2) ${delay}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: rank === 1 ? 'rgba(255,107,53,0.15)' : 'var(--color-secondary)' }}>
          {spot.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-foreground)' }}>{spot.name}</h3>
            {rank === 1 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--color-primary)', color: '#fff' }}>
                おすすめ
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs" style={{ color: 'var(--color-primary)' }}>{spot.walk}</span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{spot.category}</span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span className="text-[11px]" style={{ color: '#f5a623' }}>{stars} {spot.rating}</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-secondary-foreground)' }}>
            {spot.description}
          </p>
        </div>
        {/* Heart button */}
        <button
          onClick={handleFav}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{
            background: isFav ? 'rgba(255,107,53,0.15)' : 'var(--color-secondary)',
            border: '1px solid',
            borderColor: isFav ? 'rgba(255,107,53,0.4)' : 'var(--color-border)',
          }}
        >
          <span className={`text-sm ${heartAnim ? 'animate-heart-pop' : ''}`}>
            {isFav ? '❤️' : '🤍'}
          </span>
        </button>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}>
          #{spot.tag}
        </span>
        <button className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--color-primary)' }}>
          地図で見る →
        </button>
      </div>
    </div>
  )
}

function EmptyState({ availableMin, allItems }: { availableMin: number; allItems: Spot[] }) {
  return (
    <div className="rounded-2xl p-6 text-center animate-fade-in"
      style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      <div className="text-4xl mb-3">⏰</div>
      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-foreground)' }}>時間が足りません</p>
      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        残り{availableMin}分では往復が難しい状況です。
      </p>
      {allItems.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-muted-foreground)' }}>時間があれば行きたかった場所</p>
          <div className="text-sm font-medium" style={{ color: 'var(--color-secondary-foreground)' }}>
            {allItems[0].emoji} {allItems[0].name} — {allItems[0].walk}
          </div>
        </div>
      )}
    </div>
  )
}
