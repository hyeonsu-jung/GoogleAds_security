/**
 * GAS 연동 설정 여부만 반환 (URL은 노출하지 않음)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ configured: false });
  }

  const gasUrl = process.env.GAS_URL;
  const configured = Boolean(
    gasUrl && gasUrl !== 'YOUR_APPS_SCRIPT_WEB_APP_URL'
  );

  return res.status(200).json({ configured });
}
