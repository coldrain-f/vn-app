// Claude API service
import { Settings } from '../types';

interface ClaudeResponse {
    content: Array<{ text: string }>;
}

export const callClaudeAPI = async (
    prompt: string,
    apiKey: string,
    model: string = 'claude-sonnet-4-5-20250929'
): Promise<string | null> => {
    if (!apiKey) {
        console.error('API key not set');
        return null;
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API call failed');
        }

        const data: ClaudeResponse = await response.json();
        return data.content[0].text;
    } catch (error) {
        console.error('Claude API Error:', error);
        return null;
    }
};

/**
 * Generate reading (furigana) for Japanese sentence
 * 일본어 문장에 후리가나 생성
 * 
 * 프롬프트 번역:
 * - 아래 문장에 후리가나를 추가하세요.
 * - 이 문장에서 발견된 사전 단어들 (필수): [사전에 있는 단어 = 반드시 해당 읽기 사용]
 * - 형식: 한자 바로 뒤에 대괄호로 읽기 표기 (예: 世界線[せかいせん])
 * - 결과만 출력, 설명 금지
 */
export const generateReading = async (
    expression: string,
    readingDict: Record<string, string>,
    apiKey: string,
    model: string
): Promise<string | null> => {
    // Filter dictionary to only words that appear in this sentence
    const matchingWords: { word: string; reading: string }[] = [];
    for (const [word, reading] of Object.entries(readingDict)) {
        if (expression.includes(word)) {
            matchingWords.push({ word, reading });
        }
    }

    let dictSection = '';
    let exampleSection = '';
    if (matchingWords.length > 0) {
        dictSection = `
## DICTIONARY WORDS FOUND IN THIS SENTENCE (CRITICAL)

${matchingWords.map(({ word, reading }) => `⚠️ "${word}" → MUST be: ${word}[${reading}]`).join('\n')}

`;
        // Create few-shot example using actual dictionary words
        const exampleWord = matchingWords[0];
        exampleSection = `
## EXAMPLE (Follow this pattern)

Dictionary says: "${exampleWord.word}" → ${exampleWord.reading}
Input: 「${exampleWord.word}は重要だ」
Correct output: 「${exampleWord.word}[${exampleWord.reading}]は重要[じゅうよう]だ」

Notice: "${exampleWord.word}" uses EXACTLY the dictionary reading "${exampleWord.reading}".

`;
    }

    const prompt = `## SENTENCE TO PROCESS

${expression}

${dictSection}${exampleSection}## TASK

Add furigana to the kanji in the sentence above.

## RULES

1. ${matchingWords.length > 0 ? `For dictionary words above: Copy the EXACT format shown (word[reading]).` : 'Add readings based on context (Steins;Gate visual novel).'}
2. Format: kanji[reading]. Example: 食[た]べる
3. Compound kanji: 今日[きょう]
4. Keep hiragana/katakana unchanged.
5. Output ONLY the result.

## OUTPUT:`;

    const result = await callClaudeAPI(prompt, apiKey, model);
    return result ? result.replace(/[\(（](.+?)[\)）]/g, '[$1]').trim() : null;
};

/**
 * Generate meaning (Korean translation) for Japanese sentence
 * 일본어 문장을 한국어로 번역
 * 
 * 프롬프트 번역:
 * - 아래 문장을 한국어로 번역하세요.
 * - Steins;Gate 게임의 말투와 분위기를 반영.
 * - 자연스러운 한국어로, 번역만 출력.
 */
export const generateMeaning = async (
    expression: string,
    readingDict: Record<string, string>,
    apiKey: string,
    model: string
): Promise<string | null> => {
    // Filter dictionary to only words that appear in this sentence
    const matchingWords: { word: string; reading: string }[] = [];
    for (const [word, reading] of Object.entries(readingDict)) {
        if (expression.includes(word)) {
            matchingWords.push({ word, reading });
        }
    }

    let dictSection = '';
    if (matchingWords.length > 0) {
        dictSection = `
## PROPER NOUNS IN THIS SENTENCE

These are special terms from the sentence above:
${matchingWords.map(({ word, reading }) => `- ${word} (읽기: ${reading})`).join('\n')}

`;
    }

    const prompt = `## SENTENCE TO TRANSLATE

${expression}

${dictSection}## TASK

Translate the sentence above into natural Korean.

## RULES

1. Context: Steins;Gate visual novel. Maintain tone and mood.
2. Use natural, fluent Korean. Avoid literal translations.
3. Preserve emotional nuance.
4. Output ONLY the Korean translation. No explanations.

## OUTPUT (Korean translation only):`;

    return callClaudeAPI(prompt, apiKey, model);
};

/**
 * Generate explanation for Japanese sentence
 * 일본어 문장 해설 생성
 * 
 * 프롬프트 번역:
 * - 아래 문장을 해설하세요.
 * - 사전에 있는 단어는 반드시 해당 읽기를 사용.
 * - 모든 설명은 한국어로.
 */
