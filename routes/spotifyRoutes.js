const express = require('express');
const router = express.Router();

// Fetch full artist details including genre from Deezer
async function getArtistDetails(id) {
  try {
    // Fetch top tracks to derive genre
    const [detailRes, topRes] = await Promise.all([
      fetch(`https://api.deezer.com/artist/${id}`),
      fetch(`https://api.deezer.com/artist/${id}/top?limit=1`)
    ]);
    const detail = await detailRes.json();
    const top = await topRes.json();

    // Genre lives on the album of the top track
    let genre = '';
    if (top.data?.[0]?.album?.id) {
      const albumRes = await fetch(`https://api.deezer.com/album/${top.data[0].album.id}`);
      const album = await albumRes.json();
      genre = album.genres?.data?.map(g => g.name).join(', ') || '';
    }

    return {
      nb_fan: detail.nb_fan || 0,
      nb_album: detail.nb_album || 0,
      link: detail.link || null,
      genre,
    };
  } catch (_) {
    return { nb_fan: 0, nb_album: 0, link: null, genre: '' };
  }
}

// GET /api/spotify/artist?name=ArtistName
router.get('/artist', async (req, res) => {
  const { name } = req.query;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Query param `name` is required (min 2 chars)' });
  }

  try {
    const deezerRes = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=6`
    );

    if (!deezerRes.ok) {
      return res.status(deezerRes.status).json({ error: 'Deezer API error' });
    }

    const data = await deezerRes.json();
    const items = (data.data || []).filter(a => a.name);

    if (items.length === 0) return res.json({ artists: [] });

    // Enrich top 6 results with genre & full details in parallel
    const enriched = await Promise.all(
      items.map(async (a) => {
        const details = await getArtistDetails(a.id);
        const fans = details.nb_fan || a.nb_fan || 0;
        const albums = details.nb_album || 0;

        // Auto-generate a bio from available data
        let bio = `${a.name} is a music artist`;
        if (details.genre) bio += ` known for ${details.genre}`;
        if (fans > 0) bio += `. Has ${fans.toLocaleString()} fans on Deezer`;
        if (albums > 0) bio += ` and ${albums} album${albums > 1 ? 's' : ''}`;
        bio += '.';

        return {
          id: String(a.id),
          name: a.name,
          image: a.picture_xl || a.picture_big || a.picture_medium || a.picture || null,
          imageMedium: a.picture_medium || a.picture || null,
          imageSmall: a.picture_small || a.picture || null,
          genres: details.genre ? details.genre.split(', ') : [],
          genre: details.genre || '',
          followers: fans,
          albums,
          bio,
          deezerUrl: details.link || a.link || null,
          spotifyUrl: null,
        };
      })
    );

    res.json({ artists: enriched });
  } catch (err) {
    console.error('[Artist Route]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
