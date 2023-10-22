export function encode(txt) {
    return Buffer.from(txt).toString('hex');
}
export function decode(txt) {
    return Buffer.from(txt, 'hex').toString();
}
export function base64(str) {
    const binString = Array.from(new TextEncoder().encode(str), (x) => String.fromCodePoint(x)).join("");
    return btoa(binString);
}
export function deBase64(str) {
    const binString = atob(str);
    return new TextDecoder().decode(Uint8Array.from(binString, (m) => m.codePointAt(0)));
}

export function uriArgEncode(t){
    var o = Buffer.from(t).toString('hex').toUpperCase();
    var out = '';
    for (var i=0;i<o.length;i+=2){
        out+=`%${o.slice(i,i+2)}`;
    }
    return out;
}

export function uriArgDecode(t){
    return Buffer.from(t.replaceAll('%',''),'hex').toString();
}

export function buffBase64(buf){
    return btoa(buf);
}