export const generateExplanation = async (
    expression: string,
    readingDict: Record<string, string>,
    apiKey: string,
    model: string
): Promise<string | null> => {
    // Filter dictionary to only words that appear in this sentence
    const matchingWords: { word: string; reading: string }[] = [];
    for (const [word, reading] of Object.entries(readingDict)) {
        if (expression.includes(word)) {
            matchingWords.push({ word, reading });
        }
    }

    let dictSection = '';
    if (matchingWords.length > 0) {
        dictSection = `
## DICTIONARY WORDS IN THIS SENTENCE (USE THESE EXACT READINGS)

${matchingWords.map(({ word, reading }) => `⚠️ "${word}" → MUST use reading: ${reading}`).join('\n')}

`;
    }

    const prompt = `## SENTENCE TO EXPLAIN

${expression}

${dictSection}## TASK

Explain this Japanese sentence for Korean learners. Write ALL in Korean.

## OUTPUT FORMAT (Do NOT use markdown ** formatting)

【문장】(Copy original sentence)
【읽기】(Add furigana in brackets []. ${matchingWords.length > 0 ? 'Use dictionary readings above for marked words.' : ''})
【번역】(Korean translation)
【문법】(1-2 key grammar points, briefly)
【어휘】(2-3 important words with reading and meaning)

## CONTEXT: Steins;Gate visual novel

## OUTPUT (in Korean, following format above):`;

    return callClaudeAPI(prompt, apiKey, model);
};

/**
 * Verify reading (furigana) for Japanese sentence
 * 일본어 문장의 읽기(후리가나) 검증
 * 
 * 프롬프트 번역:
 * - 주어진 후리가나가 정확한지 확인.
 * - 사전에 있는 읽기는 반드시 정답으로 처리.
 * - 모든 응답은 한국어로.
 */
export const verifyReading = async (
    expression: string,
    reading: string,
    readingDict: Record<string, string>,
    apiKey: string,
    model: string
): Promise<{ isCorrect: boolean; correctedReading?: string; details: string }> => {
    // Filter dictionary to only words that appear in this sentence
    const matchingWords: { word: string; reading: string }[] = [];
    for (const [word, dictReading] of Object.entries(readingDict)) {
        if (expression.includes(word)) {
            matchingWords.push({ word, reading: dictReading });
        }
    }

    let dictSection = '';
    if (matchingWords.length > 0) {
        dictSection = `
## DICTIONARY WORDS IN THIS SENTENCE (ALWAYS CORRECT)

These readings are user-defined and MUST be considered correct:

${matchingWords.map(({ word, reading: r }) => `✓ "${word}" → ${r} (ALWAYS CORRECT)`).join('\n')}

If the input uses these readings, they are CORRECT. Do NOT mark them as errors.

`;
    }

    const prompt = `## INPUT TO VERIFY

Original: ${expression}
Reading: ${reading}

${dictSection}## TASK

Verify if the reading above is correct. Respond in Korean.

## RULES

1. ${matchingWords.length > 0 ? 'Dictionary words above are ALWAYS correct. Do not mark them as errors.' : 'Check standard Japanese reading accuracy.'}
2. Consider context: Steins;Gate visual novel.
3. Use brackets [] only, never parentheses () or markdown **.

## OUTPUT FORMAT

Line 1: "검증 결과: OK" or "검증 결과: NG"
Line 2 (if NG): "수정안: [corrected reading]"
Line 3+: Brief explanation (Korean)

## YOUR VERIFICATION:`;

    const result = await callClaudeAPI(prompt, apiKey, model);

    if (!result) {
        return { isCorrect: false, details: 'API 오류' };
    }

    const isCorrect = result.includes('검증 결과: OK') || result.includes('검증 결과: **OK');

    let correctedReading: string | undefined;
    const correctionMatch = result.match(/수정안[：:]\s*(.+?)(?:\n|$)/);
    if (correctionMatch) {
        correctedReading = correctionMatch[1].trim().replace(/[\(（](.+?)[\)）]/g, '[$1]');
    }

    return { isCorrect, correctedReading, details: result };
};

/**
 * Generate Korean explanation for Japanese dictionary entry
 * 일일사전 설명에 사용된 어려운 단어들을 한국어로 풀이
 */
export const generateDictExplanation = async (
    word: string,
    dictHtml: string,
    apiKey: string,
    model: string
): Promise<string | null> => {
    // Strip HTML tags for cleaner processing
    const plainText = dictHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 2000); // Limit to avoid token overflow

    const prompt = `## 사전 정보

단어: ${word}
사전 내용:
${plainText}

## 목적

일본어 학습자가 일일사전을 읽다가 모르는 단어가 있을 때 이해를 돕기 위함

## 규칙

1. 사전 설명에 사용된 어려운 단어나 표현을 찾아 한국어로 풀이
2. 형식: 「単語(たんご)」 = 한국어 뜻 (읽기를 괄호 안에 히라가나로 표기)
3. 의태어/의성어는 느낌을 함께 설명
4. 마지막에 전체 의미를 한 줄로 요약
5. 마크다운 서식 사용 금지 (**, ##, - 등)
6. 150자 이내로 간결하게

## 출력:`;

    return callClaudeAPI(prompt, apiKey, model);
};
