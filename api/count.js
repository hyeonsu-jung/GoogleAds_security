/**
 * CID 제출 건수 조회 — GAS action=count 프록시
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const gasUrl = process.env.GAS_URL;
  if (!gasUrl || gasUrl === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
    return res.status(503).json({
      ok: false,
      count: 0,
      error: 'GAS_URL이 설정되지 않았습니다.',
    });
  }

  const target =
    gasUrl + (gasUrl.includes('?') ? '&' : '?') + 'action=count';

  try {
    const upstream = await fetch(target, { method: 'GET', redirect: 'follow' });
    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        count: 0,
        error: 'Apps Script 응답 오류 (' + upstream.status + ')',
      });
    }
    const text = await upstream.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        ok: false,
        count: 0,
        error: 'Apps Script JSON 파싱 실패',
      });
    }
    return res.status(200).json({
      ok: data.ok !== false,
      count: typeof data.count === 'number' ? data.count : 0,
      error: data.error,
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      count: 0,
      error: err.message || 'Apps Script 연결 실패',
    });
  }
}
