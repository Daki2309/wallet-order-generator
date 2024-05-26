const { createHash } = require('crypto');
let fs = require('file-system');
const AdmZip = require('adm-zip');
const signatureCreator = require("./signatureCreator");

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

        const signature = await signatureCreator.getSignature(manifestJson, signerKeyPass, certFolderPath);

        zipFile.addFile("signature", signature, "", "");

        return zipFile
    }
}
module.exports = orderGenerator