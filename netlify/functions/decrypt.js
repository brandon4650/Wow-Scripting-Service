const ENCRYPTION_KEY = process.env.THE_SECRET_KEY;

export function decrypt(text) {
    const textParts = text.split(':');
    const iv = new Uint8Array(textParts[0].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encryptedText = new Uint8Array(textParts[1].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const key = new TextEncoder().encode(ENCRYPTION_KEY);
    return crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['decrypt'])
        .then(key => crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, encryptedText))
        .then(decrypted => new TextDecoder().decode(decrypted));
}

export function loadAndDecrypt(url) {
    return fetch(url)
        .then(response => response.text())
        .then(encryptedCode => decrypt(encryptedCode))
        .then(decryptedCode => {
            const script = document.createElement('script');
            script.text = decryptedCode;
            document.head.appendChild(script);
        });
}