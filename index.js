const { createHash } = require('crypto');
let fs = require('file-system');
const AdmZip = require('adm-zip');
const signatureCreator = require("./signatureCreator");

const orderGenerator = {
    manifestJson: {},
    zipFile: AdmZip(),

    /**
     * generate manifest entry and add to global manifest json. The key is the pathname of the file relative to the top level of the order, for example order.json
     * The key is the SHA-256 hash, which will be converted in this method
     *
     * @param {string} key -  key is the pathname of the file relative to the top level of the order
     * @param {string} value - the value as string value, non converted as SHA-256 hash yet
     * @param {boolean} [isPath = true] - indicates, whether value is a path to read file for convertion or directly convert given value
     */
    async addManifestEntry(key, value, isPath = true) {
        if (key !== undefined && (key.trim()).length > 0
            && value !== undefined && (value.trim()).length > 0) {
            if (isPath) {
                this.manifestJson[key] = createHash('sha256')
                    .update(await fs.fs.readFileSync(value))
                    .digest('hex');
            } else {
                this.manifestJson[key] = createHash('sha256')
                    .update(value)
                    .digest('hex');
            }
        } else {
            console.warn("No entry added to manifest.json due to invalid key/value pair")
        }
    },

    /**
     * handle localization folder to copy all necessary entries to order
     *
     * @param {string} localizationFolderPath -  complete path string from template folder root perspective, for example: ./model.order/de.lproj
     * @param {string} relativePath - relative path string from de.lproj folder perspective
     * @param {string} modelFolderPath - template given optional filepath from project root level
     * @param {string[]} includePngFileNames - string array which contains all png file names with extension, which should be included to an order
     */
    async handleLocalizationFolder(localizationFolderPath, relativePath, modelFolderPath, includePngFileNames) {
        //copy complete localization folder to order
        this.zipFile.addLocalFolder(localizationFolderPath, relativePath);
        //read out all files of localization folder
        const localizationFiles = this.loadFileNames(localizationFolderPath);

        for (let localizationFile of localizationFiles) {
            let internalArray = localizationFile.name.split('.');
            const localizationFileType = internalArray[internalArray.length - 1];

            if (this.checkPngFileIncludeToOrder(localizationFile.name, includePngFileNames, localizationFileType) ||
                localizationFileType === `strings`) {
                const transformedLocalizationPath = (localizationFile.path).replace(`${modelFolderPath}/`, '');
                await this.addManifestEntry(transformedLocalizationPath, localizationFile.path);
            } else {
                //remove png file which is not within includePngFileNames
                const result = this.zipFile.getEntry((localizationFile.path).replace(`${modelFolderPath}/`, ''))
                this.zipFile.deleteFile(result)
            }
        }
    },

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
     * read out file names from given optional filepath from project root level
     * default from model.order folder from project root level from given file type
     *
     *
     * @param {string} [filePath = './model.order']
     * @param {string} fileType - get names of given file type like png, lproj...
     *
     * @returns {object[]} string array - translation directory names, otherwise return all file names
     */
    loadFileNames(filePath = './model.order', fileType) {
        let result = [];
        fs.fs.readdirSync(`${filePath}/`, {withFileTypes: true})
            .map(item => item.name)
            .filter(itemName => {
                if (fileType !== undefined && (fileType.trim()).length > 0) {
                    const array = itemName.split('.');
                    return array[array.length - 1] === `${fileType.trim()}`;
                }
                return itemName;
            })
            .map(itemName => result.push({name: itemName, path: `${filePath}/${itemName}`}));

        return result;
    },

    /**
     * check if png file is within array, which is specified as optional parameter to be included in an order
     * if the array is empty, all png files will be included
     *
     * @param {string} fileName - name of file with extension, for example: logo.png
     * @param {string[]} includePngFileNames - string array which contains all png file names with extension, which should be included to an order
     * @param {string} fileFormat - extension of file, for example: png, lproj...
     *
     * @returns {boolean} - true if given file is png file and within includePngFileNames
     */
    checkPngFileIncludeToOrder(fileName, includePngFileNames, fileFormat) {
        return (fileFormat === 'png' && (includePngFileNames.length === 0 ||
            includePngFileNames.find((entry) => entry === fileName)));
    },

    /**
     * generate signed order for import to Apple Wallet
     *
     * @param {any} updatedOrderJson - contains order details as JSON Object
     * @param {string} signerKeyPass - passphrase of signer key for decryption
     * @param {string[]} [includePngFileNames = []] - specify which pngs should be included in the signed order also within localization folders,
     * default include all png files which are inside the model.order folder
     * attention: all png file names which are inside order.json must be included in the signed order
     * @param {string} [modelFolderPath = './model.order'] - template given optional filepath from project root level
     * @param {string} [certFolderPath = './certs'] - certificates given optional filepath from project root level
     * @returns {any} signed order
     */
    async generateOrder(updatedOrderJson, signerKeyPass, includePngFileNames = [],
                        modelFolderPath = './model.order', certFolderPath = './certs') {
        let order = updatedOrderJson;
        this.manifestJson = {};
        this.zipFile = new AdmZip();

        this.zipFile.addFile("order.json", JSON.stringify(order), "", "");

        const allFiles = this.loadFileNames(modelFolderPath);

        for (let pngFile of allFiles) {
            let array = pngFile.name.split('.');
            const transformedPath = (pngFile.path).replace(`${modelFolderPath}/`, '');

            if (array[array.length - 1] === `lproj`) {
                await this.handleLocalizationFolder(pngFile.path, transformedPath, modelFolderPath, includePngFileNames);
            }

            //handle all files on root level
            if (this.checkPngFileIncludeToOrder(pngFile.name, includePngFileNames, array[array.length - 1])) {
                await this.addManifestEntry(transformedPath, pngFile.path);
                this.zipFile.addLocalFile(pngFile.path);
            }
        }

        await this.addManifestEntry('order.json', JSON.stringify(order), false);

        this.zipFile.addFile("manifest.json", JSON.stringify(this.manifestJson), "", "");

        const signature = await signatureCreator.getSignature(this.manifestJson, signerKeyPass, certFolderPath);

        this.zipFile.addFile("signature", signature, "", "");

        return this.zipFile
    }
}
module.exports = orderGenerator