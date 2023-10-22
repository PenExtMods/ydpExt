export var map;
(function (map) {
    map.number = "1234567890";
    map.upperLetter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    map.lowerLetter = "abcdefghijklmnopqrstuvwxyz";
    map.letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    map.numberAndUpperLetter = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    map.numberAndLowerLetter = "1234567890abcdefghijklmnopqrstuvwxyz";
    map.hex = "1234567890abcdef";
    map.numberAndLetter = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    map.numberAndLetterAndSymbol = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+=/";
})(map || (map = {}));
export function randomNumber(length) {
    var out = '';
    while (true) {
        var t = Math.random().toString().split('.')[1];
        out += t.slice(0, length - out.length);
        if (length <= t.length)
            break;
    }
    return parseInt(out);
}
export function randomString(length, map) {
    var out = '';
    if (map.length == 0)
        throw 'map is an empty string!';
    while (true) {
        out += map[Math.floor(map.length * Math.random())];
        if (out.length == length)
            break;
    }
    return out;
}
export function randomUUID() {
    return `${randomString(8, map.hex)}-${randomString(4, map.hex)}-${randomString(4, map.hex)}-${randomString(4, map.hex)}-${randomString(12, map.hex)}`;
}
