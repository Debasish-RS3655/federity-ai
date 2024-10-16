// manually generate the peerid
// Debashish Buragohain

import { generateKeyPair } from '@libp2p/crypto/keys';
import { createPeerId } from '@libp2p/peer-id';
import { createFromPrivKey } from '@libp2p/peer-id-factory';

async function createPeerId() {
    const privateKey = await generateKeyPair('RSA');
    return await createFromPrivKey(privateKey);
}

export { createPeerId };