// 场景定义 - 大地图版 (相机跟随)
//
// 视口 (内部 canvas): 384 x 640
// 瓦片大小: 32 px
// 每张地图: 24 列 x 30 行 = 768 x 960 px (是视口的 2x1.5)
// 摄像机: 跟随玩家居中, 边缘做限制, 不会出图

const TILE = 32;
const MAP_COLS = 24;
const MAP_ROWS = 30;
const MAP_W = MAP_COLS * TILE;   // 768
const MAP_H = MAP_ROWS * TILE;   // 960

// 瓦片类型
const T = {
  GRASS:  0, PATH: 1, WATER: 2, TREE: 3, ROCK: 4, WALL: 5,
  SAND:   6, HOUSE: 7, WOOD: 8, FLOWER: 9, WELL: 10,
};

const SOLID = new Set([T.TREE, T.ROCK, T.WALL, T.HOUSE, T.WELL]); // 水可走但减速

const TILE_COLORS = {
  [T.GRASS]:  '#5fa055',
  [T.PATH]:   '#c9a36b',
  [T.WATER]:  '#3b6fb3',
  [T.TREE]:   '#2c5e2e',
  [T.ROCK]:   '#7a7368',
  [T.WALL]:   '#3a2f24',
  [T.SAND]:   '#5e5448',
  [T.HOUSE]:  '#a05a3c',
  [T.WOOD]:   '#8a6a3b',
  [T.FLOWER]: '#5fa055',
  [T.WELL]:   '#3b6fb3',
};

function parseMap(rows) {
  const ch2tile = {
    '.': T.GRASS, '-': T.PATH, '~': T.WATER, 'T': T.TREE,
    'R': T.ROCK,  '#': T.WALL, 's': T.SAND,  'H': T.HOUSE,
    'w': T.WOOD,  'f': T.FLOWER, 'W': T.WELL,
  };
  return rows.map((row) =>
    row.split('').map((ch) => (ch in ch2tile ? ch2tile[ch] : T.GRASS))
  );
}

// =========================================================================
//  场景 1 — 桃源村 (24×30): 上下两片民居, 中间有水井 / 集市广场
// =========================================================================
const villageMap = parseMap([
  'TTTTTTTTTTTT-TTTTTTTTTTT', // 0 - 北出口 col 12 (山顶观星台)
  'T......................T',
  'T..HHH......HHH........T',
  'T..HHH......HHH........T',
  'T......................T',
  'T....f........f........T',
  'T......................T',
  'T..............HHH.....T',
  'T..HHH.........HHH.....T',
  'T..HHH.................T',
  'T............----......T',
  'T............-WW-......T',
  'T....f.......-WW-..f...T',
  'T............----......T',
  'T......................-', // 14 - 东出口 col 23 (晨雾渡口)
  'T..--------------------T',
  'T..-...................T',
  'T..-..HHH......HHH..f..T',
  'T..-..HHH......HHH.....T',
  'T..-...................T',
  'T..-........f..........T',
  'T..-...................T',
  'T..-..HHH..HHH...HHH...T',
  'T..-..HHH..HHH...HHH...T',
  'T..-...................T',
  'T..-..f.....f....f.....T',
  'T..-...................T',
  'T..-...................T',
  'T..-...................T',
  'TTT-TTTTTTTTTTTTTTTTTTTT', // 29 - 西南角 (col 3) 出口
]);

// =========================================================================
//  场景 2 — 迷雾森林 (24×30): 北入口在中, 南端通洞穴, 中段一片湖
// =========================================================================
const forestMap = parseMap([
  'TTTTTTTTTTT-TTTTTTTTTTTT', // 0 - 北入口 col 11
  'T..........-...........T',
  'T..T.....T.-..T........T',
  'T....T.....-...T..T....T',
  'T..T....T..-..........TT',
  'T.....T....-....T...T..T',
  'T..T..........T........T',
  'T....T..T...T....T..T..T',
  'T..T...........T.......T',
  'T....~~~~~~..T....T....T',
  'T..T.~~~~~~........T...T',
  'T....~~~~~~..T..T......T',
  'T..T.~~~~~~............T',
  'T....~~~~~~........T...T',
  'T..T.....T..T....T....TT',
  '-..............T.......T',  // row 15 - 西出口 col 0 (古战场)
  'T....T..T....T....T..T.T',
  'T..T...........T....f..T',
  'T....T....f....T.......T',
  'T..T....T...T...T..T...T',
  'T..............T.......T',
  'T..T..T....T..........TT',
  'T..............T..T....T',
  'T..T...T..T....T.......T',
  'T....T............T..T.T',
  'T..T....T..T...T.......T',
  'T..............T..T....T',
  'T..T...T....T..........T',
  'T..T...T....T..........-', // row 28 - 东出口 col 23 (秘密花园)
  'TTTTTTTTTTTTTTTTTTTT-TTT', // 29 - 南出口 col 20
]);

// =========================================================================
//  场景 3 — 幽暗洞穴 (24×30): 北入口, 多腔室, 中央走廊, 南端 BOSS
// =========================================================================
const caveMap = parseMap([
  '############-###########', // 0
  '#sssssssssss-sssssssssss',
  '#ssss##ssssssssss##ssss#',
  '#sssssssssRsssssssssss##',
  '#sssRsssssssssssssRssss#',
  '#ssssss##sssssss##ssssR#',
  '#sssssssssssssssssssss##',
  '##ssRsssssss##ssssssRss#',
  '#ssssssss##ssssss##sssR#',
  '#sssssssssssssssssssss##',
  '#ssssRssss##ss##ssRssss#',
  '#sssssssssssssssssss##s#',
  '##ss##ssssssssssss######',
  '#ssssssssssRsssssssssss#',
  '#ssRsssss##sssss##sssRs-', // row14 - 东出口 col23 (地底暗湖)
  '#sssssssssssssssssssss##',
  '#sssssssRssssssssRsssss#',
  '#ssss##sssssssss##sssss#',
  '#sssssssssssssssssssss##',
  '#ssRssss##sssss##sssRss#',
  '#sssssssssssssssssssss##',
  '#sssssss########sssssss#',
  '##sssssss######ssssssss#',
  '#sssssssssRssssssssssss#',
  '#ssss##ssssssssss##ssss#',
  '#sssssssssssssssssssss##',
  '#ssssssRsssssRsssssRsss#',
  '#sssssssssssssssssssss##',
  '#sssssssssssssssssssss##',
  '############-###########', // 29 - 南出口 col 12
]);

// =========================================================================
//  场景 4 — 山顶观星台 (24×30): 北村庄出口, 岩石峰顶, 中央石台
// =========================================================================
const mountaintopMap = parseMap([
  'RRRRRRRRRRRR-RRRRRRRRRRR', // 0 - 北出口 col12 (云上仙宫)
  'RR....R....R....R.....RR',
  'R......R..............RR',
  'RR..R.....R....R.....RRR',
  'R.............R...R...RR',
  'RR...R..R.....R.......RR',
  'R..............R..R...RR',
  'RR.R....RRRRRRRR......RR',
  'R......RR.....RR...R...R',
  'R....RRR.......RR......R',
  'R..RRR...........RRR...R',
  'R.RR...WWWWWWWWW..RR...R',
  'R.R...WW.......WW..R...R',
  'R.R..WW...f.f...WW.R...R',
  'R.R..WW.........WW.R...R',
  'R.R...WW.......WW..R...R',
  'R.RR...WWWWWWWWW..RR...R',
  'R..RRR...........RRR...R',
  'R....RRR.......RR......R',
  'R......RR.....RR...R...R',
  'RR.R....RRRRRRRR......RR',
  'R..............R..R...RR',
  'RR...R..R.....R.......RR',
  'R.............R...R...RR',
  'RR..R.....R....R.....RRR',
  'R......R..............RR',
  'RR....R....R....R.....RR',
  'R...R.....R.R.........RR',
  'R..R...R..............RR',
  'RRRRRR-RRRRRRRRRRRRRRRRR', // 29 - 南出口 col 6
]);

// =========================================================================
//  场景 5 — 晨雾渡口 (24×30): 村庄东出口, 木栈道+海湾
// =========================================================================
const docksMap = parseMap([
  'TTTTTTTTTTTT-TTTTTTTTTTT', // 0 - 北出口 col12 (水底神殿)
  'T......................T',
  'T..HHH.........~~~~~~~~T',
  'T..HHH........~~~~~~~~~T',
  'T...............~~~~~~~T',
  'T...f.......~~~~~~~~~~~T',
  'T..........~~~~~~~~~~~~T',
  'T.........~~~~~~~~~~~~wT',
  'T..HHH...~~~~~~~~~~~~~wT',
  'T..HHH..~~~~~~~~~~~~~~wT',
  'T.......~~~~~~~~~~~~~~wT',
  'T...f...~~~~~~~~~~~~~~wT',
  'T........~~~~~~~~~~~~~~T',
  'T........~~~~~~~~~~~...T',
  'T..HHH...~~~~~~~~~~....T',
  'T..HHH....~~~~~~~~~....T',
  'T.........~~~~~~~~.....T',
  'T...f......~~~~~.......T',
  'T..........~~~~........T',
  'T...HHH.....~~.........T',
  'T...HHH................T',
  'T......................T',
  'T....f.........f.......T',
  'T......................T',
  'T..HHH........HHH......T',
  'T..HHH........HHH......T',
  'T......................T',
  'T....f.................T',
  'T......................T',
  'TTTTTTTTTTTTTTTTTTTTTT-T', // 29 - 南出口 col 22 (原 col23 row28 被树封，移一格)
]);

