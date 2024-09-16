import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENCRYPTION_KEY = process.env.THE_SECRET_KEY;

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function encryptFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const encrypted = encrypt(content);
    fs.writeFileSync(filePath + '.enc', encrypted);
    console.log(`Encrypted: ${filePath}`);
}

function walkAndEncrypt(dir, fileTypes) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkAndEncrypt(filePath, fileTypes);
        } else if (fileTypes.includes(path.extname(file)) && !file.endsWith('.enc')) {
            encryptFile(filePath);
        }
    });
}

// Directories to encrypt
const directoriesToEncrypt = [
    path.join(__dirname, 'netlify', 'functions'),
    __dirname
];

// File types to encrypt
const fileTypesToEncrypt = ['.js', '.html', '.css'];

// Encrypt files in specified directories
directoriesToEncrypt.forEach(dir => {
    walkAndEncrypt(dir, fileTypesToEncrypt);
});