const orderGenerator = require('../index.js');
const signerCreator = require('../signatureCreator.js');
const fs = require('file-system')

test('from: get json', () => {
    let result = orderGenerator.from('./tests/source');

    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
});

test('addManifestEntry: isPath use default value', async () => {
    const mock = jest.spyOn(fs.fs, 'readFileSync');

    await orderGenerator.addManifestEntry("order.json", "./tests/source/order.json");

    expect(mock).toHaveBeenCalledWith('./tests/source/order.json');
    expect(orderGenerator.manifestJson['order.json']).toEqual("ac10b48ca4d41dd54d03e2114f6c064548998bd552fc4efcefeec2cca0743fd7");

    orderGenerator.manifestJson = {};

    expect(orderGenerator.manifestJson).toEqual({});

    await orderGenerator.addManifestEntry("order.json", "./tests/source/order.json");

    expect(orderGenerator.manifestJson['order.json']).toEqual("ac10b48ca4d41dd54d03e2114f6c064548998bd552fc4efcefeec2cca0743fd7");

    orderGenerator.manifestJson = {};
});

test('addManifestEntry: isPath = true', async () => {
    const mock = jest.spyOn(fs.fs, 'readFileSync');

    await orderGenerator.addManifestEntry("order.json", "./tests/source/order.json", true);

    expect(mock).toHaveBeenCalledWith('./tests/source/order.json');
    expect(orderGenerator.manifestJson['order.json']).toEqual("ac10b48ca4d41dd54d03e2114f6c064548998bd552fc4efcefeec2cca0743fd7");

    orderGenerator.manifestJson = {};
});

test('addManifestEntry: isPath = false', async () => {
    const mock = jest.spyOn(fs.fs, 'readFileSync');

    await orderGenerator.addManifestEntry("order.json", "{'key' : 'abc'}", false);

    expect(mock).not.toHaveBeenCalled();
    expect(orderGenerator.manifestJson['order.json']).toEqual("051b934ae47d5dc21a5cf3aa36c20d598bd84b2a6e6ccb0899e3e99a3935b1e4");

    orderGenerator.manifestJson = {};
});

test('addManifestEntry: key is undefined', async () => {
    await orderGenerator.addManifestEntry(undefined, "{'key' : 'abc'}");

    expect(orderGenerator.manifestJson).toEqual({});

    orderGenerator.manifestJson = {};
});

test('addManifestEntry: key is empty', async () => {
    await orderGenerator.addManifestEntry("", "{'key' : 'abc'}");

    expect(orderGenerator.manifestJson).toEqual({});

    orderGenerator.manifestJson = {};
});

test('addManifestEntry: key contains only space', async () => {
    await orderGenerator.addManifestEntry(" ", "{'key' : 'abc'}");

    expect(orderGenerator.manifestJson).toEqual({});

    orderGenerator.manifestJson = {};
});

test('addManifestEntry: value is undefined', async () => {
    await orderGenerator.addManifestEntry("order.json", undefined);

    expect(orderGenerator.manifestJson).toEqual({});

    orderGenerator.manifestJson = {};
});

test('addManifestEntry: value is empty', async () => {
    await orderGenerator.addManifestEntry("order.json", "");

    expect(orderGenerator.manifestJson).toEqual({});

    orderGenerator.manifestJson = {};
});

test('addManifestEntry: value contains only space', async () => {
    await orderGenerator.addManifestEntry(" ", " ");

    expect(orderGenerator.manifestJson).toEqual({});

    orderGenerator.manifestJson = {};
});

test('handleLocalizationFolder: add all files', async () => {
    await orderGenerator.handleLocalizationFolder("./tests/source/de.lproj", "de.lproj", "./tests/source", []);

    expect(orderGenerator.manifestJson['de.lproj/logo.png']).not.toBeUndefined();
    expect(orderGenerator.manifestJson['de.lproj/logo.png']).toEqual("a3efbf7d8a8406393c8efd99a2983a6977db491bc54eb01ce80f97ddaf9c798c");
    expect(orderGenerator.manifestJson['de.lproj/order.strings']).not.toBeUndefined();
    expect(orderGenerator.manifestJson['de.lproj/order.strings']).toEqual("6225c2d5dc5cf2a7f025a80a2a8af05a036157492a20156e795a47d5fd239991");
    expect(orderGenerator.manifestJson['de.lproj/pastry.png']).not.toBeUndefined();
    expect(orderGenerator.manifestJson['de.lproj/pastry.png']).toEqual("0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1");

    expect(orderGenerator.manifestJson).toEqual({
        "de.lproj/logo.png": "a3efbf7d8a8406393c8efd99a2983a6977db491bc54eb01ce80f97ddaf9c798c",
        "de.lproj/order.strings": "6225c2d5dc5cf2a7f025a80a2a8af05a036157492a20156e795a47d5fd239991",
        "de.lproj/pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1"
        })
    orderGenerator.manifestJson = {};
});

