import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/installer/qstash/validate
 *
 * Valida o token do QStash fazendo uma request à API.
 * Usado no step 4 do wizard de instalação.
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    console.log('[v0] QStash validation API called', {
      hasToken: !!token,
      tokenType: typeof token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 10) + '...',
    });

    // Validação básica
    if (!token || typeof token !== 'string') {
      console.log('[v0] QStash validation failed - missing token');
      return NextResponse.json(
        { error: 'Token QStash é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato antes de chamar API
    const trimmedToken = token.trim();
    const isValidFormat = 
      trimmedToken.startsWith('eyJ') || 
      trimmedToken.startsWith('qstash_') ||
      trimmedToken.split('.').length === 3;

    if (!isValidFormat) {
      console.log('[v0] QStash validation failed - invalid format');
      return NextResponse.json(
        { error: 'Formato de token inválido. Use um token que começa com "eyJ" ou "qstash_"' },
        { status: 400 }
      );
    }

    console.log('[v0] QStash token format valid, testing with API');

    // Tentar primeiro endpoint mais permissivo
    let qstashRes = await fetch('https://qstash.upstash.io/v2/events', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${trimmedToken}`,
      },
    });

    console.log('[v0] QStash /v2/events response', {
      status: qstashRes.status,
      statusText: qstashRes.statusText,
    });

    // Se /events falhar com 403 ou 404, tentar /schedules como fallback
    if (qstashRes.status === 403 || qstashRes.status === 404) {
      console.log('[v0] QStash trying fallback endpoint /v2/schedules');
      
      qstashRes = await fetch('https://qstash.upstash.io/v2/schedules', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${trimmedToken}`,
        },
      });

      console.log('[v0] QStash /v2/schedules response', {
        status: qstashRes.status,
        statusText: qstashRes.statusText,
      });
    }

    if (!qstashRes.ok) {
      if (qstashRes.status === 401) {
        console.log('[v0] QStash validation failed - unauthorized (401)');
        return NextResponse.json(
          { error: 'Token QStash inválido. Verifique se copiou o token completo do console Upstash.' },
          { status: 401 }
        );
      }

      if (qstashRes.status === 403) {
        console.log('[v0] QStash validation failed - forbidden (403)');
        return NextResponse.json(
          { error: 'Token sem permissões. Certifique-se de usar o QSTASH_TOKEN (não o Current/Next Signing Key).' },
          { status: 403 }
        );
      }

      const errorText = await qstashRes.text().catch(() => '');
      console.log('[v0] QStash validation failed', {
        status: qstashRes.status,
        errorText,
      });

      return NextResponse.json(
        { error: `Erro ao validar: ${errorText || qstashRes.statusText}` },
        { status: qstashRes.status }
      );
    }

    console.log('[v0] QStash validation successful');

    return NextResponse.json({
      valid: true,
      message: 'Token QStash válido',
    });

  } catch (error) {
    console.error('[v0] QStash validation error (exception)', error);
    return NextResponse.json(
      { error: 'Erro de conexão ao validar token. Verifique sua internet e tente novamente.' },
      { status: 500 }
    );
  }
}