// =========================================================================
//  场景 6 — 古战场 (24×30): 森林西出口, 枯草荒原, 坟冢林立
// =========================================================================
const battlefieldMap = parseMap([
  'TTTTTTTTTTTT-TTTTTTTTTTT', // 0 - 北出口 col12 (熔火山口)
  'T......................T',
  'T...s..s....s..........T',
  'T..s....s..s..s..s.....T',
  'T.....s.........s......T',
  'T...s.....s......s.....T',
  'T........s.....s.......T',
  'T...s..s.....s...s.....T',
  'T.....s.s.s.s..........T',
  'T..s.....s.....s.s.....T',
  'T.....s.....s..........T',
  'T..s......s...s......s.T',
  'T...s...s.s.....s......T',
  'T.....s................T',
  'T..s...s....s..s.......T',
  '-......s.s.....s.......T', // row 15 - 西出口 col 0 (沙漠绿洲)
  'T..s.......s...........T',
  'T.....s.s.....s..s.....T',
  'T...s.....s............T',
  'T......s.......s.......T',
  'T..s.......s...........T',
  'T.....s.s.....s....s...T',
  'T..s....s..s...........T',
  'T.....s.....s..s.......T',
  'T..s.s.....s...........T',
  'T.....s......s...s.....T',
  'T..s.....s.............T',
  'T...s..s.....s.s.......T',
  'T......................T',
  'TTTTTTTTTTTTTTTTT-TTTTTT', // 29 - 东出口 col 17
]);

// =========================================================================
//  场景 7 — 秘密花园 (24×30): 森林东出口, 花海绿洲
// =========================================================================
const secretGardenMap = parseMap([
  'TTTTTTTTTTTTTTTTTTTTTTTT', // 0
  'T......................T',
  'T..f..f..f..f..f..f....T',
  'T......................T',
  'T.f...T..........T...f.T',
  'T....TTT..f.f..TTT.....T',
  'T.f..T..............T..T',
  'T....f...f.....f....f..T',
  'T......................T',
  'T..f..........~~~~~~~~.T',
  'T...f..f.....~~~~~~~~..T',
  'T.....f.....~~~~~~~~~..T',
  'T.f.........~~~~~~~~~..T',
  'T...........~~~~~~~~...T',
  'T.f..f...f..f..........T',
  'T......................T',
  'T..f...T.........T..f..T',
  'T......TTT.....TTT.....T',
  'T......................T',
  'T..f....f..f..f....f...T',
  'T......................T',
  'T.f....................T',
  'T......f.....f.........T',
  'T......................T',
  'T..f..T...........T..f.T',
  'T......TTT.....TTT.....T',
  'T......................T',
  'T..f....f.....f....f...T',
  'T......................T',
  'TTTTTTTT-TTTTTTT-TTTTTTT', // 29 - 西出口 col8 (迷雾森林), 南出口 col16 (太古密林)
]);

// =========================================================================
//  场景 8 — 沙漠绿洲 (24×30): 古战场西出口, 黄沙+水源
// =========================================================================
const oasisMap = parseMap([
  'RRRRRRRRRRRRRRRRRRRRRRRR', // 0
  'RssssssssssssssssssssssR',
  'RssRsssssssssssssssRsssR',
  '-sssssssssssssssssssssss', // row3 - 西出口 col0 (幻影古城)
  'Rsssssssssssssssssssssss',
  'RssssRssssssssssRssssssR',
  'Rsssssssss~~~~sssssssssR',
  'Rssssssss~~~~~~ssssssssR',
  'Rssssssss~~~~~~~sssssssR',
  'RssssRss~~~~~~~~~ssRsssR',
  'Rssssss~~~~~~~~~~~sssssR',
  'Rssssss~~~~~~~~~~~sssssR',
  'Rssssss~~~~~~~~~~~sssssR',
  'RssssRss~~~~~~~~~ssRsssR',
  'Rssssssss~~~~~~~sssssssR',
  'Rssssssss~~~~~~ssssssssR',
  'Rsssssssss~~~~sssssssssR',
  'RssssRssssssssssRssssssR',
  'Rsssssssssssssssssssssss',
  'Rsssssssssssssssssssssss',
  'RssRsssssssssssssssRsssR',
  'Rsssssssssssssssssssssss',
  'Rsssssssssssssssssssssss',
  'RssssRssssssssssRssssssR',
  'Rsssssssssssssssssssssss',
  'Rsssssssssssssssssssssss',
  'RssRsssssssssssssssRsssR',
  'Rsssssssssssssssssssssss',
  'Rsssssssssssssssssssssss',
  'RRRRRRRRRRR-RRRRRRRRRRRR', // 29 - 北出口 col 11
]);

// =========================================================================
//  场景 9 — 废弃小镇 (24×30): 绿洲北出口, 破败民居
// =========================================================================
const abandonedTownMap = parseMap([
  'TTTTTTTTTTTT-TTTTTTTTTTT', // 0 - 北出口 col12 (古籍楼)
  'T......................T',
  'T..HHH..HHH..HHH.......T',
  'T..HHH..HHH..HHH.......T',
  'T......................T',
  'T..-----------....HHH..T',
  'T..-.........-.........T',
  'T..-.........-.........T',
  'T..-.HHH.HHH.-.........T',
  'T..-.HHH.HHH.-.........T',
  'T..-.........-.........T',
  'T..-----------....HHH..T',
  'T.................HHH..T',
  'T......................T',
  'T..HHH...........HHH...T',
  'T..HHH...........HHH...T',
  'T......................T',
  'T..-----------...HHH...T',
  'T..-.........-.........T',
  'T..-.HHH.HHH.-.........T',
  'T..-.HHH.HHH.-.........T',
  'T..-.........-.........T',
  'T..-----------....HHH..T',
  'T................HHH...T',
  'T......................T',
  'T..HHH..HHH..HHH.......T',
  'T..HHH..HHH..HHH.......T',
  'T......................T',
  'T......................T',
  'TTTTTTTTT-TTTTTTTTTTTTTT', // 29 - 南出口 col 9
]);

// =========================================================================
//  场景 10 — 深渊洞口 (24×30): 洞穴南出口, 终极地牢
// =========================================================================
const abyssMap = parseMap([
  '############-###########', // 0 - 北出口 col 12
  '#sssssssssss-ssssssssss#',
  '#ssssssssssssssssssssss#',
  '#sssRsssssssssssRsssssss',
  '#ssssssssssssssssssssss#',
  '#ssssss############ssss#',
  '#ssssss#ssssssssss#ssss#',
  '#ss####ssssssssssss####s',
  '#ss#ssssssssssssssssss#s',
  '#ss#sssRsssssssRssssss#s',
  '#ss#ssssssssssssssssss#s',
  '#ss####ssssssssss####sss',
  '#ssssss#ssssssssss#ssss#',
  '#ssssss############ssss#',
  '#ssssssssssssssssssssss#',
  '#sssRssssssssssssRsssss#',
  '#ssssssssssssssssssssss#',
  '#sss####ssssssss####sss#',
  '#sss#sssssssssssssss#ss#',
  '#sss#sssRsssssssRsss#ss#',
  '#sss#sssssssssssssss#ss#',
  '#sss#sssssssssssssss#ss#',
  '#sss#sssRRRRRRRRssss#ss#',
  '#sss#sssssssssssssss#ss#',
  '#sss####ssssssss####sss#',
  '#ssssssssssssssssssssss#',
  '#sssssRsssssssssssssss##',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '###########-############', // 29 - 南出口 col11 (幽魂界域)
]);

// =========================================================================
//  场景 11-20 地图 (自动生成, 已验证 30行×24字符)
// =========================================================================
const cloudPalaceMap = parseMap([
  '############-###########',  // 0
  '#......................#',
  '#W....................W#',
  '#......................#',
  '#..##..........##......#',
  '#..#...............#...#',
  '#..#...............#...#',
  '#..##..........##......#',
  '#......................#',
  '#..f................f..#',
  '#......................#',
  '#W....................W#',
  '#......................#',
  '#f....................f#',
  '#......................#',
  '#W....................W#',
  '#......................#',
  '#..f................f..#',
  '#......................#',
  '#..##..........##......#',
  '#..#...............#...#',
  '#..#...............#...#',
  '#..##..........##......#',
  '#......................#',
  '#W....................W#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '############-###########'  // 29
]);

const underwaterTempleMap = parseMap([
  '############-###########',  // 0
  '#ssssssssssssssssssssss#',
  '#ss####ssssssssss####ss#',
  '#ss#ss~~~~~~~~~~~~ss#ss#',
  '#ss#s~~~~~~~~~~~~~~s#ss#',
  '#ss#ss~~~~~~~~~~~~ss#ss#',
  '#ss####ssssssssss####ss#',
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#ssssssssssssssssssssss#',
  '#ss####ssssssssss####ss#',
  '#ss#ss~~~~~~~~~~~~ss#ss#',
  '#ss#s~~~~~~~~~~~~~~s#ss#',
  '#ss#s~~~~~~~~~~~~~~s#ss#',
  '#ss#ss~~~~~~~~~~~~ss#ss#',
  '#ss####ssssssssss####ss#',
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#ssssssssssssssssssssss#',
  '#ss####ssssssssss####ss#',
  '#ss#ss~~~~~~~~~~~~ss#ss#',
  '#ss#s~~~~~~~~~~~~~~s#ss#',
  '#ss#ss~~~~~~~~~~~~ss#ss#',
  '#ss####ssssssssss####ss#',
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '############-###########'  // 29
]);

const volcanoCraterMap = parseMap([
  'RRRRRRRRRRRR-RRRRRRRRRRR',  // 0
  'RssssssssssssssssssssssR',
  'RssRssssssssssssssssRssR',
  'Rsssssss####ss####sssssR',
  'Rssssss#ss~~~~~ss#sssssR',
  'Rsssss#~~~~~~~~~~#sssssR',
  'Rssssss#ss~~~~~ss#sssssR',
  'Rsssssss####ss####sssssR',
  'RssssssssssssssssssssssR',
  'RssRssssssssssssssssRssR',
  'RssssssssssssssssssssssR',
  'Rsssssssss########sssssR',
  'Rssssssss#ss~~ss#ssssssR',
  'Rssssssss#s~~~s#sssssssR',
  'Rssssssss#s~~~s#sssssssR',
  'Rssssssss#ss~~ss#ssssssR',
  'Rsssssssss########sssssR',
  'RssssssssssssssssssssssR',
  'RssRssssssssssssssssRssR',
  'RssssssssssssssssssssssR',
  'Rsssssss####ss####sssssR',
  'Rssssss#ss~~~~~ss#sssssR',
  'Rsssss#~~~~~~~~~~#sssssR',
  'Rssssss#ss~~~~~ss#sssssR',
  'Rsssssss####ss####sssssR',
  'RssssssssssssssssssssssR',
  'RssssssssssssssssssssssR',
  'RssssssssssssssssssssssR',
  'RssssssssssssssssssssssR',
  'RRRRRRRRRRRR-RRRRRRRRRRR'  // 29
]);

