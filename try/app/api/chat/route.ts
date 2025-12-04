import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    // Hanya gunakan environment variable - lebih aman
    const nvidiaApiKey = process.env.NVIDIA_API_KEY;

    if (!nvidiaApiKey) {
      return NextResponse.json(
        { error: 'API key tidak dikonfigurasi di server.' },
        { status: 500 }
      );
    }

    console.log('Sending request to NVIDIA NIM API...');

    // NVIDIA NIM API call
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaApiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah asisten AI bisnis untuk UMKM Indonesia. Berikan saran praktis dan actionable berdasarkan data bisnis berikut:

${context}

Berikan jawaban dalam Bahasa Indonesia yang mudah dipahami. Fokus pada:
1. Analisis yang relevan dengan pertanyaan
2. Rekomendasi konkret dan praktis
3. Angka dan data spesifik jika relevan
4. Tips yang bisa langsung diterapkan`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('NVIDIA API Error:', response.status, errorData);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API key tidak valid.' },
          { status: 401 }
        );
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `Gagal mendapatkan respons dari AI (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Maaf, tidak dapat memproses permintaan.';

    console.log('NVIDIA NIM API response received successfully');
    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
