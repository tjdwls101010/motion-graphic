/* cast/athletes.js — players for the ball games: team kits (IB.KITS) worn by the rig (IB.figure), a set of faces to put in them (IB.PLAYERS), and IB.athlete to dress one. A side has one colour, as everyone in this look does: a football kit is a coloured shirt with shorts and pulled-up socks, a basketball kit a sleeveless vest and knee-long shorts with low white socks. Two teams and a keeper make the shot's colours, so the crowd and the pitch stay grey and white. Needs ink.js (the palette); dressed figures need figure.js. */
(function (g) {
  const IB = g.IB, C = IB.C;

  IB.KITS = {
    soccer: {
      home: { top: C.navy, bottom: C.bg, bottomKind: 'shorts', socks: C.navy, shoe: C.ink },                       // navy shirt, white shorts
      away: { top: C.yellow, bottom: C.ink, bottomKind: 'shorts', socks: C.yellow, shoe: C.paper },                 // yellow shirt, black shorts
      keeper: { top: C.mint, topKind: 'long', bottom: C.ink, bottomKind: 'shorts', socks: C.mint, shoe: C.ink, gloves: C.paper },   // a keeper's colour no outfield player wears, white gloves
      ref: { top: C.ink, bottom: C.ink, bottomKind: 'shorts', socks: C.ink, shoe: C.ink },
    },
    basketball: {
      home: { top: C.yellow, topKind: 'tank', bottom: C.yellow, bottomKind: 'shorts', shortsLen: 0.9, socks: C.paper, sockHi: 0.3, shoe: C.paper },
      away: { top: C.lavender, topKind: 'tank', bottom: C.lavender, bottomKind: 'shorts', shortsLen: 0.9, socks: C.paper, sockHi: 0.3, shoe: C.ink },
    },
  };

  /* PLAYERS — eight faces (skin and hair) to put in a kit, so a team does not look cloned. */
  IB.PLAYERS = [
    { skin: C.skin[4], hair: 'short' }, { skin: C.skin[1], hair: 'curly' }, { skin: C.skin[2], hair: 'bald' }, { skin: C.skin[3], hair: 'bun' },
    { skin: C.skin[0], hair: 'short', hairColor: '#8a8a8a' }, { skin: C.skin[4], hair: 'curly' }, { skin: C.skin[2], hair: 'pony' }, { skin: C.skin[1], hair: 'short' },
  ];

  /* athlete(sport, side, i, more) — player i (0-7) of IB.PLAYERS in IB.KITS[sport][side], with `more` (h, dir, seed ...) laid over it. */
  IB.athlete = (sport, side, i = 0, more = {}) => ({ ...IB.PLAYERS[i % IB.PLAYERS.length], ...IB.KITS[sport][side], ...more });
})(window);
