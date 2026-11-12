/** Short public catalog cache — browsers/CDNs can reuse list/home payloads briefly */
const publicCache = (seconds = 60) => (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
  }
  next();
};

module.exports = publicCache;
