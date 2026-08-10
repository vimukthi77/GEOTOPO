import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'earthwork_optimization_secret_key_2026_jwt_token_secure_987654321';

// Edge-compatible JWT verifier using Web Crypto API
async function verifyJwtEdge(token: string, secret: string): Promise<{ email: string; role: 'admin' | 'user' } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Decode payload
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);
    
    // Check expiration
    if (payload.exp && Date.now() / 1000 >= payload.exp) {
      return null;
    }
    
    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Convert signature from URL-safe base64 to binary array
    const signatureStr = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const signatureBin = atob(signatureStr);
    const sigBuf = new Uint8Array(signatureBin.length);
    for (let i = 0; i < signatureBin.length; i++) {
      sigBuf[i] = signatureBin.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuf,
      data
    );
    
    return isValid ? { email: payload.email, role: payload.role } : null;
  } catch (e) {
    console.error('Edge JWT verification error:', e);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  return NextResponse.next();
}

// Matching paths
export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/users/:path*',
    '/api/survey/:path*',
  ],
};