const undergroundLakeMap = parseMap([
  '########################',  // 0
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#sss####ssssssss####sss#',
  '#ssss#ss~~~~~~~~ss#ssss#',
  '#ssss#s~~~~~~~~~s#sssss#',
  '#ssss#s~~~~~~~~~s#sssss#',
  '#ssss#s~~~~~~~~~s#sssss#',
  '#ssss#ss~~~~~~~~ss#ssss#',
  '#sss####ssssssss####sss#',
  '#ssssssssssssssssssssss#',
  '#sss####ssssssss####sss#',
  '#ssss#ss~~~~~~~~ss#ssss#',
  '#ssss#s~~~~~~~~~s#sssss#',
  '-ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#ssssssssssssssssssssss#',
  '#sss####ssssssss####sss#',
  '#ssss#ss~~~~~~~~ss#ssss#',
  '#ssss#s~~~~~~~~~s#sssss#',
  '#ssss#ss~~~~~~~~ss#ssss#',
  '#sss####ssssssss####sss#',
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '########################'  // 29
]);

const ancientLibraryMap = parseMap([
  '############-###########',  // 0
  '#......................#',
  '#..HH....HH....HH....HH#',
  '#..HH....HH....HH....HH#',
  '#......................#',
  '#..HH....HH....HH....HH#',
  '#..HH....HH....HH....HH#',
  '#......................#',
  '#..HH....HH....HH....HH#',
  '#..HH....HH....HH....HH#',
  '#......................#',
  '#....####......####....#',
  '#....#............#....#',
  '#....#f..........f#....#',
  '#....#............#....#',
  '#....####......####....#',
  '#......................#',
  '#..HH....HH....HH....HH#',
  '#..HH....HH....HH....HH#',
  '#......................#',
  '#..HH....HH....HH....HH#',
  '#..HH....HH....HH....HH#',
  '#......................#',
  '#..HH....HH....HH....HH#',
  '#..HH....HH....HH....HH#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '############-###########'  // 29
]);

const mirageCityMap = parseMap([
  'ssssssssssssssssssssssss',  // 0
  'ssssssssssssssssssssssss',
  'sssHHssssHHssssHHssssHHs',
  'sssHHssssHHssssHHssssHHs',
  'ssssssssssssssssssssssss',
  'sss--ss--ss--ss--ss--sss',
  'ssssssssssssssssssssssss',
  'sssHHssssHHssssHHssssHHs',
  'sssHHssssHHssssHHssssHHs',
  'ssssssssssssssssssssssss',
  'sss--ss--ss--ss--ss--sss',
  'ssssssssssssssssssssssss',
  'sssRssssssssssssssssRsss',
  'ssssssssssssssssssssssss',
  'sssssssssssssssssssssss-',
  'ssssssssssssssssssssssss',
  'sssRssssssssssssssssRsss',
  'ssssssssssssssssssssssss',
  'sss--ss--ss--ss--ss--sss',
  'ssssssssssssssssssssssss',
  'sssHHssssHHssssHHssssHHs',
  'sssHHssssHHssssHHssssHHs',
  'ssssssssssssssssssssssss',
  'sss--ss--ss--ss--ss--sss',
  'ssssssssssssssssssssssss',
  'sssHHssssHHssssHHssssHHs',
  'sssHHssssHHssssHHssssHHs',
  'ssssssssssssssssssssssss',
  'ssssssssssssssssssssssss',
  'ssssssssssssssssssssssss'  // 29
]);

const ancientForestMap = parseMap([
  'TTTTTTTTTTTTTTTT-TTTTTTT',  // 0
  'T......................T',
  'T..T..T....T....T..T..TT',
  'T....f............f....T',
  'T..T.....T......T.....TT',
  'T....f............f....T',
  'T..T....T~~~~~~~~T....TT',
  'T....T.T~~~~~~~~T.T....T',
  'T..T.....~~~~~~~~.....TT',
  'T......~~~~~~~~~~......T',
  'T..T.....~~~~~~~~.....TT',
  'T....T.T~~~~~~~~T.T....T',
  'T..T....T~~~~~~~~T....TT',
  'T....f............f....T',
  'T..T...T..f.....f.T....T',
  'T....T.....T...T...T...T',
  'T..T....f.......f...T..T',
  'T...T...T....T....T....T',
  'T..T..f...........f.T..T',
  'T....T.....T...T...T...T',
  'T..T.................T.T',
  'T....T.T..........T.T..T',
  'T..T.....T......T.....TT',
  'T....f............f....T',
  'T..T.....T......T.....TT',
  'T....f............f....T',
  'T..T..T....T....T..T..TT',
  'T......................T',
  'T......................T',
  'TTTTTTTTTTTTTTTTTTTTTTTT'  // 29
]);

const spiritRealmMap = parseMap([
  '############-###########',  // 0
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#ssssssssssssssssssssss#',
  '#sss####ssssssss####sss#',
  '#sss#sss~~~~~~~~sss#sss#',
  '#sss#ss~~~~~~~~~~ss#sss#',
  '#sss#ss~~~~~~~~~~ss#sss#',
  '#sss#sss~~~~~~~~sss#sss#',
  '#sss####ssssssss####sss#',
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#ssssssssssssssssssssss#',
  '#sss####ssssssss####sss#',
  '#sss#sss~~~~~~~~sss#sss#',
  '#sss#ss~~~~~~~~~~ss#sss#',
  '#sss#ss~~~~~~~~~~ss#sss#',
  '#sss#sss~~~~~~~~sss#sss#',
  '#sss####ssssssss####sss#',
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '############-###########'  // 29
]);

const frozenPeakMap = parseMap([
  'RRRRRRRRRRRRRRRRRRRRRRRR',  // 0
  'RssssssssssssssssssssssR',
  'RssWssssssssssssssssWssR',
  'RssssssssssssssssssssssR',
  'RssssRRRssssssssRRRssssR',
  'RsssRRRRRssssssRRRRRsssR',
  'RssssRRRssssssssRRRssssR',
  'RssssssssssssssssssssssR',
  'RssWssssssssssssssssWssR',
  'RssssssssssssssssssssssR',
  'RssssRRRssssssssRRRssssR',
  'RsssRRRRRssssssRRRRRsssR',
  'Rssssssss########ssssssR',
  'Rsssssssss#~~#sssssssssR',
  'Rsssssssss#s~~s#sssssssR',
  'Rsssssssss#~~#sssssssssR',
  'Rssssssss########ssssssR',
  'RssssssssssssssssssssssR',
  'RssWssssssssssssssssWssR',
  'RssssssssssssssssssssssR',
  'RssssRRRssssssssRRRssssR',
  'RsssRRRRRssssssRRRRRsssR',
  'RssssRRRssssssssRRRssssR',
  'RssssssssssssssssssssssR',
  'RssWssssssssssssssssWssR',
  'RssssssssssssssssssssssR',
  'RssssssssssssssssssssssR',
  'RssssssssssssssssssssssR',
  'RssssssssssssssssssssssR',
  'RRRRRRRRRRRR-RRRRRRRRRRR'  // 29
]);

const finalShrineMap = parseMap([
  '############-###########',  // 0
  '#ssssssssssssssssssssss#',
  '#ss#####################',
  '#ss#ssssssssssssssss#ss#',
  '#ss#ss############ss#ss#',
  '#ss#ss#ssssssssss#ss#ss#',
  '#ss#ss#WW..WW....#ss#ss#',
  '#ss#ss#W........W#ss#ss#',
  '#ss#ss#W........W#ss#ss#',
  '#ss#ss#WW..WW....#ss#ss#',
  '#ss#ss#ssssssssss#ss#ss#',
  '#ss#ss############ss#ss#',
  '#ss#ssssssssssssssss#ss#',
  '#ss#####################',
  '#ssssssssssssssssssssss#',
  '#ssRssssssssssssssssRss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#sss####ssssssss####sss#',
  '#sss#sss........sss#sss#',
  '#sss#..............#sss#',
  '#sss#..............#sss#',
  '#sss#..............#sss#',
  '#sss#sss........sss#sss#',
  '#sss####ssssssss####sss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '#ssssssssssssssssssssss#',
  '########################'  // 29
]);

