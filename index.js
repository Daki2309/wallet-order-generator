const { createHash } = require('crypto');
let fs = require('file-system');
const forge = require('node-forge');
const AdmZip = require('adm-zip');

const orderGenerator = {
    /**
     * read out template json for order creation from given optional filepath from project root level
     * default from model.order folder from project root level
     *
     * @param {string} [filePath = './model.order']
     *
     * @returns {any} json object
     */
    from(filePath = './model.order') {
        return JSON.parse(fs.fs.readFileSync(`${filePath}/order.json`), 'utf-8');
    },

    /**
     * read out png file names from given optional filepath from project root level
     * default from model.order folder from project root level
     *
     * @param {string} [filePath = './model.order']
     *
     * @returns {string[]} string array - png file names
     */
    getListOfPngFiles(filePath = './model.order') {
        return fs.fs.readdirSync(`${filePath}/`, {withFileTypes: true})
            .filter(item => !item.isDirectory())
            .map(item => item.name)
            .filter(itemName => {
                const array = itemName.split('.');
                return array[array.length - 1] === 'png';
            });
    },

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
    },

    /**
     * generate signed order for import to Apple Wallet
     *
     * @param {any} updatedOrderJson - contains order details as JSON Object
     * @param {string} signerKeyPass - passphrase of signer key for decryption
     * @param {string[]} [includePngFileNames = []] - specify which pngs should be included in the signed order,
     * default include all png files which are inside the model.order folder from project root level
     * attention: all png file names which are inside order.json must be included in the signed order
     * @param {string} [modelFolderPath = './model.order'] - template given optional filepath from project root level
     * @param {string} [certFolderPath = './certs'] - certificates given optional filepath from project root level
     * @returns {any} signed order
     */
    async generateOrder(updatedOrderJson, signerKeyPass, includePngFileNames = [],
                        modelFolderPath = './model.order', certFolderPath = './certs') {
        let order = updatedOrderJson;

        const zipFile = new AdmZip();

        zipFile.addFile("order.json", JSON.stringify(order), "", "");

        const pngFiles = includePngFileNames.length === 0? this.getListOfPngFiles(modelFolderPath) : includePngFileNames;

        let manifestJson = {};

        for (const pngFile of pngFiles) {
            manifestJson[pngFile] = createHash('sha256')
                .update(await fs.fs.readFileSync(`${modelFolderPath}/${pngFile}`))
                .digest('hex');
            zipFile.addLocalFile(`${modelFolderPath}/${pngFile}`);
        }

        manifestJson['order.json'] = createHash('sha256')
            .update(JSON.stringify(order))
            .digest('hex');

        zipFile.addFile("manifest.json", JSON.stringify(manifestJson), "", "");

        const signature = await this.getSignature(manifestJson, signerKeyPass, certFolderPath);

        zipFile.addFile("signature", signature, "", "");

        return zipFile
    }
}
module.exports = orderGenerator