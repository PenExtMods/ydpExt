
// ydpExt

// MIT License Copyright (c) 2023 Wxp

export namespace map{
    export const number = "1234567890";
    export const upperLetter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    export const lowerLetter = "abcdefghijklmnopqrstuvwxyz";
    export const letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    export const numberAndUpperLetter = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    export const numberAndLowerLetter = "1234567890abcdefghijklmnopqrstuvwxyz";
    export const hex = "1234567890abcdef";
    export const numberAndLetter = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    export const numberAndLetterAndSymbol = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+=/";
}

export function randomNumber(length:number){
    var out = '';
    while (true){
        var t = Math.random().toString().split('.')[1];
        out += t.slice(0,length-out.length);
        if (length<=t.length) break;
    }
    return parseInt(out);
}

export function randomString(length:number,map:string){
    var out = '';
    if (map.length==0) throw 'map is an empty string!';
    while (true){
        out += map[Math.floor(map.length*Math.random())];
        if (out.length==length) break;
    }
    return out;
}

export function randomUUID(){
    return `${randomString(8,map.hex)}-${randomString(4,map.hex)}-${randomString(4,map.hex)}-${randomString(4,map.hex)}-${randomString(12,map.hex)}`;
}