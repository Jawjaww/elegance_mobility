import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy robuste pour contourner les restrictions CORS des tuiles vectorielles
 * et gérer les différents formats de tuiles (pbf, mvt, etc.)
 * 
 * Ce proxy est compatible avec tous les environnements (dev, prod, preview)
 */

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tileUrl = url.searchParams.get('url');

  if (!tileUrl) {
    return NextResponse.json({ error: 'URL parameter missing' }, { status: 400 });
  }

  try {
    // Options pour la requête fetch avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Récupérer le contenu depuis l'URL demandée avec retry
    const fetchWithRetry = async (url: string, maxRetries = 2) => {
      for (let i = 0; i <= maxRetries; i++) {
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/x-protobuf,application/vnd.mapbox-vector-tile,*/*',
              'User-Agent': 'Elegance-Mobilite/1.0 Map Proxy',
              'Origin': new URL(request.url).origin
            },
            cache: 'force-cache' // Utiliser le cache HTTP pour les performances
          });
          
          if (response.ok) return response;
          
          // Si erreur 429 (trop de requêtes), attendre avant de réessayer
          if (response.status === 429 && i < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            continue;
          }
          
          return response; // Renvoyer la réponse même en erreur si on a épuisé les tentatives
        } catch (e) {
          if (i === maxRetries) throw e;
          await new Promise(r => setTimeout(r, 800 * (i + 1)));
        }
      }
      throw new Error('Max retries reached');
    };
    
    const response = await fetchWithRetry(tileUrl).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) {
      throw new Error(`Erreur de proxying: ${response.status}`);
    }
    
    // Récupérer le corps et les headers
    const body = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    
    // Déterminer le bon content-type en fonction de l'extension ou du contenu
    let contentType = response.headers.get('content-type');
    if (!contentType || contentType === 'application/octet-stream') {
      if (tileUrl.endsWith('.pbf') || tileUrl.includes('pbf.pict')) {
        contentType = 'application/x-protobuf';
      } else if (tileUrl.endsWith('.mvt')) {
        contentType = 'application/vnd.mapbox-vector-tile';
      }
    }
    
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    
    // Ajouter les headers CORS nécessaires
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Origin, Accept');
    headers.set('Access-Control-Max-Age', '86400'); // Cache CORS preflight 24h
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache 24h
    
    // Retourner le contenu avec les headers modifiés
    return new NextResponse(body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Renvoyer une erreur plus informative
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Proxy error', 
      details: errorMessage,
      url: tileUrl
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

export async function OPTIONS() {
  // Gestion des requêtes OPTIONS pour CORS preflight
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  headers.set('Access-Control-Max-Age', '86400'); // Cache preflight 24h
  
  return new NextResponse(null, {
    status: 204, // No content
    headers
  });
}
