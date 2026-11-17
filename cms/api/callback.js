import handler from './auth.js';
export default function callback(req, res) {
  req.query = { ...req.query, action: 'callback' };
  return handler(req, res);
}
