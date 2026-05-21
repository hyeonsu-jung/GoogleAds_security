/**
 * 시트 제출 프록시 — GAS_URL은 Vercel Environment(서버 전용)에만 존재합니다.
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
      error: 'GAS_URL이 설정되지 않았습니다. Vercel 프로젝트 Environment에 추가해 주세요.',
    });
  }

  const allowed = ['dept', 'team', 'mcc', 'cid', 'chk_pw', 'chk_mfa', 'chk_domain', 'chk_owner', 'score'];
  const params = new URLSearchParams();
  for (const key of allowed) {
    const value = req.query[key];
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const target = gasUrl + (gasUrl.includes('?') ? '&' : '?') + params.toString();

  try {
    const upstream = await fetch(target, { method: 'GET', redirect: 'follow' });
    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        error: 'Apps Script 응답 오류 (' + upstream.status + ')',
      });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      error: err.message || 'Apps Script 연결 실패',
    });
  }
}
