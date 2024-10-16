// encryption and decryption functions are specified here
// Debashish Buragohain

import Gun from "gun";
import 'gun/sea';

const SEA = Gun.SEA;

async function encrypt(msg, pair) {
    const enc = await SEA.encrypt(msg, pair);
    return await SEA.sign(enc, pair);
}
async function decrypt(sign, pair) {
    const verified = await SEA.verify(sign, pair.pub);
    return await SEA.decrypt(verified, pair);
}

export { encrypt, decrypt };