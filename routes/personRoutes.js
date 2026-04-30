const express = require('express');
const router = express.Router();

// ── Spotify Token Cache ───────────────────────────────────────────────────────
let _spotifyToken = null;
let _spotifyTokenExpiry = 0;

async function getSpotifyToken() {
  if (_spotifyToken && Date.now() < _spotifyTokenExpiry - 60000) return _spotifyToken;
  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || 'Spotify auth failed');
  _spotifyToken = data.access_token;
  _spotifyTokenExpiry = Date.now() + data.expires_in * 1000;
  return _spotifyToken;
}

// ── Person-filter helpers (for Wikipedia) ────────────────────────────────────
const PERSON_SIGNALS = [
  'born', 'died', 'rapper', 'singer', 'musician', 'songwriter', 'vocalist',
  'composer', 'dj', 'disc jockey', 'actor', 'actress', 'filmmaker', 'director',
  'comedian', 'stand-up', 'athlete', 'cricketer', 'footballer', 'sportsperson',
  'politician', 'minister', 'senator', 'president', 'prime minister',
  'motivational speaker', 'public speaker', 'life coach', 'author',
  'entrepreneur', 'ceo', 'founder', 'businessperson', 'executive',
  'professor', 'scientist', 'researcher', 'doctor', 'activist', 'artist',
  'painter', 'photographer', 'dancer', 'choreographer', 'model', 'band', 'group', 'duo', 'trio', 'collective'
];
const NON_PERSON_SIGNALS = [
  'city', 'town', 'village', 'municipality', 'district', 'province', 'state',
  'country', 'nation', 'continent', 'island', 'river', 'mountain', 'lake',
  'building', 'tower', 'stadium', 'airport', 'university', 'school', 'hospital',
  'film', 'movie', 'album', 'song', 'track', 'television series', 'tv series',
  'book', 'novel', 'video game', 'software', 'company', 'organization',
  'political party'
];
function isPerson(description = '', extract = '') {
  const text = (description + ' ' + extract.substring(0, 200)).toLowerCase();
  if (NON_PERSON_SIGNALS.some(s =>
    text.startsWith(s) || text.includes(` is a ${s}`) || text.includes(` is an ${s}`)
  )) return false;
  if (/\(born \d{4}/.test(text)) return true;
  return PERSON_SIGNALS.some(s => text.includes(s));
}

function inferRole(description = '', extract = '') {
  const text = (description + ' ' + extract).toLowerCase();
  if (text.includes('rapper') || text.includes('hip-hop') || text.includes('hip hop')) return 'Musician';
  if (text.includes('singer') || text.includes('vocalist') || text.includes('pop star')) return 'Musician';
  if (text.includes('musician') || text.includes('composer') || text.includes('songwriter')) return 'Musician';
  if (text.includes('dj') || text.includes('disc jockey')) return 'DJ';
  if (text.includes('band') || text.includes('group') || text.includes('duo')) return 'Musician';
  if (text.includes('motivational speaker') || text.includes('public speaker') || text.includes('life coach')) return 'Speaker';
  if (text.includes('keynote') || text.includes('ted talk') || text.includes('author and speaker')) return 'Keynote';
  if (text.includes('actor') || text.includes('actress') || text.includes('filmmaker')) return 'Performer';
  if (text.includes('comedian') || text.includes('stand-up')) return 'Performer';
  if (text.includes('cricketer') || text.includes('footballer') || text.includes('athlete')) return 'Performer';
  if (text.includes('entrepreneur') || text.includes('ceo') || text.includes('founder')) return 'Keynote';
  if (text.includes('professor') || text.includes('scientist') || text.includes('researcher')) return 'Speaker';
  if (text.includes('politician') || text.includes('minister') || text.includes('president')) return 'Keynote';
  return 'Speaker';
}

function inferExpertise(description = '', extract = '') {
  const text = (description + ' ' + extract).toLowerCase();
  if (text.includes('rapper') || text.includes('hip-hop') || text.includes('hip hop')) return 'Hip-Hop / Rap';
  if (text.includes('pop')) return 'Pop Music';
  if (text.includes('rock')) return 'Rock Music';
  if (text.includes('classical')) return 'Classical Music';
  if (text.includes('r&b') || text.includes('rhythm and blues')) return 'R&B';
  if (text.includes('jazz')) return 'Jazz';
  if (text.includes('motivational') || text.includes('life coach') || text.includes('self-help')) return 'Motivational Speaking';
  if (text.includes('leadership')) return 'Leadership & Management';
  if (text.includes('entrepreneur') || text.includes('startup')) return 'Entrepreneurship';
  if (text.includes('technology') || text.includes('software')) return 'Technology & Innovation';
  if (text.includes('cricketer') || text.includes('cricket')) return 'Cricket';
  if (text.includes('football') || text.includes('soccer')) return 'Football';
  if (text.includes('politics') || text.includes('politician')) return 'Politics & Public Affairs';
  if (text.includes('comedy') || text.includes('comedian')) return 'Comedy & Entertainment';
  return '';
}

// ── Spotify search enriched with Deezer (fans) and iTunes (genre) ──
async function searchSpotify(name) {
  const token = await getSpotifyToken();
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Spotify search HTTP ${res.status}`);
  const data = await res.json();
  const items = (data.artists?.items || []).filter(a => a.name && a.images?.length > 0);

  // Spotify no longer returns followers or genres for standard API tiers,
  // so we enrich the top results with Deezer (for fans) and iTunes (for genre)
  const enriched = await Promise.all(items.map(async (a) => {
    // Fire off Deezer and iTunes requests in parallel for this artist
    const [deezerRes, itunesRes] = await Promise.all([
      fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(a.name)}&limit=1`).catch(() => null),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(a.name)}&entity=musicArtist&limit=1`).catch(() => null)
    ]);

    let fans = 0;
    if (deezerRes && deezerRes.ok) {
      const dData = await deezerRes.json();
      if (dData.data?.[0]?.nb_fan) fans = dData.data[0].nb_fan;
    }

    let genreStr = '';
    if (itunesRes && itunesRes.ok) {
      const iData = await itunesRes.json();
      if (iData.results?.[0]?.primaryGenreName) genreStr = iData.results[0].primaryGenreName;
    }

    // Fallback to Spotify genres if they ever return it again
    if (!genreStr && a.genres?.length) {
      genreStr = a.genres.slice(0, 2).map(g => g.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ');
    }
    const finalGenre = genreStr || 'Music';

    return {
      id: `spotify_${a.id}`,
      name: a.name,
      description: `${finalGenre} · ${fans.toLocaleString()} fans`,
      bio: `${a.name} is a ${finalGenre.toLowerCase()} artist with ${fans.toLocaleString()} fans.`,
      image: a.images?.[0]?.url || null,
      role: 'Musician',
      expertise: finalGenre,
      genre: finalGenre,
      followers: fans,
      spotifyUrl: a.external_urls?.spotify || null,
      source: 'spotify',
    };
  }));

  return enriched;
}



// ── Wikipedia search (speakers, athletes, etc.) ───────────────────────────────
async function searchWikipedia(name) {
  const searchRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(name)}&limit=8&format=json&origin=*`
  );
  const [, titles, , urls] = await searchRes.json();
  if (!titles?.length) return [];

  const summaries = await Promise.all(
    titles.slice(0, 8).map(async (title, i) => {
      try {
        const slug = encodeURIComponent(title.replace(/ /g, '_'));
        const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`);
        const page = await r.json();
        if (page.type === 'disambiguation') return null;

        const description = page.description || '';
        const extract = page.extract || '';
        if (!isPerson(description, extract)) return null;

        const role = inferRole(description, extract);
        const expertise = inferExpertise(description, extract);
        const bio = extract.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

        return {
          id: `wiki_${page.pageid || i}`,
          name: page.title,
          description,
          bio: bio || description,
          image: page.originalimage?.source || page.thumbnail?.source || null,
          role,
          expertise,
          genre: (role === 'Musician' || role === 'DJ') ? expertise : '',
          wikiUrl: urls[i] || page.content_urls?.desktop?.page || null,
          source: 'wikipedia',
        };
      } catch (_) { return null; }
    })
  );
  return summaries.filter(Boolean);
}

// ── Combined endpoint ─────────────────────────────────────────────────────────
// GET /api/person/search?name=...
router.get('/search', async (req, res) => {
  const { name } = req.query;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: '`name` param required (min 2 chars)' });
  }

  try {
    const [musicArtists, wikiPeople] = await Promise.all([
      searchSpotify(name).catch(() => []),
      searchWikipedia(name).catch(() => []),
    ]);

    // Merge Wikipedia bio/description into Spotify artists ONLY if they are musicians
    const mergedWikiIds = new Set();
    const mergedMusicArtists = musicArtists.map(artist => {
      const cleanArtistName = artist.name.toLowerCase();
      
      // Look for a Wikipedia entry that matches the name (ignoring text in parens like "(singer)")
      // AND explicitly describes a musician or DJ.
      const match = wikiPeople.find(p => 
        p.name.replace(/\s*\(.*?\)\s*/g, '').toLowerCase() === cleanArtistName && 
        (p.role === 'Musician' || p.role === 'DJ')
      );

      if (match) {
        artist.bio = match.bio;
        // Combine Wikipedia description with the followers count we fetched
        artist.description = `${match.description} · ${artist.followers.toLocaleString()} fans`;
        mergedWikiIds.add(match.id);
      }
      return artist;
    });

    // Keep Wikipedia results that weren't merged into a Spotify artist
    // This ensures politicians/speakers with the exact same name as a singer (e.g. Imran Khan)
    // are still returned as separate results.
    const uniqueWiki = wikiPeople.filter(p => !mergedWikiIds.has(p.id));

    const people = [...mergedMusicArtists.slice(0, 4), ...uniqueWiki.slice(0, 4)];
    res.json({ people });
  } catch (err) {
    console.error('[Person Search]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
