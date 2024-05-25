const { createHash } = require('crypto');
let fs = require('file-system');
const forge = require('node-forge');
const AdmZip = require('adm-zip');

const orderGenerator = {
    async from() {
        let orderUnconverted = await fs.fs.readFileSync('./model.order/order.json');
        return JSON.parse(orderUnconverted, 'utf-8');
    },

    async generateOrder(updatedOrderJson, signerKeyPass) {
        let order = updatedOrderJson;

        const zipFile = new AdmZip();

        zipFile.addFile("order.json", JSON.stringify(order), "", "");

        const iconFile = await fs.fs.readFileSync('./model.order/icon.png');

        let manifestJson = {
            "icon.png": createHash('sha256').update(iconFile).digest('hex'),
            "order.json": createHash('sha256').update(JSON.stringify(order)).digest('hex')
        }

        zipFile.addFile("manifest.json", JSON.stringify(manifestJson), "", "");
        zipFile.addLocalFile('./model.order/icon.png');

        const signerCert = await fs.fs.readFileSync('./certs/signerCert.pem');
        const signerCertCertificate = forge.pki.certificateFromPem(signerCert);
        const signerKey = await fs.fs.readFileSync('./certs/signerKey.pem');
        const signerKeyCertificate = forge.pki.decryptRsaPrivateKey(signerKey, signerKeyPass)
        const wwdr = await fs.fs.readFileSync('./certs/wwdr.pem');
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
        const signature = Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), "binary");

        zipFile.addFile("signature", signature, "", "");

        return zipFile
    }
}
module.exports = orderGenerator