const Scenes = {
  village: {
    name: '桃源村',
    map: villageMap,
    bg: '#5fa055',
    bgKey: 'bgVillage',
    spawn: { x: 12 * TILE, y: 12 * TILE },
    portals: [
      { x: 3 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'forest', spawn: { x: 11 * TILE, y: 1 * TILE }, label: '迷雾森林' },
      { x: 12 * TILE, y: 0, w: TILE, h: TILE,
        target: 'mountaintop', spawn: { x: 11 * TILE, y: 28 * TILE }, label: '山顶观星台' },
      { x: 23 * TILE, y: 14 * TILE, w: TILE, h: TILE,
        target: 'docks', spawn: { x: 22 * TILE, y: 28 * TILE }, label: '晨雾渡口' },
    ],
    npcs: [
      {
        id: 'elder', name: '李长老', sprite: 'elder',
        x: 4 * TILE + 4, y: 6 * TILE + 4,
        questId: 'elder_quest',
        lines: [
          '少年, 你终于来了。',
          '南边的迷雾森林最近出现了不少妖兽,',
          '村民们已经不敢出去采药。',
          '若你愿意, 可去森林历练一番,',
          '深处的洞穴中, 似乎有一股邪气...',
          '小心行事, 愿桃神庇佑你。',
        ],
      },
      {
        id: 'merchant', name: '王掌柜', sprite: 'merchant',
        x: 16 * TILE + 4, y: 6 * TILE + 4,
        type: 'shop',
        lines: ['欢迎光临!'],
      },
      {
        id: 'child', name: '小丫', sprite: 'child',
        x: 13 * TILE + 4, y: 14 * TILE + 4,
        questId: 'child_quest',
        lines: [
          '哥哥/姐姐你好呀!',
          '听说森林深处有怪兽,',
          '不过我才不害怕, 因为有你保护我!',
          '帮我抓只史莱姆当宠物吧~',
        ],
      },
      {
        id: 'innkeeper', name: '阿婆', sprite: 'merchant',
        x: 5 * TILE + 4, y: 18 * TILE + 4,
        lines: [
          '小客官, 出门在外当心身体哟。',
          '我这小店专卖回元丹,',
          '可惜你来得不巧, 今儿都卖光了。',
        ],
      },
      {
        id: 'teleporter', name: '传送法师', sprite: 'mystic',
        x: 11 * TILE + 4, y: 26 * TILE + 4,
        type: 'teleporter',
        lines: ['吾可引你前往任意之地。'],
      },
      {
        id: 'fate_envoy', name: '天机使者', sprite: 'mystic',
        x: 19 * TILE + 4, y: 26 * TILE + 4,
        questId: 'main_quest',
        lines: [
          '……吾乃天机使者。',
          '十处封印守护者已苏醒, 大难将至。',
          '若你愿意踏上封印之路, 请告知。',
        ],
      },
      {
        id: 'smith', name: '铁三', sprite: 'wanderer',
        x: 19 * TILE + 4, y: 18 * TILE + 4,
        questId: 'smith_quest',
        lines: [
          '哎, 还在用那把破铁剑哪?',
          '等我打两块好钢, 给你换把象样的家伙。',
          '后山的妖兽近来嚣张,',
          '你出门可记得多带几瓶药!',
        ],
      },
    ],
    monsters: [],
  },

  // ----------------------------------------------------------------------
  forest: {
    name: '迷雾森林',
    map: forestMap,
    bg: '#3a6e3c',
    bgKey: 'bgForest',
    spawn: { x: 11 * TILE, y: 1 * TILE },
    portals: [
      { x: 11 * TILE, y: 0, w: TILE, h: TILE,
        target: 'village', spawn: { x: 4 * TILE, y: 27 * TILE }, label: '桃源村' },
      { x: 20 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'cave', spawn: { x: 12 * TILE, y: 1 * TILE }, label: '幽暗洞穴' },
      { x: 0, y: 15 * TILE, w: TILE, h: TILE,
        target: 'battlefield', spawn: { x: 22 * TILE, y: 28 * TILE }, label: '古战场' },
      { x: 23 * TILE, y: 28 * TILE, w: TILE, h: TILE,
        target: 'secretGarden', spawn: { x: 1 * TILE, y: 28 * TILE }, label: '秘密花园' },
    ],
    npcs: [
      {
        id: 'wanderer', name: '云游道士', sprite: 'wanderer',
        x: 18 * TILE + 4, y: 18 * TILE + 4,
        lines: [
          '哎呀, 这片森林越来越不太平了。',
          '贫道在此修行, 见你气宇不凡,',
          '不如让贫道试试你的身手?',
          '(对话结束后会进入战斗)',
        ],
        onClose: 'battle',
        battle: 'wanderer',
      },
      {
        id: 'hermit', name: '采药老人', sprite: 'mystic',
        x: 5 * TILE + 4, y: 5 * TILE + 4,
        questId: 'hermit_quest',
        lines: [
          '咳咳……老朽在此采药多年。',
          '南边湖泊以南野兽愈多, 切莫轻进。',
          '若身负重伤, 回村庄找李长老即可。',
        ],
      },
    ],
    monsters: [
      { id: 'slime1',  type: 'slime',  x: 14 * TILE + 6, y: 4 * TILE + 6 },
      { id: 'slime2',  type: 'slime',  x: 18 * TILE + 6, y: 7 * TILE + 6 },
      { id: 'slime3',  type: 'slime',  x:  4 * TILE + 6, y: 16 * TILE + 6 },
      { id: 'goblin1', type: 'goblin', x:  8 * TILE + 6, y: 23 * TILE + 6 },
      { id: 'goblin2', type: 'goblin', x: 16 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'wolf1',   type: 'wolf',   x: 19 * TILE + 6, y: 26 * TILE + 6 },
      { id: 'wolf2',   type: 'wolf',   x:  4 * TILE + 6, y: 25 * TILE + 6 },
    ],
  },

  // ----------------------------------------------------------------------
  cave: {
    name: '幽暗洞穴',
    map: caveMap,
    bg: '#1f1a22',
    bgKey: 'bgCave',
    spawn: { x: 12 * TILE, y: 1 * TILE },
    portals: [
      { x: 12 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'forest', spawn: { x: 19 * TILE, y: 28 * TILE }, label: '迷雾森林' },
      { x: 10 * TILE, y: 27 * TILE, w: 2 * TILE, h: TILE,
        target: 'abyss', spawn: { x: 12 * TILE, y: 1 * TILE }, label: '深渊洞口' },
      { x: 23 * TILE, y: 14 * TILE, w: TILE, h: TILE,
        target: 'undergroundLake', spawn: { x: 1 * TILE, y: 14 * TILE }, label: '地底暗湖' },
    ],
    npcs: [
      {
        id: 'mystic', name: '神秘老者', sprite: 'mystic',
        x: 4 * TILE + 4, y: 11 * TILE + 4,
        questId: 'mystic_quest',
        lines: [
          '……来者何人?',
          '此洞深处封印着千年前的妖王,',
          '若你执意前往, 老朽自当相助。',
        ],
      },
    ],
    monsters: [
      { id: 'bat1', type: 'bat',  x:  8 * TILE + 6, y:  4 * TILE + 6 },
      { id: 'bat2', type: 'bat',  x: 16 * TILE + 6, y:  6 * TILE + 6 },
      { id: 'bat3', type: 'bat',  x: 18 * TILE + 6, y: 13 * TILE + 6 },
      { id: 'shade1', type: 'shade', x:  4 * TILE + 6, y: 18 * TILE + 6 },
      { id: 'shade2', type: 'shade', x: 19 * TILE + 6, y: 17 * TILE + 6 },
      { id: 'boss',   type: 'guardian',
        x: 11 * TILE + 6, y: 26 * TILE + 6, isBoss: true },
    ],
  },

  // ----------------------------------------------------------------------
  mountaintop: {
    name: '山顶观星台',
    map: mountaintopMap,
    bg: '#4a5a7a',
    bgKey: 'bgMountaintop',
    spawn: { x: 6 * TILE, y: 28 * TILE },
    portals: [
      { x: 6 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'village', spawn: { x: 12 * TILE, y: 1 * TILE }, label: '桃源村' },
      { x: 12 * TILE, y: 0, w: TILE, h: TILE,
        target: 'cloudPalace', spawn: { x: 12 * TILE, y: 28 * TILE }, label: '云上仙宫' },
    ],
    npcs: [
      {
        id: 'astrologer', name: '星象师', sprite: 'mystic',
        x: 11 * TILE + 4, y: 13 * TILE + 4,
        lines: [
          '……星辰指引你来此处。',
          '此台乃上古仙人观天之所。',
          '夜观星象, 可知天机——',
          '你身上有一股奇异的气息,',
          '或许与那深渊的封印有所牵连。',
          '去吧, 路还长。',
        ],
      },
    ],
    monsters: [
      { id: 'eagle1', type: 'eagle', x:  4 * TILE + 6, y:  4 * TILE + 6 },
      { id: 'eagle2', type: 'eagle', x: 18 * TILE + 6, y:  5 * TILE + 6 },
      { id: 'eagle3', type: 'eagle', x:  8 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'wind1',  type: 'wind_sprite', x: 16 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'wind2',  type: 'wind_sprite', x:  6 * TILE + 6, y: 14 * TILE + 6 },
    ],
  },

  // ----------------------------------------------------------------------
  docks: {
    name: '晨雾渡口',
    map: docksMap,
    bg: '#3a7aaa',
    bgKey: 'bgDocks',
    spawn: { x: 22 * TILE, y: 28 * TILE },
    portals: [
      { x: 22 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'village', spawn: { x: 22 * TILE, y: 14 * TILE }, label: '桃源村' },
      { x: 12 * TILE, y: 0, w: TILE, h: TILE,
        target: 'underwaterTemple', spawn: { x: 12 * TILE, y: 28 * TILE }, label: '水底神殿' },
    ],
    npcs: [
      {
        id: 'ferryman', name: '船家老汉', sprite: 'wanderer',
        x: 8 * TILE + 4, y: 7 * TILE + 4,
        lines: [
          '嗬, 好久没人来渡口了。',
          '雾气越来越重, 出海的船都回不来。',
          '听说海面上有什么东西在游荡……',
          '老汉劝你别往水里去。',
        ],
      },
      {
        id: 'docks_guard', name: '港口守卫', sprite: 'wanderer',
        x: 14 * TILE + 4, y: 22 * TILE + 4,
        lines: [
          '来这里的旅人不多。',
          '最近水妖出没, 栈道已经封了。',
          '若你要出海, 先把那些水妖清一清。',
        ],
      },
    ],
    monsters: [
      { id: 'water1', type: 'water_sprite', x:  7 * TILE + 6, y:  9 * TILE + 6 },
      { id: 'water2', type: 'water_sprite', x:  8 * TILE + 6, y: 12 * TILE + 6 },
      { id: 'crab1',  type: 'crab', x:  6 * TILE + 6, y:  4 * TILE + 6 },
      { id: 'crab2',  type: 'crab', x: 20 * TILE + 6, y: 14 * TILE + 6 },
    ],
  },

  // ----------------------------------------------------------------------
  battlefield: {
    name: '古战场',
    map: battlefieldMap,
    bg: '#6a5a3a',
    bgKey: 'bgBattlefield',
    spawn: { x: 22 * TILE, y: 28 * TILE },
    portals: [
      { x: 17 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'forest', spawn: { x: 1 * TILE, y: 15 * TILE }, label: '迷雾森林' },
      { x: 0, y: 15 * TILE, w: TILE, h: TILE,
        target: 'oasis', spawn: { x: 22 * TILE, y: 3 * TILE }, label: '沙漠绿洲' },
      { x: 12 * TILE, y: 0, w: TILE, h: TILE,
        target: 'volcanoCrater', spawn: { x: 12 * TILE, y: 28 * TILE }, label: '熔火山口' },
    ],
    npcs: [
      {
        id: 'ghost_general', name: '战魂将军', sprite: 'elder',
        x:  8 * TILE + 4, y: 14 * TILE + 4,
        lines: [
          '……你踏入了亡者之地。',
          '此处是千年前大战的遗址。',
          '无数将士的魂魄留守于此。',
          '若你有足够的勇气,',
          '可向前继续探索——',
          '但要做好准备。',
        ],
      },
    ],
    monsters: [
      { id: 'skel1', type: 'skeleton', x:  5 * TILE + 6, y:  5 * TILE + 6 },
      { id: 'skel2', type: 'skeleton', x: 15 * TILE + 6, y:  8 * TILE + 6 },
      { id: 'skel3', type: 'skeleton', x:  9 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'gk1',   type: 'ghost_knight', x: 18 * TILE + 6, y: 17 * TILE + 6 },
      { id: 'gk2',   type: 'ghost_knight', x:  3 * TILE + 6, y: 24 * TILE + 6 },
    ],
  },

  // ----------------------------------------------------------------------
  secretGarden: {
    name: '秘密花园',
    map: secretGardenMap,
    bg: '#4a8a4a',
    bgKey: 'bgGarden',
    spawn: { x: 1 * TILE, y: 28 * TILE },
    portals: [
      { x: 8 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'forest', spawn: { x: 22 * TILE, y: 28 * TILE }, label: '迷雾森林' },
      { x: 16 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'ancientForest', spawn: { x: 16 * TILE, y: 1 * TILE }, label: '太古密林' },
    ],
    npcs: [
      {
        id: 'flower_spirit', name: '花精灵', sprite: 'child',
        x: 11 * TILE + 4, y: 8 * TILE + 4,
        lines: [
          '嘻嘻, 你找到这里来了！',
          '这里是我和朋友们的秘密花园。',
          '不过最近有些调皮的妖精在捣乱,',
          '把我们的花都踩坏了！',
          '你能帮忙把它们赶走吗？',
        ],
      },
    ],
    monsters: [
      { id: 'fairy1', type: 'fairy', x:  6 * TILE + 6, y:  6 * TILE + 6 },
      { id: 'fairy2', type: 'fairy', x: 16 * TILE + 6, y:  6 * TILE + 6 },
      { id: 'fairy3', type: 'fairy', x:  5 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'plant1', type: 'plant_monster', x: 14 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'plant2', type: 'plant_monster', x:  9 * TILE + 6, y: 15 * TILE + 6 },
    ],
  },

  // ----------------------------------------------------------------------
  oasis: {
    name: '沙漠绿洲',
    map: oasisMap,
    bg: '#a08050',
    bgKey: 'bgOasis',
    spawn: { x: 22 * TILE, y: 3 * TILE },
    portals: [
      { x: 23 * TILE, y: 3 * TILE, w: TILE, h: TILE,
        target: 'battlefield', spawn: { x: 1 * TILE, y: 15 * TILE }, label: '古战场' },
      { x: 11 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'abandonedTown', spawn: { x: 9 * TILE, y: 1 * TILE }, label: '废弃小镇' },
      { x: 0, y: 3 * TILE, w: TILE, h: TILE,
        target: 'mirageCity', spawn: { x: 21 * TILE, y: 14 * TILE }, label: '幻影古城' },
    ],
    npcs: [
      {
        id: 'desert_merchant', name: '旅行商人', sprite: 'merchant',
        x: 11 * TILE + 4, y: 11 * TILE + 4,
        lines: [
          '哟, 在这荒漠里遇到人了!',
          '老夫跑遍了九州, 见过各种奇珍。',
          '沙漠里最危险的不是毒蝎——',
          '而是迷失方向。',
          '北边那座废弃小镇藏着不少秘密。',
        ],
      },
    ],
    monsters: [
      { id: 'scorpion1', type: 'sand_scorpion', x:  4 * TILE + 6, y:  4 * TILE + 6 },
      { id: 'scorpion2', type: 'sand_scorpion', x: 18 * TILE + 6, y:  6 * TILE + 6 },
      { id: 'scorpion3', type: 'sand_scorpion', x:  5 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'snake1',    type: 'desert_snake', x: 15 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'snake2',    type: 'desert_snake', x:  4 * TILE + 6, y: 20 * TILE + 6 },
    ],
  },

  // ----------------------------------------------------------------------
  abandonedTown: {
    name: '废弃小镇',
    map: abandonedTownMap,
    bg: '#3a3028',
    bgKey: 'bgAbandonedTown',
    spawn: { x: 9 * TILE, y: 1 * TILE },
    portals: [
      { x: 9 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'oasis', spawn: { x: 11 * TILE, y: 28 * TILE }, label: '沙漠绿洲' },
      { x: 12 * TILE, y: 0, w: TILE, h: TILE,
        target: 'ancientLibrary', spawn: { x: 12 * TILE, y: 28 * TILE }, label: '古籍楼' },
    ],
    npcs: [
      {
        id: 'ghost_resident', name: '幽灵居民', sprite: 'elder',
        x: 15 * TILE + 4, y: 12 * TILE + 4,
        lines: [
          '……你……你能看见我？',
          '这座小镇在一百年前被瘟疫摧毁。',
          '我们的灵魂无法离去……',
          '也许……你找到解封的方法,',
          '能让我们安息。',
        ],
      },
    ],
    monsters: [
      { id: 'zombie1', type: 'zombie', x:  5 * TILE + 6, y:  5 * TILE + 6 },
      { id: 'zombie2', type: 'zombie', x: 17 * TILE + 6, y:  8 * TILE + 6 },
      { id: 'zombie3', type: 'zombie', x:  8 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'poss1',   type: 'possessed', x: 14 * TILE + 6, y: 19 * TILE + 6 },
      { id: 'poss2',   type: 'possessed', x:  4 * TILE + 6, y: 16 * TILE + 6 },
    ],
  },

  // ----------------------------------------------------------------------
  abyss: {
    name: '深渊洞口',
    map: abyssMap,
    bg: '#0a0810',
    bgKey: 'bgAbyss',
    spawn: { x: 12 * TILE, y: 1 * TILE },
    portals: [
      { x: 12 * TILE, y: 0, w: TILE, h: TILE,
        target: 'cave', spawn: { x: 12 * TILE, y: 28 * TILE }, label: '幽暗洞穴' },
      { x: 11 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'spiritRealm', spawn: { x: 12 * TILE, y: 1 * TILE }, label: '幽魂界域' },
    ],
    npcs: [
      {
        id: 'seal_guardian', name: '封印守卫', sprite: 'mystic',
        x:  4 * TILE + 4, y: 10 * TILE + 4,
        lines: [
          '……回头吧。',
          '此地乃万年封印之所。',
          '妖王的怨念侵蚀着每一块岩石。',
          '前方的恶魔比你想象的更强大——',
          '但若你已无所畏惧,',
          '那便前行吧。',
        ],
      },
    ],
    monsters: [
      { id: 'demon1', type: 'demon', x:  8 * TILE + 6, y:  8 * TILE + 6 },
      { id: 'demon2', type: 'demon', x: 14 * TILE + 6, y: 12 * TILE + 6 },
      { id: 'shadow1', type: 'shadow_beast', x:  5 * TILE + 6, y: 18 * TILE + 6 },
      { id: 'shadow2', type: 'shadow_beast', x: 18 * TILE + 6, y: 15 * TILE + 6 },
      { id: 'demon_lord', type: 'demon_lord',
        x: 11 * TILE + 6, y: 25 * TILE + 6, isBoss: true },
      { id: 'void_emp', type: 'void_emperor',
        x:  5 * TILE + 6, y: 12 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 11 ─────────────────────────────────────────────
  cloudPalace: {
    name: '云上仙宫',
    map: cloudPalaceMap,
    bg: '#c8e8f8',
    bgKey: 'bgMountaintop',
    spawn: { x: 12 * TILE, y: 28 * TILE },
    portals: [
      { x: 12 * TILE, y: 0, w: TILE, h: TILE,
        target: 'frozenPeak', spawn: { x: 12 * TILE, y: 28 * TILE }, label: '冰峰绝顶' },
      { x: 12 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'mountaintop', spawn: { x: 6 * TILE, y: 28 * TILE }, label: '山顶观星台' },
    ],
    npcs: [
      {
        id: 'celestial_sage', name: '天界仙人', sprite: 'mystic',
        x: 12 * TILE + 4, y: 13 * TILE + 4,
        lines: [
          '……你终于来到这云上之境。',
          '十处封印的守护者正在苏醒——',
          '云宫、深海、火山、暗湖、古楼、',
          '幻城、密林、幽界、冰峰……最终封印台。',
          '你必须逐一击败他们, 收回封印之力。',
          '去找村中的天机使者, 接受"封印之路"吧。',
        ],
      },
    ],
    monsters: [
      { id: 'cg1', type: 'celestial_guard', x:  4 * TILE + 6, y:  5 * TILE + 6 },
      { id: 'cg2', type: 'celestial_guard', x: 18 * TILE + 6, y:  6 * TILE + 6 },
      { id: 'cs1', type: 'cloud_sprite',    x:  8 * TILE + 6, y: 15 * TILE + 6 },
      { id: 'cs2', type: 'cloud_sprite',    x: 16 * TILE + 6, y: 17 * TILE + 6 },
      { id: 'boss_cp', type: 'celestial_guardian',
        x: 12 * TILE + 6, y:  5 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 12 ─────────────────────────────────────────────
  underwaterTemple: {
    name: '水底神殿',
    map: underwaterTempleMap,
    bg: '#1a3a5a',
    bgKey: 'bgDocks',
    spawn: { x: 12 * TILE, y: 28 * TILE },
    portals: [
      { x: 12 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'docks', spawn: { x: 12 * TILE, y: 1 * TILE }, label: '晨雾渡口' },
    ],
    npcs: [
      {
        id: 'sea_elder', name: '深海老者', sprite: 'wanderer',
        x: 12 * TILE + 4, y: 24 * TILE + 4,
        lines: [
          '……外来者……',
          '这座神殿沉没于海底已有千年。',
          '海蛇古神镇守于内殿深处。',
          '封印碎片就藏在它的心脏里——',
          '若你能战胜它, 碎片将回归你手。',
        ],
      },
    ],
    monsters: [
      { id: 'df1', type: 'deep_fish',  x:  5 * TILE + 6, y:  8 * TILE + 6 },
      { id: 'df2', type: 'deep_fish',  x: 18 * TILE + 6, y: 10 * TILE + 6 },
      { id: 'el1', type: 'eel',        x:  8 * TILE + 6, y: 18 * TILE + 6 },
      { id: 'el2', type: 'eel',        x: 15 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'boss_ut', type: 'sea_serpent',
        x: 12 * TILE + 6, y: 13 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 13 ─────────────────────────────────────────────
  volcanoCrater: {
    name: '熔火山口',
    map: volcanoCraterMap,
    bg: '#3a1005',
    bgKey: 'bgBattlefield',
    spawn: { x: 12 * TILE, y: 28 * TILE },
    portals: [
      { x: 12 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'battlefield', spawn: { x: 12 * TILE, y: 1 * TILE }, label: '古战场' },
    ],
    npcs: [
      {
        id: 'fire_hermit', name: '火山术士', sprite: 'wanderer',
        x: 12 * TILE + 4, y: 26 * TILE + 4,
        lines: [
          '嘿！外来者进了火山?',
          '这里是熔岩巨人的领地——',
          '千年前它被封印于此,',
          '如今封印松动, 它又开始发怒了。',
          '你有胆子去挑战它？',
        ],
      },
    ],
    monsters: [
      { id: 'la1', type: 'lava_elemental', x:  5 * TILE + 6, y:  5 * TILE + 6 },
      { id: 'la2', type: 'lava_elemental', x: 18 * TILE + 6, y:  7 * TILE + 6 },
      { id: 'fb1', type: 'fire_bat',       x:  8 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'fb2', type: 'fire_bat',       x: 16 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'boss_vc', type: 'lava_titan',
        x: 12 * TILE + 6, y: 14 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 14 ─────────────────────────────────────────────
  undergroundLake: {
    name: '地底暗湖',
    map: undergroundLakeMap,
    bg: '#0a1520',
    bgKey: 'bgCave',
    spawn: { x: 1 * TILE, y: 14 * TILE },
    portals: [
      { x: 0, y: 14 * TILE, w: TILE, h: TILE,
        target: 'cave', spawn: { x: 22 * TILE, y: 14 * TILE }, label: '幽暗洞穴' },
    ],
    npcs: [
      {
        id: 'cave_hermit', name: '洞穴隐士', sprite: 'mystic',
        x: 12 * TILE + 4, y: 26 * TILE + 4,
        lines: [
          '……你是第一个找到这里的人。',
          '地底暗湖深处有一条千年蛟龙。',
          '它的身上携带着封印碎片——',
          '但它从不轻易现身。',
          '若你在湖边等候, 或许它会出来。',
        ],
      },
    ],
    monsters: [
      { id: 'cf1', type: 'cave_fish',   x:  5 * TILE + 6, y:  5 * TILE + 6 },
      { id: 'cf2', type: 'cave_fish',   x: 18 * TILE + 6, y:  8 * TILE + 6 },
      { id: 'cg1', type: 'crystal_golem', x:  6 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'cg2', type: 'crystal_golem', x: 17 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'boss_ul', type: 'cave_leviathan',
        x: 12 * TILE + 6, y: 11 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 15 ─────────────────────────────────────────────
  ancientLibrary: {
    name: '古籍楼',
    map: ancientLibraryMap,
    bg: '#1a1510',
    bgKey: 'bgAbandonedTown',
    spawn: { x: 12 * TILE, y: 28 * TILE },
    portals: [
      { x: 12 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'abandonedTown', spawn: { x: 12 * TILE, y: 1 * TILE }, label: '废弃小镇' },
    ],
    npcs: [
      {
        id: 'librarian_ghost', name: '藏书鬼魂', sprite: 'elder',
        x: 12 * TILE + 4, y: 13 * TILE + 4,
        lines: [
          '嘘——这里是万年典籍的藏所。',
          '我在此守护了一千年……',
          '那个诅咒学者侵入了禁书区——',
          '他将典籍中的邪术一一习得。',
          '若你能将他驱逐, 我将告诉你封印的秘密。',
        ],
      },
    ],
    monsters: [
      { id: 'cb1', type: 'cursed_book',   x:  4 * TILE + 6, y:  3 * TILE + 6 },
      { id: 'cb2', type: 'cursed_book',   x: 18 * TILE + 6, y:  5 * TILE + 6 },
      { id: 'id1', type: 'ink_demon',     x:  8 * TILE + 6, y: 19 * TILE + 6 },
      { id: 'id2', type: 'ink_demon',     x: 16 * TILE + 6, y: 21 * TILE + 6 },
      { id: 'boss_al', type: 'cursed_scholar',
        x: 12 * TILE + 6, y: 13 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 16 ─────────────────────────────────────────────
  mirageCity: {
    name: '幻影古城',
    map: mirageCityMap,
    bg: '#c8a850',
    bgKey: 'bgOasis',
    spawn: { x: 21 * TILE, y: 14 * TILE },
    portals: [
      { x: 23 * TILE, y: 14 * TILE, w: TILE, h: TILE,
        target: 'oasis', spawn: { x: 1 * TILE, y: 3 * TILE }, label: '沙漠绿洲' },
    ],
    npcs: [
      {
        id: 'mirage_spirit', name: '幻影使者', sprite: 'child',
        x: 12 * TILE + 4, y: 12 * TILE + 4,
        lines: [
          '哈哈哈……欢迎来到幻影古城！',
          '这里的一切都是幻觉——',
          '包括我。',
          '幻影城主喜欢挑战真正的勇士。',
          '如果你能看穿幻象, 就能找到他的真身。',
        ],
      },
    ],
    monsters: [
      { id: 'ms1', type: 'mirage_sprite', x:  5 * TILE + 6, y:  5 * TILE + 6 },
      { id: 'ms2', type: 'mirage_sprite', x: 18 * TILE + 6, y:  8 * TILE + 6 },
      { id: 'ms3', type: 'mirage_sprite', x:  8 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'sg1', type: 'sand_giant',    x: 16 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'boss_mc', type: 'mirage_lord',
        x: 12 * TILE + 6, y: 12 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 17 ─────────────────────────────────────────────
  ancientForest: {
    name: '太古密林',
    map: ancientForestMap,
    bg: '#1a3010',
    bgKey: 'bgForest',
    spawn: { x: 16 * TILE, y: 1 * TILE },
    portals: [
      { x: 16 * TILE, y: 0, w: TILE, h: TILE,
        target: 'secretGarden', spawn: { x: 16 * TILE, y: 28 * TILE }, label: '秘密花园' },
    ],
    npcs: [
      {
        id: 'forest_spirit', name: '林灵使者', sprite: 'child',
        x: 12 * TILE + 4, y: 16 * TILE + 4,
        lines: [
          '这片林子比世界本身还要古老。',
          '太古树人在此沉睡了万年——',
          '它守护着一片封印之石。',
          '只有真正与自然和谐的人,',
          '才能唤醒它, 并从它身上获取封印碎片。',
        ],
      },
    ],
    monsters: [
      { id: 'ae1', type: 'ancient_ent',     x:  4 * TILE + 6, y:  4 * TILE + 6 },
      { id: 'ae2', type: 'ancient_ent',     x: 19 * TILE + 6, y:  6 * TILE + 6 },
      { id: 'sm1', type: 'spore_mushroom',  x:  8 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'sm2', type: 'spore_mushroom',  x: 16 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'boss_af', type: 'ancient_treant',
        x: 12 * TILE + 6, y: 10 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 18 ─────────────────────────────────────────────
  spiritRealm: {
    name: '幽魂界域',
    map: spiritRealmMap,
    bg: '#0a0820',
    bgKey: 'bgAbyss',
    spawn: { x: 12 * TILE, y: 1 * TILE },
    portals: [
      { x: 12 * TILE, y: 0, w: TILE, h: TILE,
        target: 'abyss', spawn: { x: 11 * TILE, y: 28 * TILE }, label: '深渊洞口' },
      { x: 12 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'finalShrine', spawn: { x: 12 * TILE, y: 1 * TILE }, label: '天地封印台' },
    ],
    npcs: [
      {
        id: 'soul_guide', name: '魂灵向导', sprite: 'mystic',
        x: 12 * TILE + 4, y: 25 * TILE + 4,
        lines: [
          '……你穿越了深渊, 到达幽魂界域。',
          '幽灵王掌控着这片界域。',
          '击败它, 通道将开启——',
          '通向天地封印台, 最终的决战之地。',
          '九处封印碎片已在你身上,',
          '只剩最后一处……天帝封印。',
        ],
      },
    ],
    monsters: [
      { id: 'wr1', type: 'wraith',   x:  5 * TILE + 6, y:  5 * TILE + 6 },
      { id: 'wr2', type: 'wraith',   x: 18 * TILE + 6, y:  7 * TILE + 6 },
      { id: 'ph1', type: 'phantom',  x:  8 * TILE + 6, y: 15 * TILE + 6 },
      { id: 'ph2', type: 'phantom',  x: 16 * TILE + 6, y: 17 * TILE + 6 },
      { id: 'boss_sr', type: 'wraith_king',
        x: 12 * TILE + 6, y: 14 * TILE + 6, isBoss: true },
      { id: 'death_kt', type: 'death_knight',
        x:  4 * TILE + 6, y: 21 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 19 ─────────────────────────────────────────────
  frozenPeak: {
    name: '冰峰绝顶',
    map: frozenPeakMap,
    bg: '#c8e0f8',
    bgKey: 'bgMountaintop',
    spawn: { x: 12 * TILE, y: 28 * TILE },
    portals: [
      { x: 12 * TILE, y: 29 * TILE, w: TILE, h: TILE,
        target: 'cloudPalace', spawn: { x: 12 * TILE, y: 1 * TILE }, label: '云上仙宫' },
    ],
    npcs: [
      {
        id: 'frost_sage', name: '冰霜圣者', sprite: 'elder',
        x: 12 * TILE + 4, y: 13 * TILE + 4,
        lines: [
          '……寒风凛冽, 你竟能到达此处。',
          '冰霜龙在冰神庙内沉睡已久。',
          '它的鳞甲之下封存着一块封印碎片。',
          '勇者, 准备好了吗？',
        ],
      },
    ],
    monsters: [
      { id: 'fw1', type: 'frost_wolf',  x:  4 * TILE + 6, y:  4 * TILE + 6 },
      { id: 'fw2', type: 'frost_wolf',  x: 19 * TILE + 6, y:  6 * TILE + 6 },
      { id: 'ig1', type: 'ice_golem',   x:  7 * TILE + 6, y: 20 * TILE + 6 },
      { id: 'ig2', type: 'ice_golem',   x: 16 * TILE + 6, y: 22 * TILE + 6 },
      { id: 'boss_fp', type: 'frost_dragon',
        x: 12 * TILE + 6, y: 14 * TILE + 6, isBoss: true },
    ],
  },

  // ── 场景 20 ─────────────────────────────────────────────
  finalShrine: {
    name: '天地封印台',
    map: finalShrineMap,
    bg: '#050308',
    bgKey: 'bgAbyss',
    spawn: { x: 12 * TILE, y: 1 * TILE },
    portals: [
      { x: 12 * TILE, y: 0, w: TILE, h: TILE,
        target: 'spiritRealm', spawn: { x: 12 * TILE, y: 28 * TILE }, label: '幽魂界域' },
    ],
    npcs: [
      {
        id: 'seal_voice', name: '封印之声', sprite: 'mystic',
        x: 12 * TILE + 4, y: 20 * TILE + 4,
        lines: [
          '……终于……有人来了。',
          '这里是天地封印台。',
          '万年前的天帝将混沌之力封于此处——',
          '如今封印松动, 其意志化作守护者。',
          '若你有九块封印碎片, 便可挑战天帝封印。',
          '胜则封印重铸, 天地重归安宁。',
        ],
      },
    ],
    monsters: [
      { id: 'sg1', type: 'shrine_guardian', x:  5 * TILE + 6, y: 16 * TILE + 6 },
      { id: 'sg2', type: 'shrine_guardian', x: 18 * TILE + 6, y: 16 * TILE + 6 },
      { id: 'boss_fs', type: 'heaven_sealer',
        x: 12 * TILE + 6, y:  7 * TILE + 6, isBoss: true },
      { id: 'chaos_tt', type: 'chaos_titan',
        x: 19 * TILE + 6, y: 22 * TILE + 6, isBoss: true },
    ],
  },
};

// ------- 怪物模板 -------
const MonsterTemplates = {
  slime: {
    name: '青史莱姆', color: '#5fd0a0',
    hp: 20, mp: 0, atk: 6, def: 2, spd: 4,
    expReward: 8, goldReward: 5,
    skills: [],
  },
  goblin: {
    name: '林地哥布林', color: '#c08a4a',
    hp: 32, mp: 5, atk: 10, def: 3, spd: 6,
    expReward: 15, goldReward: 12,
    skills: [{ name: '猛击', mpCost: 3, mult: 1.5 }],
  },
  wolf: {
    name: '灰狼', color: '#7a7060',
    hp: 28, mp: 0, atk: 12, def: 2, spd: 8,
    expReward: 18, goldReward: 14,
    skills: [],
  },
  bat: {
    name: '幽冥蝙蝠', color: '#7a4a8a',
    hp: 24, mp: 0, atk: 8, def: 1, spd: 9,
    expReward: 12, goldReward: 8,
    skills: [],
  },
  shade: {
    name: '幽影', color: '#3a3050',
    hp: 35, mp: 10, atk: 11, def: 3, spd: 7,
    expReward: 22, goldReward: 18,
    skills: [{ name: '暗影箭', mpCost: 4, mult: 1.4 }],
  },
  guardian: {
    name: '洞穴守护者', color: '#8a3030',
    hp: 100, mp: 20, atk: 15, def: 7, spd: 5,
    expReward: 80, goldReward: 100,
    skills: [
      { name: '怒吼斩',   mpCost: 5, mult: 1.7 },
      { name: '岩石护盾', mpCost: 8, mult: 0, defBuff: 5 },
    ],
  },
  wanderer: {
    name: '云游道士', color: '#cccccc',
    hp: 28, mp: 10, atk: 9, def: 3, spd: 7,
    expReward: 20, goldReward: 15,
    skills: [{ name: '太极', mpCost: 4, mult: 1.4 }],
  },
  // 山顶观星台
  eagle: {
    name: '苍鹰', color: '#8a7a5a',
    hp: 30, mp: 0, atk: 14, def: 3, spd: 10,
    expReward: 22, goldReward: 16,
    skills: [],
  },
  wind_sprite: {
    name: '风灵', color: '#aaddff',
    hp: 22, mp: 15, atk: 12, def: 2, spd: 12,
    expReward: 25, goldReward: 18,
    skills: [{ name: '疾风斩', mpCost: 5, mult: 1.6 }],
  },
  // 晨雾渡口
  water_sprite: {
    name: '水妖', color: '#4a9adf',
    hp: 35, mp: 12, atk: 11, def: 4, spd: 7,
    expReward: 24, goldReward: 20,
    skills: [{ name: '水流冲击', mpCost: 4, mult: 1.4 }],
  },
  crab: {
    name: '巨螃蟹', color: '#cc6633',
    hp: 45, mp: 0, atk: 10, def: 8, spd: 4,
    expReward: 20, goldReward: 22,
    skills: [],
  },
  // 古战场
  skeleton: {
    name: '枯骨战士', color: '#d4d0c8',
    hp: 38, mp: 0, atk: 13, def: 5, spd: 5,
    expReward: 28, goldReward: 20,
    skills: [],
  },
  ghost_knight: {
    name: '幽骑士', color: '#7a8a9a',
    hp: 50, mp: 10, atk: 16, def: 8, spd: 6,
    expReward: 38, goldReward: 30,
    skills: [{ name: '幽冥斩', mpCost: 5, mult: 1.6 }],
  },
  // 秘密花园
  fairy: {
    name: '调皮精灵', color: '#ffaadd',
    hp: 20, mp: 20, atk: 9, def: 2, spd: 11,
    expReward: 18, goldReward: 12,
    skills: [{ name: '迷惑术', mpCost: 6, mult: 1.3 }],
  },
  plant_monster: {
    name: '食人花', color: '#4a8a2a',
    hp: 55, mp: 8, atk: 12, def: 6, spd: 3,
    expReward: 30, goldReward: 22,
    skills: [{ name: '藤蔓缠绕', mpCost: 4, mult: 1.4 }],
  },
  // 沙漠绿洲
  sand_scorpion: {
    name: '沙漠毒蝎', color: '#c8a040',
    hp: 42, mp: 0, atk: 15, def: 4, spd: 7,
    expReward: 32, goldReward: 25,
    skills: [],
  },
  desert_snake: {
    name: '沙蟒', color: '#8a7a4a',
    hp: 48, mp: 0, atk: 14, def: 5, spd: 8,
    expReward: 30, goldReward: 24,
    skills: [],
  },
  // 废弃小镇
  zombie: {
    name: '丧尸', color: '#6a8a5a',
    hp: 60, mp: 0, atk: 16, def: 6, spd: 3,
    expReward: 35, goldReward: 28,
    skills: [],
  },
  possessed: {
    name: '邪灵附身者', color: '#5a4a7a',
    hp: 52, mp: 15, atk: 18, def: 7, spd: 8,
    expReward: 42, goldReward: 35,
    skills: [{ name: '邪气爆发', mpCost: 7, mult: 1.8 }],
  },
  // 深渊洞口
  demon: {
    name: '深渊恶魔', color: '#8a2020',
    hp: 70, mp: 20, atk: 20, def: 9, spd: 8,
    expReward: 55, goldReward: 45,
    skills: [{ name: '地狱火', mpCost: 8, mult: 2.0 }],
  },
  shadow_beast: {
    name: '暗影巨兽', color: '#1a1030',
    hp: 80, mp: 15, atk: 22, def: 10, spd: 7,
    expReward: 65, goldReward: 55,
    skills: [{ name: '暗影撕裂', mpCost: 6, mult: 1.9 }],
  },
  demon_lord: {
    name: '妖王残魂', color: '#6a0a0a',
    hp: 200, mp: 50, atk: 28, def: 14, spd: 6,
    expReward: 200, goldReward: 300,
    skills: [
      { name: '妖王咆哮', mpCost: 10, mult: 2.2 },
      { name: '混沌护盾', mpCost: 15, mult: 0, defBuff: 10 },
    ],
  },
  // ── 场景 11-20 新怪物 ──
  celestial_guard: {
    name: '天界卫士', color: '#f0d060',
    hp: 75, mp: 10, atk: 22, def: 10, spd: 8,
    expReward: 50, goldReward: 40,
    skills: [{ name: '圣光斩', mpCost: 5, mult: 1.6 }],
  },
  cloud_sprite: {
    name: '云灵', color: '#c0e8ff',
    hp: 50, mp: 20, atk: 16, def: 6, spd: 12,
    expReward: 35, goldReward: 28,
    skills: [{ name: '云雾迷踪', mpCost: 6, mult: 1.4 }],
  },
  celestial_guardian: {
    name: '天界守护神', color: '#ffd700',
    hp: 250, mp: 60, atk: 32, def: 16, spd: 7,
    expReward: 220, goldReward: 320,
    skills: [
      { name: '天光裂击', mpCost: 12, mult: 2.3 },
      { name: '神圣护盾', mpCost: 18, mult: 0, defBuff: 12 },
    ],
  },
  deep_fish: {
    name: '深海鱼怪', color: '#2a6a9a',
    hp: 65, mp: 0, atk: 20, def: 9, spd: 7,
    expReward: 45, goldReward: 35,
    skills: [],
  },
  eel: {
    name: '深海电鳗', color: '#4a6aaa',
    hp: 55, mp: 15, atk: 18, def: 7, spd: 10,
    expReward: 38, goldReward: 30,
    skills: [{ name: '电击', mpCost: 5, mult: 1.5 }],
  },
  sea_serpent: {
    name: '海蛇古神', color: '#1a4a7a',
    hp: 280, mp: 55, atk: 34, def: 18, spd: 6,
    expReward: 240, goldReward: 350,
    skills: [
      { name: '海潮冲击', mpCost: 10, mult: 2.0 },
      { name: '深渊咆哮', mpCost: 15, mult: 2.4 },
    ],
  },
  lava_elemental: {
    name: '熔岩精灵', color: '#ff6820',
    hp: 70, mp: 15, atk: 24, def: 8, spd: 6,
    expReward: 48, goldReward: 38,
    skills: [{ name: '熔岩爆炸', mpCost: 7, mult: 1.8 }],
  },
  fire_bat: {
    name: '火焰蝙蝠', color: '#ff4410',
    hp: 45, mp: 0, atk: 20, def: 4, spd: 14,
    expReward: 32, goldReward: 25,
    skills: [],
  },
  lava_titan: {
    name: '熔岩巨人', color: '#cc3800',
    hp: 300, mp: 40, atk: 38, def: 20, spd: 4,
    expReward: 260, goldReward: 380,
    skills: [
      { name: '岩浆踩踏', mpCost: 10, mult: 2.2 },
      { name: '熔核护甲', mpCost: 14, mult: 0, defBuff: 15 },
    ],
  },
  cave_fish: {
    name: '地底盲鱼', color: '#5a5a8a',
    hp: 55, mp: 0, atk: 16, def: 8, spd: 6,
    expReward: 38, goldReward: 28,
    skills: [],
  },
  crystal_golem: {
    name: '水晶傀儡', color: '#80c0e0',
    hp: 85, mp: 0, atk: 18, def: 15, spd: 4,
    expReward: 55, goldReward: 45,
    skills: [],
  },
  cave_leviathan: {
    name: '地底蛟龙', color: '#304060',
    hp: 320, mp: 50, atk: 36, def: 19, spd: 5,
    expReward: 280, goldReward: 400,
    skills: [
      { name: '蛟龙翻涌', mpCost: 12, mult: 2.1 },
      { name: '水压碾压', mpCost: 16, mult: 2.5 },
    ],
  },
  cursed_book: {
    name: '诅咒典籍', color: '#8a5a2a',
    hp: 60, mp: 25, atk: 19, def: 6, spd: 5,
    expReward: 42, goldReward: 32,
    skills: [{ name: '邪咒', mpCost: 8, mult: 1.7 }],
  },
  ink_demon: {
    name: '墨灵恶鬼', color: '#2a2a4a',
    hp: 72, mp: 20, atk: 22, def: 9, spd: 9,
    expReward: 50, goldReward: 40,
    skills: [{ name: '墨海淹没', mpCost: 9, mult: 1.9 }],
  },
  cursed_scholar: {
    name: '诅咒学者', color: '#5a2a6a',
    hp: 310, mp: 70, atk: 35, def: 17, spd: 7,
    expReward: 270, goldReward: 390,
    skills: [
      { name: '禁书之术', mpCost: 12, mult: 2.2 },
      { name: '知识护盾', mpCost: 15, mult: 0, defBuff: 13 },
    ],
  },
  mirage_sprite: {
    name: '幻影精灵', color: '#d0a0f0',
    hp: 58, mp: 30, atk: 20, def: 5, spd: 13,
    expReward: 44, goldReward: 34,
    skills: [{ name: '幻象迷踪', mpCost: 8, mult: 1.5 }],
  },
  sand_giant: {
    name: '沙漠巨人', color: '#c09040',
    hp: 90, mp: 0, atk: 26, def: 14, spd: 4,
    expReward: 62, goldReward: 50,
    skills: [],
  },
  mirage_lord: {
    name: '幻影城主', color: '#8040c0',
    hp: 290, mp: 65, atk: 33, def: 16, spd: 9,
    expReward: 250, goldReward: 370,
    skills: [
      { name: '幻影分身', mpCost: 14, mult: 1.8 },
      { name: '幻梦破灭', mpCost: 18, mult: 2.6 },
    ],
  },
  ancient_ent: {
    name: '太古树灵', color: '#4a7a2a',
    hp: 80, mp: 10, atk: 23, def: 12, spd: 4,
    expReward: 55, goldReward: 42,
    skills: [{ name: '根系缠绕', mpCost: 6, mult: 1.6 }],
  },
  spore_mushroom: {
    name: '孢子菌怪', color: '#80a050',
    hp: 62, mp: 18, atk: 18, def: 8, spd: 5,
    expReward: 40, goldReward: 32,
    skills: [{ name: '孢子爆发', mpCost: 7, mult: 1.5 }],
  },
  ancient_treant: {
    name: '太古树人', color: '#2a5010',
    hp: 350, mp: 45, atk: 36, def: 22, spd: 3,
    expReward: 300, goldReward: 420,
    skills: [
      { name: '万年根系', mpCost: 10, mult: 2.0 },
      { name: '太古护盾', mpCost: 16, mult: 0, defBuff: 18 },
    ],
  },
  wraith: {
    name: '幽魂', color: '#6060a0',
    hp: 68, mp: 20, atk: 21, def: 8, spd: 10,
    expReward: 48, goldReward: 38,
    skills: [{ name: '灵魂凝视', mpCost: 7, mult: 1.7 }],
  },
  phantom: {
    name: '幽灵幻影', color: '#8080c0',
    hp: 55, mp: 25, atk: 19, def: 6, spd: 12,
    expReward: 40, goldReward: 30,
    skills: [{ name: '幽灵穿越', mpCost: 8, mult: 1.6 }],
  },
  wraith_king: {
    name: '幽灵王', color: '#3030a0',
    hp: 370, mp: 60, atk: 38, def: 20, spd: 8,
    expReward: 320, goldReward: 450,
    skills: [
      { name: '幽冥审判', mpCost: 14, mult: 2.3 },
      { name: '灵界护盾', mpCost: 18, mult: 0, defBuff: 14 },
    ],
  },
  frost_wolf: {
    name: '冰霜狼', color: '#a0c0e0',
    hp: 70, mp: 0, atk: 24, def: 10, spd: 12,
    expReward: 50, goldReward: 40,
    skills: [],
  },
  ice_golem: {
    name: '冰霜傀儡', color: '#c0e0ff',
    hp: 95, mp: 0, atk: 22, def: 18, spd: 3,
    expReward: 65, goldReward: 52,
    skills: [],
  },
  frost_dragon: {
    name: '冰霜龙', color: '#60a0d0',
    hp: 400, mp: 55, atk: 40, def: 24, spd: 6,
    expReward: 350, goldReward: 500,
    skills: [
      { name: '冰霜吐息', mpCost: 12, mult: 2.4 },
      { name: '冰甲护盾', mpCost: 16, mult: 0, defBuff: 16 },
    ],
  },
  shrine_guardian: {
    name: '封印守护兵', color: '#a08060',
    hp: 100, mp: 20, atk: 28, def: 16, spd: 6,
    expReward: 70, goldReward: 60,
    skills: [{ name: '封印之力', mpCost: 8, mult: 1.8 }],
  },
  heaven_sealer: {
    name: '天帝封印', color: '#ffffff',
    hp: 500, mp: 100, atk: 45, def: 28, spd: 7,
    expReward: 500, goldReward: 1000,
    skills: [
      { name: '天地震怒', mpCost: 15, mult: 2.5 },
      { name: '封印爆裂', mpCost: 20, mult: 3.0 },
      { name: '天帝护盾', mpCost: 25, mult: 0, defBuff: 20 },
    ],
  },

  // ── 高难隐藏 Boss ────────────────────────────────────────
  // 建议在击败对应区域主线 Boss 后再挑战
  death_knight: {
    name: '死亡骑士', color: '#2a0a3a',
    hp: 550, mp: 80, atk: 72, def: 25, spd: 9,
    expReward: 600, goldReward: 800,
    skills: [
      { name: '暗黑斩', mpCost: 18, mult: 2.2 },
      // 魂魄吸取: 造成伤害的同时恢复 20% 最大血量
      { name: '魂魄吸取', mpCost: 25, mult: 1.4, healSelf: 0.20 },
    ],
  },

  chaos_titan: {
    name: '混沌巨神', color: '#8b0000',
    hp: 800, mp: 120, atk: 90, def: 35, spd: 5,
    expReward: 1000, goldReward: 1500,
    skills: [
      { name: '混沌风暴', mpCost: 20, mult: 2.8 },
      { name: '灭世之击', mpCost: 35, mult: 3.5 },
      { name: '混沌护甲', mpCost: 30, mult: 0, defBuff: 25 },
    ],
  },

  void_emperor: {
    name: '虚空帝皇', color: '#1a0050',
    hp: 700, mp: 150, atk: 82, def: 30, spd: 8,
    expReward: 900, goldReward: 1200,
    skills: [
      { name: '虚空裂击', mpCost: 22, mult: 2.5 },
      { name: '次元撕裂', mpCost: 40, mult: 4.0 },
      // 虚空回复: 无伤害, 仅恢复自身
      { name: '虚空汲取', mpCost: 15, mult: 0, healSelf: 0.18 },
    ],
  },
};

function getTileAt(scene, px, py) {
  const map = scene.map;
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (ty < 0 || ty >= map.length) return T.WALL;
  if (tx < 0 || tx >= map[0].length) return T.WALL;
  return map[ty][tx];
}

function isBlocked(scene, x, y, w, h) {
  const corners = [
    [x,         y        ],
    [x + w - 1, y        ],
    [x,         y + h - 1],
    [x + w - 1, y + h - 1],
  ];
  for (const [cx, cy] of corners) {
    if (SOLID.has(getTileAt(scene, cx, cy))) return true;
  }
  return false;
}