test('handleLocalizationFolder: exclude pastry.png', async () => {
    await orderGenerator.handleLocalizationFolder("./tests/source/de.lproj", "de.lproj", "./tests/source", ["logo.png"]);

    expect(orderGenerator.manifestJson['de.lproj/logo.png']).not.toBeUndefined();
    expect(orderGenerator.manifestJson['de.lproj/logo.png']).toEqual("a3efbf7d8a8406393c8efd99a2983a6977db491bc54eb01ce80f97ddaf9c798c");
    expect(orderGenerator.manifestJson['de.lproj/order.strings']).not.toBeUndefined();
    expect(orderGenerator.manifestJson['de.lproj/order.strings']).toEqual("6225c2d5dc5cf2a7f025a80a2a8af05a036157492a20156e795a47d5fd239991");
    expect(orderGenerator.manifestJson['de.lproj/pastry.png']).toBeUndefined();

    expect(orderGenerator.manifestJson).toEqual({
        "de.lproj/logo.png": "a3efbf7d8a8406393c8efd99a2983a6977db491bc54eb01ce80f97ddaf9c798c",
        "de.lproj/order.strings": "6225c2d5dc5cf2a7f025a80a2a8af05a036157492a20156e795a47d5fd239991"
    })
});


test('loadFileNames: load all png files from root level (without localization folders)', () => {
    let result = orderGenerator.loadFileNames('./tests/source', 'png');

    expect(result.length).toEqual(4);
    //0
    expect(result.find((entry) => entry.name === 'logo.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/logo.png')).toBeFalsy();
    //1
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/pastry.png')).toBeFalsy();
    //2
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/logo.png')).toBeFalsy();
    //3
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/pastry.png')).toBeFalsy();
    //4
    expect(result.find((entry) => entry.name === 'bakery_logo.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/bakery_logo.png')).toBeTruthy();
    //5
    expect(result.find((entry) => entry.name === 'pastry.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/pastry.png')).toBeTruthy();
    //6
    expect(result.find((entry) => entry.name === 'spongecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/spongecake.png')).toBeTruthy();
    //7
    expect(result.find((entry) => entry.name === 'cheesecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/cheesecake.png')).toBeTruthy();
    //8
    expect(result.find((entry) => entry.name === 'order.json')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/order.json')).toBeFalsy();
    //9
    expect(result.find((entry) => entry.name === 'de.lproj')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj')).toBeFalsy();
    //10
    expect(result.find((entry) => entry.name === 'en.lproj')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/en.lproj')).toBeFalsy();
    //11
    expect(result.find((entry) => entry.name === 'order.strings')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/order.strings')).toBeFalsy();
    //12
    expect(result.find((entry) => entry.name === 'order.strings')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/order.strings')).toBeFalsy();
});

test('loadFileNames: remove white space from fileType parameter', () => {
    let result = orderGenerator.loadFileNames('./tests/source', 'png ');

    expect(result.length).toEqual(4);
    //0
    expect(result.find((entry) => entry.name === 'logo.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/logo.png')).toBeFalsy();
    //1
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/pastry.png')).toBeFalsy();
    //2
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/logo.png')).toBeFalsy();
    //3
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/pastry.png')).toBeFalsy();
    //4
    expect(result.find((entry) => entry.name === 'bakery_logo.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/bakery_logo.png')).toBeTruthy();
    //5
    expect(result.find((entry) => entry.name === 'pastry.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/pastry.png')).toBeTruthy();
    //6
    expect(result.find((entry) => entry.name === 'spongecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/spongecake.png')).toBeTruthy();
    //7
    expect(result.find((entry) => entry.name === 'cheesecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/cheesecake.png')).toBeTruthy();
    //8
    expect(result.find((entry) => entry.name === 'order.json')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/order.json')).toBeFalsy();
    //9
    expect(result.find((entry) => entry.name === 'de.lproj')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj')).toBeFalsy();
    //10
    expect(result.find((entry) => entry.name === 'en.lproj')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/en.lproj')).toBeFalsy();
    //11
    expect(result.find((entry) => entry.name === 'order.strings')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/order.strings')).toBeFalsy();
    //12
    expect(result.find((entry) => entry.name === 'order.strings')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/order.strings')).toBeFalsy();
});

test('loadFileNames: load all lproj files', () => {
    let result = orderGenerator.loadFileNames('./tests/source', 'lproj');

    expect(result.length).toEqual(2);
    //0
    expect(result.find((entry) => entry.name === 'de.lproj')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj')).toBeTruthy();
    //1
    expect(result.find((entry) => entry.name === 'en.lproj')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/en.lproj')).toBeTruthy();
    //2
    expect(result.find((entry) => entry.name === 'logo.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/logo.png')).toBeFalsy();
    //3
    expect(result.find((entry) => entry.name === 'pastry.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/pastry.png')).toBeFalsy();
    //4
    expect(result.find((entry) => entry.name === 'logo.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/logo.png')).toBeFalsy();
    //5
    expect(result.find((entry) => entry.name === 'pastry.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/pastry.png')).toBeFalsy();
    //6
    expect(result.find((entry) => entry.name === 'bakery_logo.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/bakery_logo.png')).toBeFalsy();
    //7
    expect(result.find((entry) => entry.name === 'pastry.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/pastry.png')).toBeFalsy();
    //8
    expect(result.find((entry) => entry.name === 'spongecake.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/spongecake.png')).toBeFalsy();
    //9
    expect(result.find((entry) => entry.name === 'cheesecake.png')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/cheesecake.png')).toBeFalsy();
    //10
    expect(result.find((entry) => entry.name === 'order.json')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/order.json')).toBeFalsy();
    //11
    expect(result.find((entry) => entry.name === 'order.strings')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/order.strings')).toBeFalsy();
    //12
    expect(result.find((entry) => entry.name === 'order.strings')).toBeFalsy();
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/order.strings')).toBeFalsy();
});

test('loadFileNames: get all file names when fileType is undefined', () => {
    let result = orderGenerator.loadFileNames('./tests/source');

    expect(result.length).toEqual(7);
    //0
    expect(result.find((entry) => entry.name === 'de.lproj')).toBeTruthy();
    //1
    expect(result.find((entry) => entry.name === 'en.lproj')).toBeTruthy();
    //2
    expect(result.find((entry) => entry.name === 'logo.png')).toBeFalsy();
    //3
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/pastry.png')).toBeFalsy();
    //4
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/logo.png')).toBeFalsy();
    //5
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/pastry.png')).toBeFalsy();
    //6
    expect(result.find((entry) => entry.name === 'bakery_logo.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/bakery_logo.png')).toBeTruthy();
    //7
    expect(result.find((entry) => entry.name === 'pastry.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/pastry.png')).toBeTruthy();
    //8
    expect(result.find((entry) => entry.name === 'spongecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/spongecake.png')).toBeTruthy();
    //9
    expect(result.find((entry) => entry.name === 'cheesecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/cheesecake.png')).toBeTruthy();
    //10
    expect(result.find((entry) => entry.name === 'order.json')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/order.json')).toBeTruthy();
    //11
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/order.strings')).toBeFalsy();
    //12
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/order.strings')).toBeFalsy();
});

test('loadFileNames: get all file names when fileType is empty string', () => {
    let result = orderGenerator.loadFileNames('./tests/source', '');

    expect(result.length).toEqual(7);
    //0
    expect(result.find((entry) => entry.name === 'de.lproj')).toBeTruthy();
    //1
    expect(result.find((entry) => entry.name === 'en.lproj')).toBeTruthy();
    //2
    expect(result.find((entry) => entry.name === 'logo.png')).toBeFalsy();
    //3
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/pastry.png')).toBeFalsy();
    //4
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/logo.png')).toBeFalsy();
    //5
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/pastry.png')).toBeFalsy();
    //6
    expect(result.find((entry) => entry.name === 'bakery_logo.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/bakery_logo.png')).toBeTruthy();
    //7
    expect(result.find((entry) => entry.name === 'pastry.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/pastry.png')).toBeTruthy();
    //8
    expect(result.find((entry) => entry.name === 'spongecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/spongecake.png')).toBeTruthy();
    //9
    expect(result.find((entry) => entry.name === 'cheesecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/cheesecake.png')).toBeTruthy();
    //10
    expect(result.find((entry) => entry.name === 'order.json')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/order.json')).toBeTruthy();
    //11
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/order.strings')).toBeFalsy();
    //12
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/order.strings')).toBeFalsy();
});

test('loadFileNames: get all file names when fileType contains only space', () => {
    let result = orderGenerator.loadFileNames('./tests/source', ' ');

    expect(result.length).toEqual(7);
    //0
    expect(result.find((entry) => entry.name === 'de.lproj')).toBeTruthy();
    //1
    expect(result.find((entry) => entry.name === 'en.lproj')).toBeTruthy();
    //2
    expect(result.find((entry) => entry.name === 'logo.png')).toBeFalsy();
    //3
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/pastry.png')).toBeFalsy();
    //4
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/logo.png')).toBeFalsy();
    //5
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/pastry.png')).toBeFalsy();
    //6
    expect(result.find((entry) => entry.name === 'bakery_logo.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/bakery_logo.png')).toBeTruthy();
    //7
    expect(result.find((entry) => entry.name === 'pastry.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/pastry.png')).toBeTruthy();
    //8
    expect(result.find((entry) => entry.name === 'spongecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/spongecake.png')).toBeTruthy();
    //9
    expect(result.find((entry) => entry.name === 'cheesecake.png')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/cheesecake.png')).toBeTruthy();
    //10
    expect(result.find((entry) => entry.name === 'order.json')).toBeTruthy();
    expect(result.find((entry) => entry.path === './tests/source/order.json')).toBeTruthy();
    //11
    expect(result.find((entry) => entry.path === './tests/source/de.lproj/order.strings')).toBeFalsy();
    //12
    expect(result.find((entry) => entry.path === './tests/source/en.lproj/order.strings')).toBeFalsy();
});

test('checkPngFileIncludeToOrder: includePngFileNames is empty and fileFormat is png', () => {
    expect(orderGenerator.checkPngFileIncludeToOrder("logo.png", [], "png")).toBeTruthy()
});

test('checkPngFileIncludeToOrder: includePngFileNames contains given file name and fileFormat is png', () => {
    expect(orderGenerator.checkPngFileIncludeToOrder("logo.png", ["logo.png"], "png")).toBeTruthy()
});

test('checkPngFileIncludeToOrder: includePngFileNames does not contain given file name and fileFormat is png', () => {
    expect(orderGenerator.checkPngFileIncludeToOrder("logo.png", ["pastry.png"], "png")).toBeFalsy()
});

test('checkPngFileIncludeToOrder: fileFormat is strings', () => {
    expect(orderGenerator.checkPngFileIncludeToOrder("order.strings", [], "strings")).toBeFalsy()
});

test('generateOrder fail: use default folder path ./model.order for template folder', async () => {
    let orderInstance = orderGenerator.from('./tests/source');
    try {
        await orderGenerator.generateOrder(orderInstance, "123456789")
    } catch (e) {
        expect(e.code).toEqual('ENOENT');
        expect(e.path).toEqual('./model.order/');
    }
});

test('generateOrder: use specified folder path ./tests/source for template folder', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => true);

    let orderInstance = orderGenerator.from('./tests/source');

    await orderGenerator.generateOrder(orderInstance, "123456789", undefined, './tests/source')

    expect(mock).toHaveBeenCalledWith({
            "bakery_logo.png": "80fac49e058e813ebfd974e5dd77002fb7ddcb1b931e64fc014c7b3f2227bb2e",
            "cheesecake.png": "468339dbe7f0674416f90dd94f62d2015595d71ec95eff6232cb34d7d2f91d6b",
            "order.json": "996161a2d31077d1c22e296c07732ff10b96c583b959e6ffdaf0472e8043c56f",
            "pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
            "spongecake.png": "3d4e67f90f7a669cfbc58ddf7dfcb13150ee85773901b1103a3896b2e5354fd5",
            "en.lproj/order.strings": "ae56afe5e80d55f375bb5269aa3f0e7da6678dfce8078231585a03b3f8c3a140",
            "en.lproj/logo.png": "89fd1b8c03068a2977db7b52fefae53725f4bfefd37f86a3f99c9b25134d39a9",
            "en.lproj/pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
            "de.lproj/order.strings": "6225c2d5dc5cf2a7f025a80a2a8af05a036157492a20156e795a47d5fd239991",
            "de.lproj/logo.png": "a3efbf7d8a8406393c8efd99a2983a6977db491bc54eb01ce80f97ddaf9c798c",
            "de.lproj/pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1"
        },
        '123456789',
        './certs')
});

test('generateOrder: use default includePngFileNames to import all available png files', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => true);

    const loadFileNamesSpy = jest.spyOn(orderGenerator, 'loadFileNames');

    let orderInstance = orderGenerator.from('./tests/source');

    await orderGenerator.generateOrder(orderInstance, "123456789", undefined, './tests/source')

    expect(loadFileNamesSpy).toHaveBeenCalledWith('./tests/source');
});

test('generateOrder: use given includePngFileNames to import only given png file name', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => true);

    const loadFileNamesSpy = jest.spyOn(orderGenerator, 'loadFileNames');

    let orderInstance = orderGenerator.from('./tests/source');

    await orderGenerator.generateOrder(orderInstance, "123456789", ['pastry.png'], './tests/source')

    expect(loadFileNamesSpy).toHaveBeenCalledWith('./tests/source');

    expect(mock).toHaveBeenCalledWith({
            "order.json": "996161a2d31077d1c22e296c07732ff10b96c583b959e6ffdaf0472e8043c56f",
            "pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
            "en.lproj/order.strings": "ae56afe5e80d55f375bb5269aa3f0e7da6678dfce8078231585a03b3f8c3a140",
            "en.lproj/pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
            "de.lproj/order.strings": "6225c2d5dc5cf2a7f025a80a2a8af05a036157492a20156e795a47d5fd239991",
            "de.lproj/pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1"
        },
        '123456789',
        './certs')
});

test('generateOrder fail: use default folder path ./certs for certs folder', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => {
        const error = new Error("no such file or directory");
        error.path = './certs/signerCert.pem';
        error.code = "ENOENT";
        throw error;
    });

    let orderInstance = orderGenerator.from('./tests/source');

    try {
        await orderGenerator.generateOrder(orderInstance, "123456789", undefined, './tests/source')
    } catch (e) {
        expect(e.code).toEqual('ENOENT');
        expect(e.path).toEqual('./certs/signerCert.pem');
    }

    expect(mock).toHaveBeenCalledWith({
        "bakery_logo.png": "80fac49e058e813ebfd974e5dd77002fb7ddcb1b931e64fc014c7b3f2227bb2e",
        "cheesecake.png": "468339dbe7f0674416f90dd94f62d2015595d71ec95eff6232cb34d7d2f91d6b",
        "order.json": "996161a2d31077d1c22e296c07732ff10b96c583b959e6ffdaf0472e8043c56f",
        "pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
        "spongecake.png": "3d4e67f90f7a669cfbc58ddf7dfcb13150ee85773901b1103a3896b2e5354fd5",
        "en.lproj/order.strings": "ae56afe5e80d55f375bb5269aa3f0e7da6678dfce8078231585a03b3f8c3a140",
        "en.lproj/logo.png": "89fd1b8c03068a2977db7b52fefae53725f4bfefd37f86a3f99c9b25134d39a9",
        "en.lproj/pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
        "de.lproj/order.strings": "6225c2d5dc5cf2a7f025a80a2a8af05a036157492a20156e795a47d5fd239991",
        "de.lproj/logo.png": "a3efbf7d8a8406393c8efd99a2983a6977db491bc54eb01ce80f97ddaf9c798c",
        "de.lproj/pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1"
        },
        '123456789',
        './certs')
});

test('generateOrder fail: use specified folder path ./tests/source for certs folder', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => true);

    let orderInstance = orderGenerator.from('./tests/source');

    await orderGenerator.generateOrder(orderInstance, "123456789", undefined, './tests/source', './tests/source')

    expect(mock).toHaveBeenCalledWith({
            "bakery_logo.png": "80fac49e058e813ebfd974e5dd77002fb7ddcb1b931e64fc014c7b3f2227bb2e",
            "cheesecake.png": "468339dbe7f0674416f90dd94f62d2015595d71ec95eff6232cb34d7d2f91d6b",
            "order.json": "996161a2d31077d1c22e296c07732ff10b96c583b959e6ffdaf0472e8043c56f",
            "pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
            "spongecake.png": "3d4e67f90f7a669cfbc58ddf7dfcb13150ee85773901b1103a3896b2e5354fd5",
            "en.lproj/order.strings": "ae56afe5e80d55f375bb5269aa3f0e7da6678dfce8078231585a03b3f8c3a140",
            "en.lproj/logo.png": "89fd1b8c03068a2977db7b52fefae53725f4bfefd37f86a3f99c9b25134d39a9",
            "en.lproj/pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
            "de.lproj/order.strings": "6225c2d5dc5cf2a7f025a80a2a8af05a036157492a20156e795a47d5fd239991",
            "de.lproj/logo.png": "a3efbf7d8a8406393c8efd99a2983a6977db491bc54eb01ce80f97ddaf9c798c",
            "de.lproj/pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1"
        },
        '123456789',
        './tests/source')
});