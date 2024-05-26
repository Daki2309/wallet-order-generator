const forge = require('node-forge');
let fs = require('file-system');

const signatureCreator = {
    /**
     * generate signature
     *
     * @param {{}} manifestJson - contains a dictionary of the SHA-256 hashes for each of the source files for the order.
     * The dictionary key is the pathname of the file relative to the top level of the order, and the value is the SHA-256 hash.
     * @param {string} signerKeyPass - passphrase of signer key for decryption
     * @param {string} [filePath = './certs'] - load certificate from given optional filepath from project root level,
     * default from certs folder from project root level
     *
     * @returns {any} signature
     */
    async getSignature(manifestJson, signerKeyPass, filePath = './certs') {
        const signerCert = await fs.fs.readFileSync(`${filePath}/signerCert.pem`);
        const signerCertCertificate = forge.pki.certificateFromPem(signerCert);
        const signerKey = await fs.fs.readFileSync(`${filePath}/signerKey.pem`);
        const signerKeyCertificate = forge.pki.decryptRsaPrivateKey(signerKey, signerKeyPass)
        const wwdr = await fs.fs.readFileSync(`${filePath}/wwdr.pem`);
        const wwdrCertificate = forge.pki.certificateFromPem(wwdr);

        let p7 = forge.pkcs7.createSignedData();

        p7.content = forge.util.createBuffer(
            JSON.stringify(manifestJson),
            "utf8",
        );

        p7.addCertificate(wwdrCertificate);
        p7.addCertificate(signerCertCertificate);
        p7.addSigner({
            key: signerKeyCertificate,
            certificate: signerCertCertificate,
            digestAlgorithm: forge.pki.oids.sha256,
            authenticatedAttributes: [
                {
                    type: forge.pki.oids.contentType,
                    value: forge.pki.oids.data
                },
                {
                    type: forge.pki.oids.messageDigest,
                },
                {
                    type: forge.pki.oids.signingTime,
                }
            ]
        });
        await p7.sign({detached: true});
        return Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), "binary");
    }
}

module.exports = signatureCreator