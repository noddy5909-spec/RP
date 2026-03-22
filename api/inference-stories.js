const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Supabase URL/키가 설정되지 않았습니다. .env.local 을 확인해 주세요.',
      });
    }

    const body = req.body || {};
    const passage_title =
      body.passage_title != null ? String(body.passage_title).slice(0, 500) : '';
    const step1 = body.step1 != null ? String(body.step1) : '';
    const step2 = body.step2 != null ? String(body.step2) : '';
    const step3 = body.step3 != null ? String(body.step3) : '';

    if (!passage_title.trim() && !step1.trim() && !step2.trim() && !step3.trim()) {
      return res.status(400).json({ error: '저장할 내용이 없습니다.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('inference_stories').insert({
      passage_title: passage_title.trim() || '(제목 없음)',
      step1,
      step2,
      step3,
    });

    if (error) {
      console.error('[inference-stories]', error);
      return res.status(500).json({
        error: error.message || '저장에 실패했습니다. Supabase 테이블·RLS 설정을 확인해 주세요.',
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[inference-stories]', e);
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
};
