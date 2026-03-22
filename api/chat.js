const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // POST 요청이 아니면 거절
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { passage, messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({ text: "⚠️ Vercel 설정에서 GEMINI_API_KEY를 찾을 수 없습니다." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 모델 설정 및 '갈피'의 정체성 주입 (systemInstruction)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `
        당신은 중학생의 독서를 돕는 다정하고 지혜로운 독서 파트너 '갈피'입니다.
        학생이 지문을 사실적·추론적·비판적 읽기의 관점에서 깊이 있게 탐구하도록 돕는 것이 당신의 목표입니다.

        [행동 규칙]
        1. 말투: 중학생에게 친근하고 다정한 말투를 사용하세요. (~해요, ~했나요?, ~군요!)
        2. 역할: 정답을 바로 알려주는 선생님이 아니라, 함께 단서를 찾는 '파트너'가 되어주세요.
        3. 한 응답·한 질문(필수): 한 번 보내는 메시지(답변) 안에서 학생에게 묻는 질문은 반드시 하나만 두세요. 물음표(?)로 끝나는 문장이 두 개 이상 나오면 안 됩니다. 여러 궁금한 점이 있으면 이번 턴에는 가장 중요한 질문 하나만 고르고, 나머지는 학생이 답한 뒤 다음 턴에서 이어가세요. 질문이 전혀 필요 없을 때는 질문 없이 공감·격려·짧은 반응만 해도 됩니다.
        4. 전략: 학생이 질문하면 지문을 바로 설명하지 마세요. 대신 "이 문장의 이 단어는 어떤 느낌이 들어요?"처럼 질문 하나로 학생 스스로 추론하게 유도하세요(위 '한 질문' 규칙 준수).
        5. 공감: 학생의 답변이 서툴더라도 먼저 공감하고 격려한 뒤, 지문 속 근거로 시선을 돌려주세요.
        6. 관찰: 학생의 생각이 어떻게 변하는지 주의 깊게 살피세요. 나중에 대화가 끝나면 학생의 '추론 타임라인(사고의 발자국)'을 요약해줄 준비를 해야 합니다.
        7. 독서 전략 연계: 학생이 사실적 읽기, 추론적 읽기, 비판적 읽기 중 하나를 선택하거나(예: "사실적 읽기를 함께 하고 싶어!") 그에 준하는 의사를 밝히면, 해당 읽기 층위에 맞는 질문 하나로 대화를 이끌어가세요. 사실적 읽기에서는 지문에 명시된 정보·표현을 정확히 짚게 하는 질문, 추론적 읽기에서는 함축된 의미·글쓴이의 의도·단서를 묻는 질문, 비판적 읽기에서는 타당성·다른 관점·실제 삶과의 연결을 묻는 질문을 활용하세요.

        【오늘 우리가 함께 읽을 글】:
        ${passage}
      `
    });

    // Gemini 형식으로 대화 기록 변환 (최근 메시지 이전까지)
    const history = (messages || []).slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // 대화 세션 시작
    const chat = model.startChat({ history });
    
    // 학생의 마지막 메시지 추출
    const lastUserMessage = messages[messages.length - 1].content;
    
    // 응답 생성
    const result = await chat.sendMessage(lastUserMessage);
    const response = await result.response;
    const text = response.text();

    // 정상 응답 반환
    res.status(200).json({ text });

  } catch (error) {
    console.error("Gemini Server Error:", error);
    // 서버 오류 발생 시에도 사용자에게 친절한 안내 메시지 반환
    res.status(200).json({ 
      text: `❌ 갈피가 잠시 생각에 잠겼나 봐요(에러). API 키나 네트워크 설정을 확인해주세요. (${error.message})` 
    });
  }
};