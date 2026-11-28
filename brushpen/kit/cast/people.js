/* cast/people.js — the people of the creative scenes: looks for the figure rig (IB.figure), each a named person who can come back in another scene. In this look people are told apart by hair and clothes, never by face, and a shot carries one to three colours, so a person is a hairstyle, a skin tone and one coloured garment; white clothes are the stage colour itself. Use one as { ...IB.PEOPLE.climber, h: 330, dir: 1, seed: 20 }: h is the figure's height in px, dir the way it faces, seed fixes its line wobble; override a field to change clothes. Clothes and hair were taken from the reference's production stills. Needs ink.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  IB.PEOPLE = {
    chopper: { skin: C.skin[3], top: C.bg, bottom: C.sky, shoe: C.ink, hair: 'curly' },                                    // white tee, sky trousers (acting/axe-windup-smear; variation/hose-wipe-endcard in white trousers)
    lifter: { skin: C.skin[1], top: C.mint, tuck: true, bottom: C.navy, shoe: C.paper, hair: 'bun' },                      // mint tee cut at the waist for deep bends (acting/lift-heavy-box)
    walker: { skin: C.skin[4], top: C.bg, topKind: 'long', bottom: C.ink, shoe: C.paper, hair: 'cap', hat: '#bdbdbd', brim: 'back', tail: true, phones: true, face: { eye: 'shades', mouth: 'flat' } },   // backwards cap, shades, headphones (acting/walk-cycle-bag)
    climber: { skin: C.skin[2], top: C.yellow, topKind: 'long', bottom: C.ink, shoe: C.paper, hair: 'bun' },               // yellow long sleeves (metaphor/bars-rise-climber, bridge-plank-cross)
    neighbour: { skin: C.skin[4], top: C.lavender, topKind: 'long', bottom: C.ink, shoe: C.paper, hair: 'short' },         // lavender long sleeves (metaphor/bridge-plank-cross)
    searcher: { skin: C.skin[2], top: C.navy, topKind: 'long', bottom: C.ink, shoe: C.paper, hair: 'short' },              // navy long sleeves (metaphor/flashlight-finds-file)
    kid: { skin: C.skin[4], top: C.sky, bottom: C.ink, shoe: C.paper, hair: 'curly' },                                     // sky tee (vignette/trick-candle-relight)
    passenger: { skin: C.skin[2], top: C.mint, topKind: 'long', bottom: C.ink, shoe: C.paper, hair: 'pony' },              // mint long sleeves, ponytail (market/chart-rollercoaster-rider)
    trader: { skin: C.skin[1], top: C.yellow, topKind: 'long', bottom: C.ink, shoe: C.paper, hair: 'short' },              // yellow long sleeves (market/watched-chart-drops, trading-desk-row)
    typist: { skin: C.skin[3], top: C.bg, topKind: 'long', bottom: C.charcoal, shoe: C.ink, hair: 'bun' },                 // white shirt, charcoal trousers (market/trading-desk-row)
    lounger: { skin: C.skin[4], top: C.bg, bottom: C.ink, shoe: C.paper, hair: 'curly' },                                  // white tee (market/trading-desk-row)
    // the daily scenes (work, school, street): adults at the wide shot's h 300-360, children at 0.68 of the adult beside them with headK 1.3
    clerk: { skin: C.skin[2], top: C.sky, topKind: 'long', bottom: C.ink, shoe: C.paper, hair: 'short' },                  // sky shirt (work)
    designer: { skin: C.skin[4], top: C.yellow, bottom: C.charcoal, shoe: C.paper, hair: 'bun' },                          // yellow tee (work)
    boss: { skin: C.skin[1], top: C.charcoal, topKind: 'long', bottom: C.charcoal, shoe: C.ink, hair: 'bald' },            // charcoal suit (work)
    teacher: { skin: C.skin[3], top: C.bg, topKind: 'long', bottom: C.navy, shoe: C.ink, hair: 'bun', hairColor: '#8a8a8a' },   // white blouse, grey bun (school)
    pupil: { skin: C.skin[1], top: C.yellow, bottom: C.navy, bottomKind: 'shorts', shoe: C.paper, hair: 'curly', headK: 1.3 },   // yellow tee, shorts (school)
    pupil2: { skin: C.skin[3], top: C.lavender, bottom: C.ink, shoe: C.paper, hair: 'pony', headK: 1.3 },                  // lavender tee, ponytail (school)
    pupil3: { skin: C.skin[4], top: C.mint, bottom: C.charcoal, shoe: C.paper, hair: 'short', headK: 1.3 },                // mint tee (school)
    jogger: { skin: C.skin[2], top: C.mint, bottom: C.ink, bottomKind: 'shorts', shoe: C.paper, hair: 'pony' },            // mint tee, shorts (street)
    commuter: { skin: C.skin[0], top: C.navy, topKind: 'long', bottom: C.ink, shoe: C.paper, hair: 'cap', hat: C.paper },  // navy jacket, white cap (street)
  };

  /* PASSERSBY — thirteen people for a crowd, most of them in one dark suit (top and trousers the same colour), a few with one coloured or white top. Shoes are paper under ink trousers and ink otherwise. In a crowd give each a different walk phase so no two feet land together (market/street-rush-hour). */
  const suit = (c) => ({ top: c, topKind: 'long', bottom: c });
  IB.PASSERSBY = [
    { top: C.lavender, topKind: 'long', bottom: C.ink, hair: 'bun', skin: C.skin[2] },
    { ...suit(C.charcoal), hair: 'short', skin: C.skin[1] },
    { top: C.yellow, topKind: 'long', bottom: C.ink, hair: 'curly', skin: C.skin[4] },
    { ...suit(C.ink), hair: 'bald', skin: C.skin[3] },
    { top: C.bg, topKind: 'long', bottom: C.charcoal, hair: 'pony', skin: C.skin[0] },
    { ...suit(C.ink), hair: 'short', hairColor: '#8a8a8a', skin: C.skin[2] },
    { ...suit(C.charcoal), hair: 'cap', hat: C.paper, skin: C.skin[1] },
    { top: C.bg, topKind: 'long', bottom: C.ink, hair: 'bun', skin: C.skin[4] },
    { top: C.bg, topKind: 'long', bottom: C.charcoal, hair: 'curly', skin: C.skin[3] },
    { ...suit(C.charcoal), hair: 'bun', skin: C.skin[0] },
    { ...suit(C.ink), hair: 'short', skin: C.skin[2] },
    { top: C.bg, topKind: 'long', bottom: C.ink, hair: 'pony', skin: C.skin[1] },
    { ...suit(C.ink), hair: 'cap', hat: C.paper, skin: C.skin[4] },
  ].map((w) => ({ ...w, shoe: w.bottom === C.ink ? C.paper : C.ink }));
})(window);
