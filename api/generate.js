export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { songs } = req.body;

    if (!songs || typeof songs !== 'string') {
        return res.status(400).json({ error: '올바른 노래 목록을 입력해 주세요.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
    }

    const prompt = `
사용자가 좋아하는 노래 목록은 다음과 같습니다:
${songs}

위 노래들을 바탕으로 다음 구성을 따라 답변을 작성해 주세요:
1. [음악 취향 분석]: 입력된 노래들의 장르, 분위기, 가창 스타일, 멜로디적 특징 등을 종합적으로 분석해 주세요.
2. [추천 노래 목록]: 사용자가 좋아할 만한 새로운 노래 5곡을 추천해 주세요. (곡 제목 - 아티스트 형태 및 추천 이유 간단히 언급)
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error?.message || 'Gemini API 호출에 실패했습니다.';
            return res.status(response.status).json({ error: errorMessage });
        }

        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return res.status(500).json({ error: '결과를 생성할 수 없습니다.' });
        }

        return res.status(200).json({ result: generatedText });
    } catch (error) {
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
}