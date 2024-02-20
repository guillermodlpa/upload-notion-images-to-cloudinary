import https from 'https';

export default function downloadImageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, (response) => {
      const chunks: unknown[] = [];

      response.on('data', function (chunk) {
        chunks.push(chunk);
      });

      response.on('end', function () {
        const result = Buffer.concat(chunks as ReadonlyArray<Uint8Array>);
        resolve(result.toString('base64'));
      });
    });
    req.on('error', reject);
    req.end();
  });
}
